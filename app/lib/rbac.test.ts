import { describe, expect, it } from 'vitest';
import { canDeleteInvoice, canUpdateInvoice, isRoleAtLeast } from './rbac';

describe('rbac invoice permissions', () => {
  it('enforces role hierarchy for invoice updates', () => {
    expect(isRoleAtLeast('viewer', 'editor')).toBe(false);
    expect(isRoleAtLeast('editor', 'viewer')).toBe(true);
    expect(canUpdateInvoice('editor')).toBe(true);
    expect(canUpdateInvoice('admin')).toBe(true);
  });

  it('restricts invoice deletion to admins', () => {
    expect(canDeleteInvoice('viewer')).toBe(false);
    expect(canDeleteInvoice('editor')).toBe(false);
    expect(canDeleteInvoice('admin')).toBe(true);
  });
});
