import type { AppRole } from "@/lib/auth/viewer";

const operationsManagerRoles: readonly AppRole[] = [
  "platform_owner",
  "tenant_admin",
  "manager",
];

export function canManageOperations(role: AppRole) {
  return operationsManagerRoles.includes(role);
}
