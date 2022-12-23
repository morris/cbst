import { AssertionError } from 'assert';

export function assertRecord(
  value: unknown,
  message: string
): asserts value is Record<string, unknown> {
  assert(
    typeof value === 'object' && !!value && !Array.isArray(value),
    message
  );
}

export function assertString(
  value: unknown,
  message: string
): asserts value is string {
  assert(typeof value === 'string', message);
}

export function assertStringArray(
  value: unknown,
  message: string
): asserts value is string[] {
  assert(
    Array.isArray(value) && value.every((it) => typeof it === 'string'),
    message
  );
}

export function assertNumber(value: unknown, message: string) {
  assert(typeof value === 'number' && isFinite(value), message);
}

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new AssertionError({ message });
}
