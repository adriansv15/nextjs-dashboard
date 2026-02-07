import { auth } from '@/auth';
import type { Role } from '@/app/lib/definitions';
import {
  canCreateInvoice,
  canDeleteInvoice,
  canUpdateInvoice,
  isRoleAtLeast,
} from '@/app/lib/rbac-core';

export { canCreateInvoice, canDeleteInvoice, canUpdateInvoice, isRoleAtLeast };

export async function getCurrentUserRole(): Promise<Role> {
  const session = await auth();
  return session?.user?.role ?? 'viewer';
}

export async function requireRole(required: Role): Promise<Role> {
  const role = await getCurrentUserRole();
  if (!isRoleAtLeast(role, required)) {
    throw new Response('Forbidden', { status: 403 });
  }
  return role;
}
