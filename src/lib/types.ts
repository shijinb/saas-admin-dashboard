// Shapes returned by fastapi-production-starter (see its /openapi.json).

export type Role = "owner" | "admin" | "member";
export type CustomerStatus = "lead" | "active" | "churned";

export const CUSTOMER_STATUSES: CustomerStatus[] = ["lead", "active", "churned"];

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Me {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  organization: { id: string; name: string; slug: string };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: CustomerStatus;
  lifetime_value: string; // decimal as string, e.g. "1200.50"
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  total: number;
  by_status: Record<CustomerStatus, number>;
  total_lifetime_value: string;
  new_last_30_days: number;
}

export interface AuditEvent {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown>;
  request_id: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

/** RFC 9457 problem details, as returned by the API for every error. */
export interface Problem {
  title: string;
  status: number;
  detail: string | null;
  request_id?: string | null;
  errors?: { location: (string | number)[]; message: string; type: string }[];
}
