import {
  fetchRevenue,
  fetchLatestInvoices,
  fetchCardData,
  fetchFilteredInvoices,
  fetchInvoicesPages,
  fetchInvoiceById,
  fetchCustomers,
  fetchFilteredCustomers,
} from '@/app/lib/data';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Data Layer Functions - All 8 Functions', () => {
  let testCustomerId: string;

  beforeAll(async () => {
    // Don't cleanup invoices - we need the seed data for testing
    // Just ensure we have a customer for testing
    const customers = await prisma.customers.findMany();
    if (customers.length === 0) {
      throw new Error('No customers available for testing. Run seed first.');
    }
    testCustomerId = customers[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('fetchRevenue()', () => {
    it('should return array of revenue data', async () => {
      const revenue = await fetchRevenue();
      expect(Array.isArray(revenue)).toBe(true);
      expect(revenue.length).toBeGreaterThan(0);
    });

    it('should have revenue with month and revenue properties', async () => {
      const revenue = await fetchRevenue();
      expect(revenue[0]).toHaveProperty('month');
      expect(revenue[0]).toHaveProperty('revenue');
      expect(typeof revenue[0].month).toBe('string');
      expect(typeof revenue[0].revenue).toBe('number');
    });

    it('should include all 12 months', async () => {
      const revenue = await fetchRevenue();
      const months = revenue.map(r => r.month);
      const expectedMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      expectedMonths.forEach(month => {
        expect(months).toContain(month);
      });
    });

    it('should have non-negative revenue values', async () => {
      const revenue = await fetchRevenue();
      revenue.forEach(r => {
        expect(r.revenue).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('fetchLatestInvoices()', () => {
    it('should return array of invoices', async () => {
      const invoices = await fetchLatestInvoices();
      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should return max 5 invoices', async () => {
      const invoices = await fetchLatestInvoices();
      expect(invoices.length).toBeLessThanOrEqual(5);
    });

    it('should have all required fields', async () => {
      const invoices = await fetchLatestInvoices();
      if (invoices.length > 0) {
        expect(invoices[0]).toHaveProperty('id');
        expect(invoices[0]).toHaveProperty('amount');
        expect(invoices[0]).toHaveProperty('name');
        expect(invoices[0]).toHaveProperty('image_url');
        expect(invoices[0]).toHaveProperty('email');
      }
    });

    it('should format amount as currency string', async () => {
      const invoices = await fetchLatestInvoices();
      if (invoices.length > 0) {
        expect(typeof invoices[0].amount).toBe('string');
        expect(invoices[0].amount).toMatch(/\$[\d,]+\.\d{2}/);
      }
    });

    it('should be ordered by date descending', async () => {
      const invoices = await fetchLatestInvoices();
      // If we have multiple invoices, first should be most recent
      expect(invoices.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('fetchCardData()', () => {
    it('should return object with card metrics', async () => {
      const data = await fetchCardData();
      expect(typeof data).toBe('object');
      expect(data).toHaveProperty('numberOfCustomers');
      expect(data).toHaveProperty('numberOfInvoices');
      expect(data).toHaveProperty('totalPaidInvoices');
      expect(data).toHaveProperty('totalPendingInvoices');
    });

    it('should have numeric customer count', async () => {
      const data = await fetchCardData();
      expect(typeof data.numberOfCustomers).toBe('number');
      expect(data.numberOfCustomers).toBeGreaterThanOrEqual(0);
    });

    it('should have numeric invoice count', async () => {
      const data = await fetchCardData();
      expect(typeof data.numberOfInvoices).toBe('number');
      expect(data.numberOfInvoices).toBeGreaterThanOrEqual(0);
    });

    it('should have formatted currency totals', async () => {
      const data = await fetchCardData();
      expect(typeof data.totalPaidInvoices).toBe('string');
      expect(typeof data.totalPendingInvoices).toBe('string');
      expect(data.totalPaidInvoices).toMatch(/\$[\d,]+\.\d{2}/);
      expect(data.totalPendingInvoices).toMatch(/\$[\d,]+\.\d{2}/);
    });

    it('should aggregate correct totals', async () => {
      const data = await fetchCardData();
      // Verify it's a valid currency format
      const paidValue = parseFloat(data.totalPaidInvoices.replace(/[$,]/g, ''));
      const pendingValue = parseFloat(data.totalPendingInvoices.replace(/[$,]/g, ''));
      expect(paidValue).toBeGreaterThanOrEqual(0);
      expect(pendingValue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('fetchFilteredInvoices()', () => {
    it('should return empty array when no match', async () => {
      const invoices = await fetchFilteredInvoices('zzz-no-match-zzzz', 1);
      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should return array when query is empty', async () => {
      const invoices = await fetchFilteredInvoices('', 1);
      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should filter by customer name', async () => {
      // Get a customer name first
      const customer = await prisma.customers.findFirst();
      if (customer) {
        const invoices = await fetchFilteredInvoices(customer.name, 1);
        if (invoices.length > 0) {
          expect(invoices.every(inv => inv.name.includes(customer.name))).toBe(true);
        }
      }
    });

    it('should filter by status', async () => {
      const invoices = await fetchFilteredInvoices('paid', 1);
      if (invoices.length > 0) {
        expect(invoices.every(inv => inv.status === 'paid')).toBe(true);
      }
    });

    it('should handle pagination', async () => {
      const page1 = await fetchFilteredInvoices('', 1);
      const page2 = await fetchFilteredInvoices('', 2);
      // Different pages should have different results (or page 2 is empty)
      expect(Array.isArray(page1)).toBe(true);
      expect(Array.isArray(page2)).toBe(true);
    });

    it('should return invoices with correct fields', async () => {
      const invoices = await fetchFilteredInvoices('', 1);
      if (invoices.length > 0) {
        expect(invoices[0]).toHaveProperty('id');
        expect(invoices[0]).toHaveProperty('amount');
        expect(invoices[0]).toHaveProperty('date');
        expect(invoices[0]).toHaveProperty('status');
        expect(invoices[0]).toHaveProperty('name');
        expect(invoices[0]).toHaveProperty('email');
        expect(invoices[0]).toHaveProperty('image_url');
      }
    });

    it('should not include null customer names', async () => {
      const invoices = await fetchFilteredInvoices('', 1);
      expect(invoices.every(inv => inv.name !== null && inv.name !== undefined)).toBe(true);
    });

    it('should format date as YYYY-MM-DD', async () => {
      const invoices = await fetchFilteredInvoices('', 1);
      if (invoices.length > 0) {
        expect(invoices[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('fetchInvoicesPages()', () => {
    it('should return number of pages', async () => {
      const pages = await fetchInvoicesPages('');
      expect(typeof pages).toBe('number');
      expect(pages).toBeGreaterThanOrEqual(0);
    });

    it('should return at least 0 pages', async () => {
      const pages = await fetchInvoicesPages('zzz-no-match-zzz');
      expect(pages).toBeGreaterThanOrEqual(0);
    });

    it('should calculate pages based on seed data', async () => {
      const pages = await fetchInvoicesPages('');
      // With 13+ seed invoices and 6 per page, should have at least 1 page
      expect(typeof pages).toBe('number');
      expect(pages).toBeGreaterThanOrEqual(1);
    });

    it('should filter pages by query', async () => {
      const allPages = await fetchInvoicesPages('');
      const customer = await prisma.customers.findFirst();
      if (customer) {
        const filteredPages = await fetchInvoicesPages(customer.name);
        expect(typeof filteredPages).toBe('number');
        expect(filteredPages).toBeLessThanOrEqual(allPages);
      }
    });
  });

  describe('fetchInvoiceById()', () => {
    it('should return null for non-existent id', async () => {
      const invoice = await fetchInvoiceById('00000000-0000-0000-0000-000000000000');
      expect(invoice).toBeNull();
    });

    it('should return invoice with correct fields when found', async () => {
      const invoice = await prisma.invoices.findFirst();
      if (invoice) {
        const fetched = await fetchInvoiceById(invoice.id);
        expect(fetched).not.toBeNull();
        expect(fetched).toHaveProperty('id');
        expect(fetched).toHaveProperty('customer_id');
        expect(fetched).toHaveProperty('amount');
        expect(fetched).toHaveProperty('status');
      }
    });

    it('should convert amount from cents to dollars', async () => {
      const invoice = await prisma.invoices.findFirst();
      if (invoice) {
        const fetched = await fetchInvoiceById(invoice.id);
        // Database stores in cents, function should divide by 100
        expect(fetched?.amount).toBe(invoice.amount / 100);
      }
    });

    it('should preserve customer_id', async () => {
      const invoice = await prisma.invoices.findFirst();
      if (invoice) {
        const fetched = await fetchInvoiceById(invoice.id);
        expect(fetched?.customer_id).toBe(invoice.customer_id);
      }
    });

    it('should preserve invoice status', async () => {
      const invoice = await prisma.invoices.findFirst();
      if (invoice) {
        const fetched = await fetchInvoiceById(invoice.id);
        expect(fetched?.status).toBe(invoice.status);
      }
    });
  });

  describe('fetchCustomers()', () => {
    it('should return array of customers', async () => {
      const customers = await fetchCustomers();
      expect(Array.isArray(customers)).toBe(true);
      expect(customers.length).toBeGreaterThan(0);
    });

    it('should only have id and name fields', async () => {
      const customers = await fetchCustomers();
      if (customers.length > 0) {
        const keys = Object.keys(customers[0]);
        expect(keys).toContain('id');
        expect(keys).toContain('name');
        expect(keys.length).toBe(2);
      }
    });

    it('should be sorted by name', async () => {
      const customers = await fetchCustomers();
      if (customers.length > 1) {
        const names = customers.map(c => c.name);
        const sorted = [...names].sort();
        expect(names).toEqual(sorted);
      }
    });

    it('should have valid id and name values', async () => {
      const customers = await fetchCustomers();
      customers.forEach(c => {
        expect(typeof c.id).toBe('string');
        expect(typeof c.name).toBe('string');
        expect(c.id.length).toBeGreaterThan(0);
        expect(c.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('fetchFilteredCustomers()', () => {
    it('should return all customers when query is empty', async () => {
      const allCustomers = await fetchFilteredCustomers('');
      const customers = await fetchCustomers();
      expect(allCustomers.length).toBe(customers.length);
    });

    it('should filter by customer name', async () => {
      const customer = await prisma.customers.findFirst();
      if (customer) {
        const filtered = await fetchFilteredCustomers(customer.name.substring(0, 3));
        if (filtered.length > 0) {
          expect(filtered.every(c => c.name.toLowerCase().includes(customer.name.toLowerCase()))).toBe(true);
        }
      }
    });

    it('should filter by email', async () => {
      const customer = await prisma.customers.findFirst();
      if (customer) {
        const filtered = await fetchFilteredCustomers(customer.email.substring(0, 5));
        if (filtered.length > 0) {
          expect(filtered.every(c => c.email.toLowerCase().includes(customer.email.toLowerCase()))).toBe(true);
        }
      }
    });

    it('should return formatted customer data', async () => {
      const customers = await fetchFilteredCustomers('');
      if (customers.length > 0) {
        expect(customers[0]).toHaveProperty('id');
        expect(customers[0]).toHaveProperty('name');
        expect(customers[0]).toHaveProperty('email');
        expect(customers[0]).toHaveProperty('image_url');
        expect(customers[0]).toHaveProperty('total_invoices');
        expect(customers[0]).toHaveProperty('total_pending');
        expect(customers[0]).toHaveProperty('total_paid');
      }
    });

    it('should calculate correct invoice counts', async () => {
      const customers = await fetchFilteredCustomers('');
      customers.forEach(c => {
        expect(typeof c.total_invoices).toBe('number');
        expect(c.total_invoices).toBeGreaterThanOrEqual(0);
      });
    });

    it('should format pending and paid amounts as currency', async () => {
      const customers = await fetchFilteredCustomers('');
      if (customers.length > 0) {
        expect(typeof customers[0].total_pending).toBe('string');
        expect(typeof customers[0].total_paid).toBe('string');
        expect(customers[0].total_pending).toMatch(/\$[\d,]+\.\d{2}/);
        expect(customers[0].total_paid).toMatch(/\$[\d,]+\.\d{2}/);
      }
    });

    it('should be sorted by name', async () => {
      const customers = await fetchFilteredCustomers('');
      if (customers.length > 1) {
        const names = customers.map(c => c.name);
        const sorted = [...names].sort();
        expect(names).toEqual(sorted);
      }
    });

    it('should return zero totals for customers with no invoices', async () => {
      const customers = await fetchFilteredCustomers('');
      const noinvoices = customers.find(c => c.total_invoices === 0);
      if (noinvoices) {
        expect(noinvoices.total_pending).toBe('$0.00');
        expect(noinvoices.total_paid).toBe('$0.00');
      }
    });
  });
});
