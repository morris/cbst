export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && !!value && !Array.isArray(value);
}
