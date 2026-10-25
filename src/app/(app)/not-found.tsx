import Link from "next/link";

import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState title="Not found">
      This record does not exist or belongs to another organization.{" "}
      <Link href="/customers" className="underline">
        Back to customers
      </Link>
    </EmptyState>
  );
}
