import { Glob } from '../../src/util/Glob.js';

describe('A Glob', () => {
  it('should be able to match files', () => {
    const glob = new Glob(['*.html', '*.css', '*.js', '!/test.html']);

    const shouldMatch = ['/index.html', '/styles/main.css', '/scripts/main.js'];

    expect(shouldMatch.filter((file) => glob.match(file))).toEqual(shouldMatch);

    const shouldNotMatch = [
      '/logo.svg',
      '/img/main.png',
      '/assets/fonts/face.woff',
      '/test.html',
    ];

    expect(shouldNotMatch.filter((file) => glob.match(file))).toEqual([]);
  });

  it('should be able to match directory wildcards', () => {
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

    expect(shouldMatch.filter((file) => glob.match(file))).toEqual(shouldMatch);

    const shouldNotMatch = [
      '/logo.svg',
      '/img/main.png',
      '/assets/fonts/face.woff',
      '/sub/abs/folder/another/test.js',
      '/any',
    ];

    expect(shouldNotMatch.filter((file) => glob.match(file))).toEqual([]);
  });

  it('should not match files ending with given non-wildcard patterns', () => {
    const glob = new Glob(['test.html']);

    expect(glob.match('test.html')).toEqual(true);
    expect(glob.match('foo/test.html')).toEqual(true);
    expect(glob.match('mytest.html')).toEqual(false);
    expect(glob.match('foo/mytest.html')).toEqual(false);
  });
});
