"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logout } from "@/lib/actions";
import type { Me } from "@/lib/types";

const NAV = [
  { href: "/", label: "Dashboard", adminOnly: false },
  { href: "/customers", label: "Customers", adminOnly: false },
  { href: "/audit", label: "Audit log", adminOnly: true },
];

export function Sidebar({ me }: { me: Me }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = me.role === "owner" || me.role === "admin";

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-semibold text-slate-900">{me.organization.name}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="sidebar"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        id="sidebar"
        className={`${open ? "block" : "hidden"} border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:block lg:w-60 lg:border-b-0 lg:border-r`}
      >
        <div className="flex h-full flex-col gap-6 p-4">
          <div className="hidden lg:block">
            <p className="text-xs uppercase tracking-wide text-slate-400">Organization</p>
            <p className="font-semibold text-slate-900">{me.organization.name}</p>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Main">
            {NAV.filter((item) => !item.adminOnly || isAdmin).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(item.href) ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <p className="truncate text-sm font-medium text-slate-900">{me.full_name}</p>
            <p className="truncate text-xs text-slate-500">
              {me.email} · {me.role}
            </p>
            <form action={logout} className="mt-3">
              <button type="submit" className="text-sm text-slate-600 hover:text-slate-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
