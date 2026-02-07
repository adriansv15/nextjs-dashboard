import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeleteInvoice, canUpdateInvoice, isRoleAtLeast } from './rbac-core.ts';

test('enforces role hierarchy for invoice updates', () => {
  assert.equal(isRoleAtLeast('viewer', 'editor'), false);
  assert.equal(isRoleAtLeast('editor', 'viewer'), true);
  assert.equal(canUpdateInvoice('editor'), true);
  assert.equal(canUpdateInvoice('admin'), true);
});

test('restricts invoice deletion to admins', () => {
  assert.equal(canDeleteInvoice('viewer'), false);
  assert.equal(canDeleteInvoice('editor'), false);
  assert.equal(canDeleteInvoice('admin'), true);
});
