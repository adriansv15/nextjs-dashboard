import { FormSchema, CreateInvoice } from '@/app/lib/schemas/invoice';

describe('Invoice Form Validation', () => {
  describe('Create Invoice validation', () => {
    it('should accept valid invoice data', () => {
      const validData = {
        customerId: 'cust-123',
        amount: '150.50',
        status: 'pending',
      };

      const result = CreateInvoice.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerId).toBe('cust-123');
        expect(result.data.amount).toBe(150.50);
        expect(result.data.status).toBe('pending');
      }
    });

    it('should accept customerId (validation is on backend)', () => {
      const result = CreateInvoice.safeParse({
        customerId: '',
        amount: 100,
        status: 'pending',
      });
      // Note: Empty customerId is accepted at Zod level, validated in createInvoice action
      expect(result.success).toBe(true);
    });

    it('should reject missing customerId', () => {
      const result = CreateInvoice.safeParse({
        amount: 100,
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero or negative amounts', () => {
      const invalidAmounts = ['0', '-10', '-99.99'];

      invalidAmounts.forEach((amount) => {
        const result = CreateInvoice.safeParse({
          customerId: 'cust-123',
          amount,
          status: 'pending',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.amount).toBeDefined();
        }
      });
    });

    it('should accept positive amounts as strings or numbers', () => {
      const validAmounts = ['100', 100, '99.99', 0.01];

      validAmounts.forEach((amount) => {
        const result = CreateInvoice.safeParse({
          customerId: 'cust-123',
          amount,
          status: 'pending',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status values', () => {
      const invalidStatuses = ['draft', 'completed', 'cancelled', 'unknown'];

      invalidStatuses.forEach((status) => {
        const result = CreateInvoice.safeParse({
          customerId: 'cust-123',
          amount: 100,
          status,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.status).toBeDefined();
        }
      });
    });

    it('should accept valid status values', () => {
      const validStatuses = ['pending', 'paid'];

      validStatuses.forEach((status) => {
        const result = CreateInvoice.safeParse({
          customerId: 'cust-123',
          amount: 100,
          status,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should coerce string amount to number', () => {
      const result = CreateInvoice.safeParse({
        customerId: 'cust-123',
        amount: '250.75',
        status: 'pending',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(250.75);
        expect(typeof result.data.amount).toBe('number');
      }
    });
  });
});
