export async function unwrapMutation<T extends { error?: string }>(request: Promise<T>): Promise<T> {
  const result = await request
  if (result.error) throw new Error(result.error)
  return result
}
