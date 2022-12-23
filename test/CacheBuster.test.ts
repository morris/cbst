import { CacheBuster } from '../src';

describe('The Builder', () => {
  const options = {
    inputDir: 'test/fixtures/public',
    outputDir: 'test/fixtures/out',
  };

  it('should be able to get the base of HTML files', async () => {
    const cb = new CacheBuster(options);

    expect(await cb.getBase('index.html')).toEqual('.');
    expect(await cb.getBase('base/base.html')).toEqual('/');
  });

  it('should be able to get references of HTML files', async () => {
    const cb = new CacheBuster(options);

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
  });

  it('should be able to get references of JS files', async () => {
    const cb = new CacheBuster(options);

    expect(await cb.getReferences('scripts/main.js')).toEqual([
      'scripts/lib.js',
      'sw.js',
    ]);

    expect(await cb.getReferences('scripts/lib.js')).toEqual([]);

    expect(await cb.getReferences('scripts/circular/a.js')).toEqual([
      'scripts/circular/b.js',
    ]);
  });

  it('should be able to transform HTML files', async () => {
    const cb = new CacheBuster(options);
    const result = await cb.transformFile('index.html');

    expect(result.toString()).toEqual(
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hello World</title>
    <link rel="stylesheet" href="./styles/main.206eafe2ce.css" />
  </head>
  <body>
    <h1>Test</h1>
    <p><img src="./assets/test.330398492f.svg" /></p>
    <script type="module">
      import { main } from './scripts/main.f39e95e656.js';

      main();
    </script>
  </body>
</html>
`
    );
  });

  it('should be able to build', async () => {
    const cb = new CacheBuster(options);

    await cb.run();
  });
});
