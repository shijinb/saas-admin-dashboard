import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { api, ApiError } from "@/lib/api";
import type { Me } from "@/lib/types";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  let me: Me;
  try {
    me = await api<Me>("/auth/me");
  } catch (error) {
    // The proxy refreshes tokens; a 401 here means the session is gone (revoked, user disabled).
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }

  return (
    <div className="min-h-screen">
      <Sidebar me={me} />
      <main className="px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
