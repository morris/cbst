import { CacheBusterCli } from '../src';

describe('The Cli', () => {
  const inputDir = 'test/fixtures/example/in';
  const outputDir = 'test/fixtures/example/out';

  const cli = new CacheBusterCli();

  const mockLog = jest.spyOn(console, 'log').mockImplementation();
  const mockError = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => jest.resetAllMocks());

  it('should be able to run', async () => {
    expect(await cli.run([inputDir, outputDir])).toEqual(0);
  });

  it('should print usage if --help is passed', async () => {
    expect(await cli.run(['--help'])).toEqual(0);
    expect(mockLog).toBeCalledWith(cli.help());
  });

  it('should fail if no arguments are given', async () => {
    expect(await cli.run([])).toEqual(1);
    expect(mockError).toBeCalledWith('No input directory given');
  });

  it('should fail if no output dir is given', async () => {
    expect(await cli.run([inputDir])).toEqual(1);
    expect(mockError).toBeCalledWith('No output directory given');
  });

  it('should fail with invalid config', async () => {
    expect(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.invalid.json',
      ])
    ).toEqual(1);
    expect(mockError).toBeCalledWith('"dynamic" must be an array of strings');
  });

  it('should run with valid config', async () => {
    expect(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.valid.json',
      ])
    ).toEqual(0);
  });
});
