import type { Metadata } from "next";

import { Alert, EmptyState, PageHeader, Pagination } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { AuditEvent, Page } from "@/lib/types";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof rawPage === "string" ? rawPage : "1", 10) || 1);

  let data: Page<AuditEvent>;
  try {
    data = await api<Page<AuditEvent>>("/audit-events", { query: { page, page_size: 25 } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return (
        <>
          <PageHeader title="Audit log" />
          <Alert>The audit log is only available to admins and the organization owner.</Alert>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <PageHeader title="Audit log" description="Every change in your organization, newest first." />
      {data.items.length === 0 ? (
        <EmptyState title="No changes recorded yet" />
      ) : (
        <ol className="space-y-3">
          {data.items.map((event) => (
            <li key={event.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-sm font-medium">{event.action}</p>
                <time className="text-xs text-slate-500" dateTime={event.created_at}>
                  {new Date(event.created_at).toLocaleString("en-GB")}
                </time>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-md bg-slate-50 p-2 text-xs text-slate-700">{JSON.stringify(event.changes, null, 2)}</pre>
              <p className="mt-2 text-xs text-slate-400">request {event.request_id ?? "—"}</p>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-4">
        <Pagination page={data.page} pages={data.pages} hrefFor={(p) => `/audit?page=${p}`} />
      </div>
    </>
  );
}
