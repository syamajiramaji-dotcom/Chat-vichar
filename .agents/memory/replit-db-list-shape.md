---
name: Replit Database v3 response shape
description: @replit/database v3.x wraps EVERY response (get, list) in {ok, value}. Legacy entries stored by broken code can be double-wrapped. Always use a recursive unwrap.
---

## Rule

`@replit/database` v3.x wraps **every** response — including `get()` AND `list()` — in `{ ok: boolean, value: T }`. Never access `.displayName`, `.email`, etc. directly on the result of `client.get()`.

Additionally, entries stored by broken code (where `get()` result was spread into `set()`) can be **double-wrapped**: `{ ok, value: { ok, value: { actualData } } }`. A single peel is not enough — use recursive unwrap.

**Why:** This burned us twice. First fix only peeled `list()`. Second bug: `get()` also wraps, and the old disconnect handler spread the already-wrapped result into `setUser()`, creating double-wrapped DB entries. Sidebar was always empty even though users were in DB.

**How to apply:** Always use a **recursive** `unwrap()` helper:

```ts
function unwrap<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if ("ok" in obj && "value" in obj) return unwrap<T>(obj.value); // recursive!
  }
  return raw as T;
}

async function dbGet<T>(key: string): Promise<T | null> {
  return unwrap<T>(await client.get(key));
}

async function dbList(prefix: string): Promise<string[]> {
  const val = unwrap<string[]>(await client.list(prefix));
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") return Object.keys(val as object);
  return [];
}
```

**After any such fix:** run a one-time cleanup to re-store double-wrapped entries with clean data, then restart the server.

## Quick checklist
- Never use `client.get()` raw — always go through `dbGet()`
- Never use `client.list()` raw — always go through `dbList()`
- Never spread a `dbGet()` result into `client.set()` without unwrapping first
