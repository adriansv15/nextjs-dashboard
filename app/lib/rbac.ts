import { auth } from '@/auth';
import type { Role } from '@/app/lib/definitions';

const roleRank: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

export function isRoleAtLeast(role: Role, required: Role) {
  return roleRank[role] >= roleRank[required];
}

export function canCreateInvoice(role: Role) {
  return isRoleAtLeast(role, 'editor');
}

export function canUpdateInvoice(role: Role) {
  return isRoleAtLeast(role, 'editor');
}

export function canDeleteInvoice(role: Role) {
  return isRoleAtLeast(role, 'admin');
}

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
