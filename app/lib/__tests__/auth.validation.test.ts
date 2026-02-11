import { credentialsSchema } from '@/app/lib/schemas/auth';

describe('Authentication Credentials Validation', () => {
  describe('Email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'firstname+lastname@example.com',
      ];

      validEmails.forEach((email) => {
        const result = credentialsSchema.safeParse({
          email,
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        'user@',
        '@example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        const result = credentialsSchema.safeParse({
          email,
          password: 'password123',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Password validation', () => {
    it('should accept passwords with 6+ characters', () => {
      const validPasswords = [
        'password',
        'passw0rd',
        'very-strong-password-with-special-chars!',
      ];

      validPasswords.forEach((password) => {
        const result = credentialsSchema.safeParse({
          email: 'user@example.com',
          password,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject passwords with less than 6 characters', () => {
      const invalidPasswords = ['pass', '12345', 'abc'];

      invalidPasswords.forEach((password) => {
        const result = credentialsSchema.safeParse({
          email: 'user@example.com',
          password,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.password).toBeDefined();
        }
      });
    });
  });

  describe('Combined validation', () => {
    it('should require both email and password', () => {
      const result = credentialsSchema.safeParse({
        email: '',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid credentials', () => {
      const result = credentialsSchema.safeParse({
        email: 'user@example.com',
        password: 'secure-password-123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
        expect(result.data.password).toBe('secure-password-123');
      }
    });
  });
});
