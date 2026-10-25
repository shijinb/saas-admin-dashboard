"use client";

import Link from "next/link";
import { useActionState } from "react";

import { buttonStyles, inputStyles, Alert } from "@/components/ui";
import { deleteCustomer, type FormState, saveCustomer } from "@/lib/actions";
import { CUSTOMER_STATUSES, type Customer } from "@/lib/types";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function CustomerForm({ customer, canDelete }: { customer?: Customer; canDelete?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCustomer.bind(null, customer?.id ?? null), {});
  const [deleteState, deleteAction, deleting] = useActionState<FormState>(
    customer ? deleteCustomer.bind(null, customer.id) : async () => ({}),
    {},
  );

  // After a failed submit, show what the user typed rather than the stored values.
  const value = (name: keyof Customer) => state.values?.[name] ?? (customer ? String(customer[name] ?? "") : "");
  const errorProps = (name: string) =>
    state.fieldErrors?.[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : { "aria-invalid": false };

  return (
    <div className="max-w-xl space-y-6">
      <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" noValidate>
        {state.message && <Alert>{state.message}</Alert>}

        <Field label="Name" name="name" error={state.fieldErrors?.name}>
          <input id="name" name="name" required defaultValue={value("name")} className={inputStyles} {...errorProps("name")} />
        </Field>
        <Field label="E-mail" name="email" error={state.fieldErrors?.email}>
          <input id="email" name="email" type="email" required defaultValue={value("email")} className={inputStyles} {...errorProps("email")} />
        </Field>
        <Field label="Company" name="company" error={state.fieldErrors?.company}>
          <input id="company" name="company" defaultValue={value("company")} className={inputStyles} {...errorProps("company")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" name="status" error={state.fieldErrors?.status}>
            <select id="status" name="status" defaultValue={value("status") || "lead"} className={inputStyles}>
              {CUSTOMER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lifetime value (USD)" name="lifetime_value" error={state.fieldErrors?.lifetime_value}>
            <input
              id="lifetime_value"
              name="lifetime_value"
              inputMode="decimal"
              defaultValue={value("lifetime_value") || "0"}
              className={inputStyles}
              {...errorProps("lifetime_value")}
            />
          </Field>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={pending} className={buttonStyles.primary}>
            {pending ? "Saving…" : customer ? "Save changes" : "Create customer"}
          </button>
          <Link href="/customers" className={buttonStyles.secondary}>
            Cancel
          </Link>
        </div>
      </form>

      {customer && canDelete && (
        <form action={deleteAction} className="rounded-xl border border-red-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-900">Delete customer</p>
          <p className="mt-1 text-sm text-slate-500">This permanently removes {customer.name}. The audit log keeps a record.</p>
          {deleteState.message && (
            <div className="mt-3">
              <Alert>{deleteState.message}</Alert>
            </div>
          )}
          <button type="submit" disabled={deleting} className={`${buttonStyles.danger} mt-4`}>
            {deleting ? "Deleting…" : "Delete customer"}
          </button>
        </form>
      )}
    </div>
  );
}
