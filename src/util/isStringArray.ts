export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((it) => typeof it === 'string');
}
