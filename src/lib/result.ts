// A plain-object Result for fallible operations whose value-or-error crosses
// the server-action -> client boundary. It stays a serializable discriminated
// union (no class instances) so React can pass it to client components intact.
// The `ok` discriminant matches the `fetch().ok` vocabulary used elsewhere.

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }

export function ok<T>(value: T): Result<T, never> {
    return { ok: true, value }
}

export function err<E = string>(error: E): Result<never, E> {
    return { ok: false, error }
}
