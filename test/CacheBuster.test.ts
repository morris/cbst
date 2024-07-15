import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { CacheBuster } from '../src';

describe('CacheBuster', () => {
  const errors: Error[] = [];
  const options = {
    inputDir: 'test/fixtures/all/in',
    outputDir: 'test/fixtures/all/out',
    exclude: ['example.com'],
  };

  beforeEach(() => {
    errors.length = 0;
  });

  it('gets the base of HTML files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    assert.deepStrictEqual(await cb.getBase('index.html'), '.');
    assert.deepStrictEqual(await cb.getBase('base/base.html'), '/');

    assert.deepStrictEqual(errors, []);
  });

  it('gets references of HTML files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    assert.deepStrictEqual(await cb.getReferences('index.html'), [
      'styles/main.css',
      'assets/test.svg',
      'scripts/main.js',
    ]);

    assert.deepStrictEqual(await cb.getReferences('base/base.html'), [
      'styles/main.css',
      'assets/test.svg',
      'scripts/main.js',
    ]);

    assert.deepStrictEqual(errors, []);
  });

  it('gets references of JS files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    assert.deepStrictEqual(await cb.getReferences('scripts/main.js'), [
      'scripts/lib.js',
      'sw.js',
    ]);

    assert.deepStrictEqual(await cb.getReferences('scripts/lib.js'), []);

    assert.deepStrictEqual(await cb.getReferences('scripts/circular/a.js'), [
      'scripts/circular/b.js',
    ]);

    assert.deepStrictEqual(errors, []);
  });

  it('transforms HTML files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    const result = await cb.transformFile('index.html');

    assert.deepStrictEqual(
      result.toString(),
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hello World</title>
    <link rel="stylesheet" href="./styles/main.206eafe2ce.css" />
    <script
      defer
      data-domain="example.com"
      src="https://thirdparty.io/js/script.js"
    ></script>
  </head>
  <body>
    <h1>Test</h1>
    <p><img src="./assets/test.330398492f.svg" /></p>
    <p><a href="mailto:foo@bar.cbst">Contact</a></p>
    <script type="module">
      import { main } from './scripts/main.f39e95e656.js';

      main();
    </script>
  </body>
</html>
`,
    );

    assert.deepStrictEqual(errors, []);
  });

  it('works', async (t) => {
    const mockError = t.mock.method(console, 'error');
    mockError.mock.mockImplementation(() => {});

    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    await cb.run();

    assert.deepStrictEqual(
      errors.map((err) => err.message),
      [
        'Could not resolve wut.jpg from obscure.html',
        'Could not resolve 404.js from obscure.html',
        'Could not resolve ..jpg from obscure.html',
        'Could not resolve test..jpg from obscure.html',
      ],
    );
  });

  it('works with the example', async () => {
    const cb = new CacheBuster({
      inputDir: 'test/fixtures/example/in',
      outputDir: 'test/fixtures/example/out',
    });

    cb.on('error', (err) => errors.push(err));

    await cb.run();

    assert.deepStrictEqual(errors, []);
  });

  describe('correctly identifies external references', () => {
    const cb = new CacheBuster({
      inputDir: 'test/fixtures/example/in',
      outputDir: 'test/fixtures/example/out',
    });

    const table: [string, boolean][] = [
      ['http://test', true],
      ['http://example.com', true],
      ['file://test.exe', true],
      ['//test.exe', true],
      ['http+x://test.exe', true],
      ['mailto:me@example.com', true],
      ['ftp-my-breh:upload', true],
      ['ftp+my.breh:upload', true],
      ['scripts/test.js', false],
      ['./styles/main.css', false],
    ];

    for (const [reference, result] of table) {
      it(`(${reference} ${result})`, () => {
        assert.deepStrictEqual(cb.isExternalReference(reference), result);
      });
    }
  });
});
