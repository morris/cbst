import { Cache } from '../../src/util/Cache.js';

describe('A Cache', () => {
  it('should be able to cache', async () => {
    const data: Record<string, number> = { a: 1, b: 2, c: 3 };
    const cache = new Cache(async (key: string) => data[key]++);

    const received = await Promise.all([
      cache.get('a'),
      cache.get('b'),
      cache.get('c'),
      cache.get('b'),
      cache.get('a'),
      cache.get('c'),
    ]);

    expect(data).toEqual({ a: 2, b: 3, c: 4 });
    expect(received).toEqual([1, 2, 3, 2, 1, 3]);
    expect(await cache.get('b')).toEqual(2);
  });
});
