import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Customer, Me } from "@/lib/types";

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  let customer: Customer;
  let me: Me;
  try {
    [customer, me] = await Promise.all([api<Customer>(`/customers/${encodeURIComponent(id)}`), api<Me>("/auth/me")]);
  } catch (error) {
    // 404 for unknown IDs, other tenants' customers and malformed IDs (422) alike.
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
    throw error;
  }

  return (
    <>
      <PageHeader title={customer.name} description={customer.email} />
      {/* The delete button is only a convenience; the API enforces the admin role either way. */}
      <CustomerForm customer={customer} canDelete={me.role !== "member"} />
    </>
  );
}
