import { describe, expect, it } from "vitest";

import { formatMoney, listHref, pageWindow, parseListQuery } from "@/lib/list-query";

describe("parseListQuery", () => {
  it("applies defaults", () => {
    expect(parseListQuery({})).toEqual({ q: "", status: [], sort: "-created_at", page: 1, pageSize: 20 });
  });

  it("accepts valid values and drops invalid ones", () => {
    const query = parseListQuery({ q: "  acme ", status: ["active", "bogus", "active", "lead"], sort: "name", page: "3" });
    expect(query).toMatchObject({ q: "acme", status: ["active", "lead"], sort: "name", page: 3 });
  });

  it("falls back on hostile or nonsense input", () => {
    const query = parseListQuery({ sort: "password", page: "-4", q: "x".repeat(500), status: "vip" });
    expect(query).toMatchObject({ sort: "-created_at", page: 1, status: [] });
    expect(query.q).toHaveLength(100);
  });
});

describe("listHref", () => {
  const base = parseListQuery({ q: "acme", status: ["active", "lead"], sort: "name" });

  it("round-trips through parseListQuery", () => {
    const href = listHref(base, { page: 2 });
    expect(href).toBe("/customers?q=acme&status=active&status=lead&sort=name&page=2");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(parseListQuery({ q: params.get("q")!, status: params.getAll("status"), sort: params.get("sort")!, page: params.get("page")! })).toEqual({
      ...base,
      page: 2,
    });
  });

  it("omits defaults", () => {
    expect(listHref(parseListQuery({}))).toBe("/customers");
  });
});

describe("pageWindow", () => {
  it("shows neighbours, first, last and gaps", () => {
    expect(pageWindow(6, 20)).toEqual([1, null, 4, 5, 6, 7, 8, null, 20]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});

it("formats decimal strings from the API as money", () => {
  expect(formatMoney("1200.5")).toBe("$1,200.50");
  expect(formatMoney("0")).toBe("$0.00");
});
