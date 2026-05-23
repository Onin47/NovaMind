type Bucket = {
  count: number
  resetAtMs: number
}

const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, opts: { windowMs: number; max: number }) {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAtMs <= now) {
    const resetAtMs = now + opts.windowMs
    buckets.set(key, { count: 1, resetAtMs })
    return { ok: true, remaining: opts.max - 1, resetAtMs }
  }

  existing.count += 1
  buckets.set(key, existing)

  if (existing.count > opts.max) {
    return { ok: false, remaining: 0, resetAtMs: existing.resetAtMs }
  }

  return { ok: true, remaining: Math.max(0, opts.max - existing.count), resetAtMs: existing.resetAtMs }
}

export function getRequestIp(headers: Headers) {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  return headers.get('x-real-ip') || 'unknown'
}
