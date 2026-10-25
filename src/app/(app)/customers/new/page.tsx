import type { Metadata } from "next";

import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "New customer" };

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="New customer" />
      <CustomerForm />
    </>
  );
}
