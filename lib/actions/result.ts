export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

export function actionError(message: string): ActionResult<never> {
  return { success: false, error: message }
}

export function actionSuccess(): ActionResult<void>
export function actionSuccess<T>(data: T): ActionResult<T>
export function actionSuccess<T>(data?: T): ActionResult<T | void> {
  return { success: true, data }
}
