import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, StatCard, StatusBadge, buttonStyles } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/list-query";
import { CUSTOMER_STATUSES, type Customer, type CustomerStats, type Page } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Independent requests: fetch in parallel.
  const [stats, recent] = await Promise.all([
    api<CustomerStats>("/customers/stats"),
    api<Page<Customer>>("/customers", { query: { sort: "-created_at", page_size: 5 } }),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Customer overview for your organization."
        actions={
          <Link href="/customers/new" className={buttonStyles.primary}>
            Add customer
          </Link>
        }
      />

      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={stats.total.toLocaleString("en-US")} />
        <StatCard label="Active" value={stats.by_status.active.toLocaleString("en-US")} hint={percent(stats.by_status.active, stats.total)} />
        <StatCard label="Lifetime value" value={formatMoney(stats.total_lifetime_value)} />
        <StatCard label="New in last 30 days" value={stats.new_last_30_days.toLocaleString("en-US")} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">By status</h2>
          <ul className="space-y-3">
            {CUSTOMER_STATUSES.map((status) => {
              const count = stats.by_status[status];
              const width = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <li key={status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <Link href={`/customers?status=${status}`} className="hover:underline">
                      <StatusBadge status={status} />
                    </Link>
                    <span className="text-slate-600">
                      {count} ({width}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100" aria-hidden>
                    <div className="h-2 rounded-full bg-slate-700" style={{ width: `${width}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recently added</h2>
            <Link href="/customers" className="text-sm text-slate-600 hover:text-slate-900">
              View all →
            </Link>
          </div>
          {recent.items.length === 0 ? (
            <p className="text-sm text-slate-500">No customers yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.items.map((customer) => (
                <li key={customer.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/customers/${customer.id}`} className="block truncate text-sm font-medium hover:underline">
                      {customer.name}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{customer.company ?? customer.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                    <StatusBadge status={customer.status} />
                    <span className="hidden sm:inline">{formatDate(customer.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function percent(part: number, total: number): string {
  return total ? `${Math.round((part / total) * 100)}% of all customers` : "—";
}
