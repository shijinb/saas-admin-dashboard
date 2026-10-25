import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-slate-500">Use an account from the API. The demo seed creates owner@demo.example.com.</p>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
    </main>
  );
}
