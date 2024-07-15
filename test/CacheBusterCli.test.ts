import assert from 'node:assert';
import { describe, it } from 'node:test';
import { CacheBusterCli } from '../src';

describe('CacheBusterCli', () => {
  const inputDir = 'test/fixtures/all/in';
  const outputDir = 'test/fixtures/all/out';

  const cli = new CacheBusterCli();

  it('runs without config', async (t) => {
    const mockError = t.mock.method(console, 'error');
    mockError.mock.mockImplementation(() => {});

    assert.deepStrictEqual(await cli.run([inputDir, outputDir]), 1);
  });

  it('prints usage if --help is passed', async (t) => {
    const mockLog = t.mock.method(console, 'log');
    mockLog.mock.mockImplementation(() => {});

    assert.deepStrictEqual(await cli.run(['--help']), 0);
    assert.deepStrictEqual(mockLog.mock.calls[0].arguments, [cli.help()]);
  });

  it('fails if no arguments are given', async (t) => {
    const mockError = t.mock.method(console, 'error');
    mockError.mock.mockImplementation(() => {});

    assert.deepStrictEqual(await cli.run([]), 1);
    assert.deepStrictEqual(mockError.mock.calls[0].arguments, [
      'No input directory given',
    ]);
  });

  it('fails if no output dir is given', async (t) => {
    const mockError = t.mock.method(console, 'error');
    mockError.mock.mockImplementation(() => {});

    assert.deepStrictEqual(await cli.run([inputDir]), 1);
    assert.deepStrictEqual(mockError.mock.calls[0].arguments, [
      'No output directory given',
    ]);
  });

  it('fails with invalid config', async (t) => {
    const mockError = t.mock.method(console, 'error');
    mockError.mock.mockImplementation(() => {});

    assert.deepStrictEqual(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.invalid.json',
      ]),
      1,
    );
    assert.deepStrictEqual(mockError.mock.calls[0].arguments, [
      '"dynamic" must be an array of strings',
    ]);
  });

  it('runs with valid config but fails because of unresolved references', async (t) => {
    const mockError = t.mock.method(console, 'error');
    mockError.mock.mockImplementation(() => {});

    assert.deepStrictEqual(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.valid.json',
      ]),
      1,
    );
  });

  it('runs successfully with the right config', async (t) => {
    const mockError = t.mock.method(console, 'error');
    mockError.mock.mockImplementation(() => {});

    assert.deepStrictEqual(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.pass.json',
      ]),
      0,
    );
    assert.deepStrictEqual(mockError.mock.callCount(), 0);
  });
});
