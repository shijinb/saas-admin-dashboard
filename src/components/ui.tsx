import Link from "next/link";
import type { ReactNode } from "react";

import { pageWindow } from "@/lib/list-query";
import type { CustomerStatus } from "@/lib/types";

const STATUS_STYLES: Record<CustomerStatus, string> = {
  lead: "bg-amber-50 text-amber-800 ring-amber-600/20",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  churned: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "info"; children: ReactNode }) {
  const styles = tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-800";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  const link = "rounded-md px-3 py-1.5 text-sm";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
      {page > 1 ? (
        <Link className={`${link} text-slate-700 hover:bg-slate-100`} href={hrefFor(page - 1)}>
          ← Previous
        </Link>
      ) : (
        <span className={`${link} text-slate-300`}>← Previous</span>
      )}
      {pageWindow(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${link} ${p === page ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {p}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link className={`${link} text-slate-700 hover:bg-slate-100`} href={hrefFor(page + 1)}>
          Next →
        </Link>
      ) : (
        <span className={`${link} text-slate-300`}>Next →</span>
      )}
    </nav>
  );
}

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50",
};

export const inputStyles =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 aria-[invalid=true]:border-red-400";
