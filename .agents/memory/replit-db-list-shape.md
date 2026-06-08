---
name: Replit Database list() response shape
description: @replit/database v3.x list() returns {ok, value} not a plain array — always unwrap .value
---

## Rule
`@replit/database` v3.x `client.list(prefix?)` resolves to `{ ok: boolean, value: string[] }`, NOT a plain `string[]`.

**Why:** The npm package wraps the REST API response directly. Earlier code assumed a plain array, which caused `Object.keys({ok, value})` to return `["ok", "value"]` — two garbage strings treated as real UIDs.

**How to apply:**
```ts
function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (Array.isArray(obj.value)) return obj.value as string[]; // v3 shape
    return Object.keys(obj); // legacy fallback
  }
  return [];
}
```

**Damage this caused before the fix:**
- User roster always returned empty → Sidebar showed no contacts
- DB polluted with keys like `chat:UID_ok:messages`, `unread:ok:UID`, `seen:UID_value:UID`
- 15 garbage keys had to be deleted manually
