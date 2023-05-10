import { CacheBuster } from '../src';

describe('The Builder', () => {
  const errors: Error[] = [];
  const options = {
    inputDir: 'test/fixtures/all/in',
    outputDir: 'test/fixtures/all/out',
    exclude: ['example.com'],
  };

  beforeEach(() => {
    errors.length = 0;
  });

  it('should be able to get the base of HTML files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    expect(await cb.getBase('index.html')).toEqual('.');
    expect(await cb.getBase('base/base.html')).toEqual('/');

    expect(errors).toEqual([]);
  });

  it('should be able to get references of HTML files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    expect(await cb.getReferences('index.html')).toEqual([
      'styles/main.css',
      'assets/test.svg',
      'scripts/main.js',
    ]);

    expect(await cb.getReferences('base/base.html')).toEqual([
      'styles/main.css',
      'assets/test.svg',
      'scripts/main.js',
    ]);

    expect(errors).toEqual([]);
  });

  it('should be able to get references of JS files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    expect(await cb.getReferences('scripts/main.js')).toEqual([
      'scripts/lib.js',
      'sw.js',
    ]);

    expect(await cb.getReferences('scripts/lib.js')).toEqual([]);

    expect(await cb.getReferences('scripts/circular/a.js')).toEqual([
      'scripts/circular/b.js',
    ]);

    expect(errors).toEqual([]);
  });

  it('should be able to transform HTML files', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    const result = await cb.transformFile('index.html');

    expect(result.toString()).toEqual(
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
`
    );

    expect(errors).toEqual([]);
  });

  it('should be able to run', async () => {
    const cb = new CacheBuster(options);

    cb.on('error', (err) => errors.push(err));

    await cb.run();

    expect(errors.map((err) => err.message)).toEqual([
      'Could not resolve wut.jpg from obscure.html',
      'Could not resolve 404.js from obscure.html',
      'Could not resolve ..jpg from obscure.html',
      'Could not resolve test..jpg from obscure.html',
    ]);
  });

  it('should be able to run the example', async () => {
    const cb = new CacheBuster({
      inputDir: 'test/fixtures/example/in',
      outputDir: 'test/fixtures/example/out',
    });

    cb.on('error', (err) => errors.push(err));

    await cb.run();

    expect(errors).toEqual([]);
  });

  describe('should correctly identify external references', () => {
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

    it.each(table)('(%s %s)', (reference, result) => {
      expect(cb.isExternalReference(reference)).toEqual(result);
    });
  });
});
