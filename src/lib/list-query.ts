// Customer list state lives in the URL (?q=&status=&sort=&page=), so views are linkable and the
// filter form works without JavaScript. These helpers are pure and unit-tested.

import { CUSTOMER_STATUSES, type CustomerStatus } from "./types";

export const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "-name", label: "Name Z–A" },
  { value: "-lifetime_value", label: "Highest value" },
  { value: "lifetime_value", label: "Lowest value" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface ListQuery {
  q: string;
  status: CustomerStatus[];
  sort: SortValue;
  page: number;
  pageSize: number;
}

export const PAGE_SIZE = 20;

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Parses untrusted search params into a valid query; anything invalid falls back to a default. */
export function parseListQuery(params: RawParams): ListQuery {
  const rawStatus = params.status;
  const statuses = (Array.isArray(rawStatus) ? rawStatus : rawStatus ? [rawStatus] : []).filter((s): s is CustomerStatus =>
    (CUSTOMER_STATUSES as string[]).includes(s),
  );
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q).trim().slice(0, 100),
    status: [...new Set(statuses)],
    sort: (SORT_OPTIONS.some((o) => o.value === sort) ? sort : "-created_at") as SortValue,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE,
  };
}

/** Query string for the list page; defaults are omitted to keep URLs short. */
export function listHref(query: ListQuery, overrides: Partial<ListQuery> = {}): string {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  for (const status of next.status) params.append("status", status);
  if (next.sort !== "-created_at") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/customers?${qs}` : "/customers";
}

/** Page numbers to show, with null for gaps: 1 … 4 5 [6] 7 8 … 20 */
export function pageWindow(current: number, total: number, radius = 2): (number | null)[] {
  if (total <= 1) return [1];
  const pages = new Set([1, total]);
  for (let p = current - radius; p <= current + radius; p++) if (p >= 1 && p <= total) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push(null);
    result.push(page);
  });
  return result;
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function formatMoney(value: string | number): string {
  return money.format(Number(value));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
