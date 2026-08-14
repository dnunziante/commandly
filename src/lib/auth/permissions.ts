import type { AppRole } from "@/lib/auth/viewer";

const operationsManagerRoles: readonly AppRole[] = [
  "platform_owner",
  "tenant_admin",
  "manager",
];

export function canManageOperations(role: AppRole) {
  return operationsManagerRoles.includes(role);
}

export function canViewExecutive(role: AppRole) {
  return role === "platform_owner" || role === "tenant_admin" || role === "manager";
}

export function canManageExecutiveTargets(role: AppRole) {
  return role === "platform_owner" || role === "tenant_admin";
}
