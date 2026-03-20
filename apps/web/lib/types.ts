export type ActionResult = { success: true } | { success: false; error: string }

export type QueryResult<T> = { data: T; error: null } | { data: null; error: string }
