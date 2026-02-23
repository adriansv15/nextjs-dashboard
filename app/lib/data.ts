import { PrismaClient } from '@prisma/client';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
  FormattedCustomersTable,
  CustomerForm,
} from './definitions';
import { formatCurrency } from './utils';

const prisma = new PrismaClient();

export async function fetchRevenue() {
  try {
    // Keep the artificial delay for demo parity
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await prisma.revenue.findMany();

    console.log('Data fetch completed after 3 seconds.');

    return data as unknown as Revenue[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await prisma.invoices.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: { customer: true },
    });

    const latestInvoices = data.map((invoice) => ({
      id: invoice.id,
      amount: formatCurrency(invoice.amount),
      name: invoice.customer.name,
      image_url: invoice.customer.image_url,
      email: invoice.customer.email,
    }));

    return latestInvoices as unknown as LatestInvoiceRaw[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const [numberOfInvoices, numberOfCustomers, paidAgg, pendingAgg] = await Promise.all([
      prisma.invoices.count(),
      prisma.customers.count(),
      prisma.invoices.aggregate({ _sum: { amount: true }, where: { status: 'paid' } }),
      prisma.invoices.aggregate({ _sum: { amount: true }, where: { status: 'pending' } }),
    ]);

    const totalPaidInvoices = formatCurrency(paidAgg._sum.amount ?? 0);
    const totalPendingInvoices = formatCurrency(pendingAgg._sum.amount ?? 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Build dynamic where clause based on query type
    const whereConditions: any[] = [
      { customer: { name: { contains: query, mode: 'insensitive' } } },
      { customer: { email: { contains: query, mode: 'insensitive' } } },
      { status: { contains: query, mode: 'insensitive' } },
    ];

    // Only add amount filter if query is a valid number
    const queryAsNumber = Number(query);
    if (!isNaN(queryAsNumber) && queryAsNumber > 0) {
      whereConditions.push({ amount: { equals: queryAsNumber } });
    }

    // Only add date filter if query is a valid date string
    const queryAsDate = new Date(query);
    if (!isNaN(queryAsDate.getTime()) && query.length >= 10) {
      whereConditions.push({ date: { equals: queryAsDate } });
    }

    const invoices = await prisma.invoices.findMany({
      where: {
        AND: [
          { customer: { isNot: null } }, // Ensure customer exists
          {
            OR: whereConditions,
          }
        ]
      },
      include: { customer: true },
      orderBy: { date: 'desc' },
      take: ITEMS_PER_PAGE,
      skip: offset,
    });

    // Map to the original shape expected by the UI
    return invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      date: inv.date.toISOString().split('T')[0],
      status: inv.status,
      name: inv.customer.name,
      email: inv.customer.email,
      image_url: inv.customer.image_url,
    })) as unknown as InvoicesTable[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    // Build dynamic where clause based on query type (same logic as fetchFilteredInvoices)
    const whereConditions: any[] = [
      { customer: { name: { contains: query, mode: 'insensitive' } } },
      { customer: { email: { contains: query, mode: 'insensitive' } } },
      { status: { contains: query, mode: 'insensitive' } },
    ];

    // Only add amount filter if query is a valid number
    const queryAsNumber = Number(query);
    if (!isNaN(queryAsNumber) && queryAsNumber > 0) {
      whereConditions.push({ amount: { equals: queryAsNumber } });
    }

    // Only add date filter if query is a valid date string
    const queryAsDate = new Date(query);
    if (!isNaN(queryAsDate.getTime()) && query.length >= 10) {
      whereConditions.push({ date: { equals: queryAsDate } });
    }

    const count = await prisma.invoices.count({
      where: {
        AND: [
          { customer: { isNot: null } }, // Ensure customer exists
          {
            OR: whereConditions,
          }
        ]
      },
    });

    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoices.findUnique({ where: { id } });
    if (!invoice) return null;

    return {
      id: invoice.id,
      customer_id: invoice.customer_id,
      amount: invoice.amount / 100,
      status: invoice.status,
    } as unknown as InvoiceForm;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await prisma.customers.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    return customers as unknown as CustomerField[];
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string): Promise<FormattedCustomersTable[]> {
  try {
    const customers = await prisma.customers.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { invoices: true },
      orderBy: { name: 'asc' },
    });

    const mapped = customers.map((customer) => {
      const total_invoices = customer.invoices.length;
      const total_pending = customer.invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
      const total_paid = customer.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
        total_invoices,
        total_pending: formatCurrency(total_pending),
        total_paid: formatCurrency(total_paid),
      } as unknown as FormattedCustomersTable;
    });

    return mapped;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function fetchCustomerById(id: string) {
  try {
    const customer = await prisma.customers.findUnique({ where: { id } });
    if (!customer) return null;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    } as unknown as CustomerForm;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer.');
  }
}
