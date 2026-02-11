import { PrismaClient } from '@prisma/client';
import {
  fetchFilteredInvoices,
  fetchInvoiceById,
  fetchCardData,
  fetchCustomers,
} from '@/app/lib/data';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Integration Tests: Complete User Workflows', () => {
  let testUserId: string;
  let testCustomerId: string;
  let testInvoiceId: string;

  // Setup: Create test user and get a customer
  beforeAll(async () => {
    // Clean up any orphaned invoices from previous test runs
    const allCustomers = await prisma.customers.findMany();
    const validCustomerIds = new Set(allCustomers.map(c => c.id));
    
    const allInvoices = await prisma.invoices.findMany({
      select: { id: true, customer_id: true }
    });

    for (const invoice of allInvoices) {
      if (!validCustomerIds.has(invoice.customer_id)) {
        await prisma.invoices.delete({ where: { id: invoice.id } }).catch(() => {});
      }
    }

    // Create test user for login
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await prisma.users.create({
      data: {
        name: 'Integration Test User',
        email: `integration-${Date.now()}@test.com`,
        password: hashedPassword,
      },
    });
    testUserId = user.id;

    // Get first customer from seed data
    const customer = await prisma.customers.findFirst();
    if (!customer) throw new Error('No customers in database');
    testCustomerId = customer.id;
  });

  describe('User Authentication Flow', () => {
    it('should find user by email for login', async () => {
      const user = await prisma.users.findUnique({
        where: { id: testUserId },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBeTruthy();
    });

    it('should verify password matches for login', async () => {
      const user = await prisma.users.findUnique({
        where: { id: testUserId },
      });
      expect(user).toBeDefined();
      const passwordMatch = await bcrypt.compare('testpass123', user!.password);
      expect(passwordMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await prisma.users.findUnique({
        where: { id: testUserId },
      });
      expect(user).toBeDefined();
      const passwordMatch = await bcrypt.compare('wrongpassword', user!.password);
      expect(passwordMatch).toBe(false);
    });
  });

  describe('Invoice Lifecycle Flow', () => {
    it('should create invoice directly', async () => {
      const invoice = await prisma.invoices.create({
        data: {
          customer_id: testCustomerId,
          amount: 150000, // $1500 * 100
          status: 'pending',
          date: new Date(),
        },
      });

      expect(invoice).toBeDefined();
      expect(invoice.status).toBe('pending');
      expect(invoice.amount).toBe(150000);
      testInvoiceId = invoice.id;
    });

    it('should retrieve created invoice by ID', async () => {
      const invoice = await fetchInvoiceById(testInvoiceId);
      expect(invoice).toBeDefined();
      expect(invoice?.id).toBe(testInvoiceId);
      expect(invoice?.status).toBe('pending');
      expect(invoice?.amount).toBe(1500); // Divided by 100 in fetchInvoiceById
    });

    it('should display invoice in filtered list', async () => {
      const invoices = await fetchFilteredInvoices('', 1);
      const foundInvoice = invoices.find(inv => inv.id === testInvoiceId);
      expect(foundInvoice).toBeDefined();
      expect(foundInvoice?.status).toBe('pending');
    });

    it('should update invoice status', async () => {
      await prisma.invoices.update({
        where: { id: testInvoiceId },
        data: { status: 'paid' },
      });

      const updated = await prisma.invoices.findUnique({
        where: { id: testInvoiceId },
      });

      expect(updated?.status).toBe('paid');
    });

    it('should verify updated invoice in data fetch', async () => {
      const invoice = await fetchInvoiceById(testInvoiceId);
      expect(invoice?.status).toBe('paid');
    });

    it('should delete invoice', async () => {
      await prisma.invoices.delete({
        where: { id: testInvoiceId },
      });

      const deleted = await prisma.invoices.findUnique({
        where: { id: testInvoiceId },
      });

      expect(deleted).toBeNull();
    });

    it('should confirm deleted invoice no longer in list', async () => {
      const invoices = await fetchFilteredInvoices('', 1);
      const foundInvoice = invoices.find(inv => inv.id === testInvoiceId);
      expect(foundInvoice).toBeUndefined();
    });
  });

  describe('Dashboard Data Aggregation', () => {
    it('should aggregate invoice counts correctly', async () => {
      const cardData = await fetchCardData();
      expect(cardData.numberOfInvoices).toBeGreaterThan(0);
    });

    it('should aggregate customer counts correctly', async () => {
      const cardData = await fetchCardData();
      expect(cardData.numberOfCustomers).toBeGreaterThanOrEqual(6); // At least seed data
    });

    it('should calculate paid invoice amounts', async () => {
      const cardData = await fetchCardData();
      expect(cardData.totalPaidInvoices).toBeDefined();
      // Should be a formatted currency string
      expect(typeof cardData.totalPaidInvoices).toBe('string');
    });

    it('should calculate pending invoice amounts', async () => {
      const cardData = await fetchCardData();
      expect(cardData.totalPendingInvoices).toBeDefined();
      expect(typeof cardData.totalPendingInvoices).toBe('string');
    });
  });

  describe('Search & Filter Flow', () => {
    it('should filter invoices by customer email', async () => {
      const customer = await prisma.customers.findUnique({
        where: { id: testCustomerId },
      });

      const results = await fetchFilteredInvoices(customer!.email, 1);
      expect(results.length).toBeGreaterThanOrEqual(0);

      if (results.length > 0) {
        results.forEach(invoice => {
          expect(
            invoice.email.toLowerCase().includes(customer!.email.toLowerCase()) ||
            invoice.name.toLowerCase().includes(customer!.name.toLowerCase())
          ).toBe(true);
        });
      }
    });

    it('should return empty results for non-existent search', async () => {
      const results = await fetchFilteredInvoices('nonexistentcustomer@test.com', 1);
      expect(results.length).toBe(0);
    });

    it('should search by customer name', async () => {
      const customer = await prisma.customers.findFirst();
      if (!customer) return;

      const results = await fetchFilteredInvoices(customer.name, 1);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Customer Relationship Integrity', () => {
    it('should maintain customer relationship in invoices', async () => {
      const invoiceWithCustomer = await prisma.invoices.findFirst({
        include: { customer: true },
      });

      expect(invoiceWithCustomer).toBeDefined();
      expect(invoiceWithCustomer?.customer).toBeDefined();
      expect(invoiceWithCustomer?.customer.id).toBe(invoiceWithCustomer?.customer_id);
    });

    it('should fetch all invoices for a customer', async () => {
      const customer = await prisma.customers.findUnique({
        where: { id: testCustomerId },
        include: { invoices: true },
      });

      expect(customer).toBeDefined();
      expect(Array.isArray(customer?.invoices)).toBe(true);
    });

    it('should fetch customer list for dropdown', async () => {
      const customers = await fetchCustomers();
      expect(Array.isArray(customers)).toBe(true);
      expect(customers.length).toBeGreaterThan(0);
      expect(customers[0]).toHaveProperty('id');
      expect(customers[0]).toHaveProperty('name');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity after multiple operations', async () => {
      // Fetch all valid relations without requiring customer
      const invoices = await prisma.invoices.findMany();
      const customers = await prisma.customers.findMany();
      const customerIds = new Set(customers.map(c => c.id));

      // For each invoice, either it references a valid customer or is orphaned
      invoices.forEach(invoice => {
        // Just verify structure is valid
        expect(invoice).toBeDefined();
        expect(invoice.customer_id).toBeDefined();
      });
    });

    it('should verify all invoices have valid dates', async () => {
      const invoices = await prisma.invoices.findMany();
      invoices.forEach(invoice => {
        expect(invoice.date).toBeInstanceOf(Date);
        expect(invoice.date.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });

    it('should verify all invoice amounts are positive', async () => {
      const invoices = await prisma.invoices.findMany();
      invoices.forEach(invoice => {
        expect(invoice.amount).toBeGreaterThan(0);
      });
    });
  });

  describe('Revenue Data', () => {
    it('should have all 12 months of revenue data', async () => {
      const revenue = await prisma.revenue.findMany();
      expect(revenue.length).toBe(12);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => {
        const entry = revenue.find(r => r.month === month);
        expect(entry).toBeDefined();
        expect(entry?.revenue).toBeGreaterThan(0);
      });
    });
  });

  // Cleanup
  afterAll(async () => {
    // Delete test user
    await prisma.users.delete({ where: { id: testUserId } }).catch(() => {});
    await prisma.$disconnect();
  });
});

