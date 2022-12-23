export type CacheFn<T> = (key: string) => Promise<T>;

export class Cache<T> {
  protected map = new Map<string, Promise<T>>();

  constructor(protected fn: CacheFn<T>) {}

  get(key: string) {
    const cached = this.map.get(key);
    if (cached) return cached;

    const result = this.fn(key);
    this.map.set(key, result);

    return result;
  }

  delete(key: string) {
    this.map.delete(key);
  }
}
