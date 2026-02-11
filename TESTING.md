# Testing Guide

## Overview

This project uses **Jest** for unit testing. All tests are located in `__tests__` directories alongside the code they test.

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
pnpm test:watch
```

### Run tests with coverage report
```bash
pnpm test:coverage
```

This generates a coverage report showing which parts of your code are tested.

## Test Structure

Tests are organized in the same directory as the code they test:

```
app/lib/
├── env.ts
├── __tests__/
│   ├── env.test.ts
│   ├── auth.validation.test.ts
│   └── invoice.validation.test.ts
```

## Current Test Coverage

### 1. **Environment Validation** (`env.test.ts`)
- ✓ Validates required environment variables are set
- ✓ Throws clear error messages when variables are missing
- Tests: 5 tests covering all edge cases

**Key tests:**
- All required env vars present → passes ✓
- Missing `AUTH_SECRET` → throws error ✓
- Multiple missing vars → shows all of them ✓

### 2. **Authentication Validation** (`auth.validation.test.ts`)
- ✓ Email format validation (Zod schema)
- ✓ Password requirements (minimum 6 characters)
- Tests: 9 tests covering email and password validation

**Key tests:**
- Valid email formats → passes ✓
- Invalid emails (missing @, bad format) → fails ✓
- Password < 6 chars → fails ✓
- Password ≥ 6 chars → passes ✓

### 3. **Invoice Form Validation** (`invoice.validation.test.ts`)
- ✓ Invoice amount validation (> $0)
- ✓ Status enum validation (pending/paid only)
- ✓ Amount coercion from string to number
- Tests: 5 tests covering invoice field validation

**Key tests:**
- Valid invoice data → passes ✓
- Zero or negative amounts → fails ✓
- Invalid status (draft, completed, etc.) → fails ✓
- String amounts coerced to numbers → passes ✓

## Writing New Tests

### Test Template
```typescript
import { functionToTest } from '../module';

describe('Feature Name', () => {
  it('should do something when condition is met', () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedValue);
  });

  it('should handle error case', () => {
    expect(() => {
      functionToTest(invalidInput);
    }).toThrow('Expected error message');
  });
});
```

### Jest Matchers Reference

Common assertions:
```typescript
expect(value).toBe(expectedValue);           // Equality check
expect(value).toEqual(expectedValue);        // Deep equality
expect(value).toBeDefined();                 // Not undefined
expect(array).toContain(item);              // Array contains item
expect(fn).toThrow('Error message');        // Function throws error
expect(fn).not.toThrow();                   // Function doesn't throw
expect(value).toBeTruthy();                 // Truthy value
expect(value).toBeFalsy();                  // Falsy value
```

## Next Steps for Testing

### Phase 2: Integration Tests (After Database Refactor)
Once we switch to Prisma ORM, we can add:
- Database integration tests
- API endpoint tests
- Full authentication flow tests

### Phase 3: E2E Tests (Later)
- User interaction tests with Playwright
- End-to-end invoice creation flow
- Login/logout flows

## Troubleshooting

### Tests not found
Make sure test files follow the naming convention:
- `*.test.ts` or `*.test.tsx`
- Located in `__tests__` directory

### Import errors
Check that:
1. Path aliases in `jest.config.js` match `tsconfig.json`
2. Files are in the correct location
3. Environment variables are set (for env tests)

### Type errors
Run: `pnpm test` to see full error, or check `tsconfig.json` for strict mode settings

## CI/CD Integration

To run tests in your CI/CD pipeline (GitHub Actions, etc.):
```yaml
- name: Run tests
  run: pnpm test --coverage
```

Tests must pass before code can be merged/deployed.
