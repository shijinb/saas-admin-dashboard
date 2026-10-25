import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, inputStyles, PageHeader, Pagination, StatusBadge, buttonStyles } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, formatMoney, listHref, parseListQuery, SORT_OPTIONS } from "@/lib/list-query";
import { CUSTOMER_STATUSES, type Customer, type Page } from "@/lib/types";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const query = parseListQuery(await searchParams);
  const data = await api<Page<Customer>>("/customers", {
    query: { q: query.q, status: query.status, sort: query.sort, page: query.page, page_size: query.pageSize },
  });
  const filtered = Boolean(query.q || query.status.length);
  const from = (data.page - 1) * data.page_size + 1;

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${data.total.toLocaleString("en-US")} ${filtered ? "matching" : "in total"}`}
        actions={
          <Link href="/customers/new" className={buttonStyles.primary}>
            Add customer
          </Link>
        }
      />

      {/* A plain GET form: filters work without JavaScript and every view has a shareable URL. */}
      <form className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto_auto]" role="search">
        <label className="sr-only" htmlFor="q">
          Search
        </label>
        <input id="q" name="q" type="search" placeholder="Search name, e-mail or company" defaultValue={query.q} className={inputStyles} />

        <fieldset className="flex flex-wrap items-center gap-3 text-sm">
          <legend className="sr-only">Status</legend>
          {CUSTOMER_STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-1.5">
              <input type="checkbox" name="status" value={status} defaultChecked={query.status.includes(status)} />
              {status}
            </label>
          ))}
        </fieldset>

        <label className="sr-only" htmlFor="sort">
          Sort
        </label>
        <select id="sort" name="sort" defaultValue={query.sort} className={inputStyles}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button type="submit" className={buttonStyles.primary}>
            Apply
          </button>
          {filtered && (
            <Link href="/customers" className={buttonStyles.secondary}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {data.items.length === 0 ? (
        filtered ? (
          <EmptyState title="No customers match these filters">
            <Link href="/customers" className="underline">
              Clear filters
            </Link>
          </EmptyState>
        ) : (
          <EmptyState title="No customers yet">
            <Link href="/customers/new" className="underline">
              Add your first customer
            </Link>
          </EmptyState>
        )
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Name
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">
                    Company
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Lifetime value
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:underline">
                        {customer.name}
                      </Link>
                      <p className="text-xs text-slate-500">{customer.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-700 md:table-cell">{customer.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(customer.lifetime_value)}</td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{formatDate(customer.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>
              Showing {from}–{from + data.items.length - 1} of {data.total.toLocaleString("en-US")}
            </p>
            <Pagination page={data.page} pages={data.pages} hrefFor={(page) => listHref(query, { page })} />
          </div>
        </>
      )}
    </>
  );
}
