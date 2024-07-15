import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Cache } from '../../src/util/Cache.js';

describe('Cache', () => {
  it('caches', async () => {
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

    assert.deepStrictEqual(data, { a: 2, b: 3, c: 4 });
    assert.deepStrictEqual(received, [1, 2, 3, 2, 1, 3]);
    assert.deepStrictEqual(await cache.get('b'), 2);
  });
});
