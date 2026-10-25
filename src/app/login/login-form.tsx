"use client";

import { useActionState } from "react";

import { Alert, buttonStyles, inputStyles } from "@/components/ui";
import { type FormState, login } from "@/lib/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {state.message && <Alert>{state.message}</Alert>}
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} className={inputStyles} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputStyles} />
      </div>
      <button type="submit" disabled={pending} className={`${buttonStyles.primary} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
