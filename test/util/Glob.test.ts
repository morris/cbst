import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Glob } from '../../src/util/Glob.js';

describe('Glob', () => {
  it('matches files', () => {
    const glob = new Glob(['*.html', '*.css', '*.js', '!/test.html']);

    const shouldMatch = ['/index.html', '/styles/main.css', '/scripts/main.js'];

    assert.deepStrictEqual(
      shouldMatch.filter((file) => glob.match(file)),
      shouldMatch,
    );

    const shouldNotMatch = [
      '/logo.svg',
      '/img/main.png',
      '/assets/fonts/face.woff',
      '/test.html',
    ];

    assert.deepStrictEqual(
      shouldNotMatch.filter((file) => glob.match(file)),
      [],
    );
  });

  it('matches directory wildcards', () => {
    const glob = new Glob([
      '*.html',
      'styles/**/*.css',
      'any/**/*',
      '/abs/**/test.js',
    ]);

    const shouldMatch = [
      '/index.html',
      '/page/a.html',
      '/styles/main.css',
      '/styles/folder/other.css',
      '/styles/folder/another/other.css',
      '/any/test.jpg',
      '/any/folder/test.png',
      '/any/folder/another/test.png',
      '/sub/any/folder/another/test.png',
      '/abs/folder/another/test.js',
    ];

    assert.deepStrictEqual(
      shouldMatch.filter((file) => glob.match(file)),
      shouldMatch,
    );

    const shouldNotMatch = [
      '/logo.svg',
      '/img/main.png',
      '/assets/fonts/face.woff',
      '/sub/abs/folder/another/test.js',
      '/any',
    ];

    assert.deepStrictEqual(
      shouldNotMatch.filter((file) => glob.match(file)),
      [],
    );
  });

  it('does not match files ending with given non-wildcard patterns', () => {
    const glob = new Glob(['test.html']);

    assert.deepStrictEqual(glob.match('test.html'), true);
    assert.deepStrictEqual(glob.match('foo/test.html'), true);
    assert.deepStrictEqual(glob.match('mytest.html'), false);
    assert.deepStrictEqual(glob.match('foo/mytest.html'), false);
  });
});
