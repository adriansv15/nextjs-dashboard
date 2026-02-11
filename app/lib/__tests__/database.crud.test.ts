import { PrismaClient } from '@prisma/client';

// Use a single instance for tests
const prisma = new PrismaClient();

describe('Database CRUD Operations', () => {
  // Test DB Connection
  describe('Connection', () => {
    it('should connect to the database', async () => {
      const result = await prisma.$queryRaw`SELECT 1`;
      expect(result).toBeDefined();
    });
  });

  // Seed Data Verification
  describe('Seed Data Verification', () => {
    it('should have seeded users', async () => {
      const users = await prisma.users.findMany();
      expect(users.length).toBeGreaterThan(0);
      
      const testUser = users.find(u => u.email === 'user@nextmail.com');
      expect(testUser).toBeDefined();
      expect(testUser?.name).toBe('User');
    });

    it('should have seeded 6 customers', async () => {
      const customers = await prisma.customers.findMany();
      expect(customers.length).toBe(6);
      
      const expectedEmails = [
        'evil@rabbit.com',
        'delba@oliveira.com',
        'lee@robinson.com',
        'michael@novotny.com',
        'amy@burns.com',
        'balazs@orban.com'
      ];
      
      expectedEmails.forEach(email => {
        const customer = customers.find(c => c.email === email);
        expect(customer).toBeDefined();
      });
    });

    it('should have seeded invoices with correct statuses', async () => {
      const invoices = await prisma.invoices.findMany();
      expect(invoices.length).toBeGreaterThan(0);
      
      const statuses = new Set(invoices.map(i => i.status));
      expect(statuses.has('paid')).toBe(true);
      expect(statuses.has('pending')).toBe(true);
    });

    it('should have the test invoice with amount 666', async () => {
      const invoice = await prisma.invoices.findFirst({
        where: { amount: 666 }
      });
      expect(invoice).toBeDefined();
      expect(invoice?.status).toBe('pending');
    });

    it('should have 12 revenue entries for all months', async () => {
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

  // User CRUD Operations
  describe('User CRUD', () => {
    let testUserId: string;
    let testUserEmail: string;

    it('should create a user with all fields', async () => {
      testUserEmail = `testuser-${Date.now()}@example.com`;
      const user = await prisma.users.create({
        data: {
          name: 'Test User',
          email: testUserEmail,
          password: 'hashedpassword123'
        }
      });
      testUserId = user.id;
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe(testUserEmail);
      expect(user.password).toBe('hashedpassword123');
    });

    it('should read a user with all fields', async () => {
      const user = await prisma.users.findUnique({
        where: { id: testUserId }
      });
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.name).toBe('Test User');
      expect(user?.email).toBe(testUserEmail);
      expect(user?.password).toBe('hashedpassword123');
    });

    it('should delete a user', async () => {
      await prisma.users.delete({
        where: { id: testUserId }
      });
      const deletedUser = await prisma.users.findUnique({
        where: { id: testUserId }
      });
      expect(deletedUser).toBeNull();
    });
  });

  // Invoice CRUD Operations
  describe('Invoice CRUD', () => {
    let testCustomerId: string;
    let testInvoiceId: string;
    const testDate = new Date('2024-01-15');

    beforeAll(async () => {
      const customer = await prisma.customers.findFirst();
      if (customer) {
        testCustomerId = customer.id;
      }
    });

    it('should create an invoice with all fields', async () => {
      const invoice = await prisma.invoices.create({
        data: {
          customer_id: testCustomerId,
          amount: 9999,
          status: 'pending',
          date: testDate
        }
      });
      testInvoiceId = invoice.id;
      expect(invoice).toBeDefined();
      expect(invoice.id).toBeDefined();
      expect(invoice.customer_id).toBe(testCustomerId);
      expect(invoice.amount).toBe(9999);
      expect(invoice.status).toBe('pending');
      expect(invoice.date).toEqual(testDate);
    });

    it('should read an invoice with all fields', async () => {
      const invoice = await prisma.invoices.findUnique({
        where: { id: testInvoiceId }
      });
      expect(invoice).toBeDefined();
      expect(invoice?.id).toBe(testInvoiceId);
      expect(invoice?.customer_id).toBe(testCustomerId);
      expect(invoice?.amount).toBe(9999);
      expect(invoice?.status).toBe('pending');
      expect(invoice?.date).toEqual(testDate);
    });

    it('should update an invoice status', async () => {
      const updated = await prisma.invoices.update({
        where: { id: testInvoiceId },
        data: { status: 'paid' }
      });
      expect(updated.id).toBe(testInvoiceId);
      expect(updated.customer_id).toBe(testCustomerId);
      expect(updated.amount).toBe(9999);
      expect(updated.status).toBe('paid');
      expect(updated.date).toEqual(testDate);
    });

    it('should verify updated invoice persists with all fields', async () => {
      const invoice = await prisma.invoices.findUnique({
        where: { id: testInvoiceId }
      });
      expect(invoice?.id).toBe(testInvoiceId);
      expect(invoice?.customer_id).toBe(testCustomerId);
      expect(invoice?.amount).toBe(9999);
      expect(invoice?.status).toBe('paid');
      expect(invoice?.date).toEqual(testDate);
    });

    it('should delete an invoice', async () => {
      await prisma.invoices.delete({
        where: { id: testInvoiceId }
      });
      const deletedInvoice = await prisma.invoices.findUnique({
        where: { id: testInvoiceId }
      });
      expect(deletedInvoice).toBeNull();
    });
  });

  // Customer CRUD Operations
  describe('Customer CRUD', () => {
    let testCustomerId: string;
    const testEmail = `test-${Date.now()}@example.com`;
    const imageUrl = '/test.png';

    it('should create a customer with all fields', async () => {
      const customer = await prisma.customers.create({
        data: {
          name: 'Test Customer',
          email: testEmail,
          image_url: imageUrl
        }
      });
      testCustomerId = customer.id;
      expect(customer).toBeDefined();
      expect(customer.id).toBeDefined();
      expect(customer.name).toBe('Test Customer');
      expect(customer.email).toBe(testEmail);
      expect(customer.image_url).toBe(imageUrl);
    });

    it('should read a customer with all fields', async () => {
      const customer = await prisma.customers.findUnique({
        where: { id: testCustomerId }
      });
      expect(customer).toBeDefined();
      expect(customer?.id).toBe(testCustomerId);
      expect(customer?.name).toBe('Test Customer');
      expect(customer?.email).toBe(testEmail);
      expect(customer?.image_url).toBe(imageUrl);
    });

    it('should update a customer', async () => {
      const updated = await prisma.customers.update({
        where: { id: testCustomerId },
        data: { name: 'Updated Customer' }
      });
      expect(updated.name).toBe('Updated Customer');
    });

    it('should delete a customer', async () => {
      await prisma.customers.delete({
        where: { id: testCustomerId }
      });
      const deletedCustomer = await prisma.customers.findUnique({
        where: { id: testCustomerId }
      });
      expect(deletedCustomer).toBeNull();
    });
  });

  // Revenue CRUD Operations
  describe('Revenue CRUD', () => {
    it('should read revenue entries with all fields', async () => {
      const revenue = await prisma.revenue.findMany();
      expect(revenue.length).toBeGreaterThan(0);
      
      revenue.forEach(entry => {
        expect(entry.month).toBeDefined();
        expect(entry.revenue).toBeDefined();
        expect(typeof entry.month).toBe('string');
        expect(typeof entry.revenue).toBe('number');
      });
    });

    it('should update a revenue entry with all fields verified', async () => {
      const entry = await prisma.revenue.findUnique({
        where: { month: 'Jan' }
      });
      expect(entry).toBeDefined();
      expect(entry?.month).toBe('Jan');
      
      const updated = await prisma.revenue.update({
        where: { month: 'Jan' },
        data: { revenue: 9999 }
      });
      expect(updated.month).toBe('Jan');
      expect(updated.revenue).toBe(9999);
    });

    it('should restore revenue entry to original', async () => {
      // Restore Jan to 2000
      const restored = await prisma.revenue.update({
        where: { month: 'Jan' },
        data: { revenue: 2000 }
      });
      expect(restored.month).toBe('Jan');
      expect(restored.revenue).toBe(2000);
    });
  });

  // Data Integrity Tests
  describe('Data Integrity', () => {
    it('should maintain referential integrity for invoices', async () => {
      const invoices = await prisma.invoices.findMany();
      const customers = await prisma.customers.findMany();
      const customerIds = new Set(customers.map(c => c.id));
      
      invoices.forEach(invoice => {
        expect(customerIds.has(invoice.customer_id)).toBe(true);
      });
    });

    it('should have valid dates for invoices', async () => {
      const invoices = await prisma.invoices.findMany();
      invoices.forEach(invoice => {
        expect(invoice.date).toBeInstanceOf(Date);
      });
    });

    it('should have positive amounts for all invoices', async () => {
      const invoices = await prisma.invoices.findMany();
      invoices.forEach(invoice => {
        expect(invoice.amount).toBeGreaterThan(0);
      });
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
