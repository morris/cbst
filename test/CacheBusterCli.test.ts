import { CacheBusterCli } from '../src';

describe('The Cli', () => {
  const inputDir = 'test/fixtures/all/in';
  const outputDir = 'test/fixtures/all/out';

  const cli = new CacheBusterCli();

  const mockLog = jest.spyOn(console, 'log');
  const mockError = jest.spyOn(console, 'error');

  beforeEach(() => {
    jest.resetAllMocks();
    mockLog.mockImplementation();
    mockError.mockImplementation();
  });

  it('should be able to run without config', async () => {
    expect(await cli.run([inputDir, outputDir])).toEqual(1);
  });

  it('should print usage if --help is passed', async () => {
    expect(await cli.run(['--help'])).toEqual(0);
    expect(mockLog).toHaveBeenCalledWith(cli.help());
  });

  it('should fail if no arguments are given', async () => {
    expect(await cli.run([])).toEqual(1);
    expect(mockError).toHaveBeenCalledWith('No input directory given');
  });

  it('should fail if no output dir is given', async () => {
    expect(await cli.run([inputDir])).toEqual(1);
    expect(mockError).toHaveBeenCalledWith('No output directory given');
  });

  it('should fail with invalid config', async () => {
    expect(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.invalid.json',
      ]),
    ).toEqual(1);
    expect(mockError).toHaveBeenCalledWith(
      '"dynamic" must be an array of strings',
    );
  });

  it('should run with valid config but fail because of unresolved references', async () => {
    expect(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.valid.json',
      ]),
    ).toEqual(1);
  });

  it('should run successfully with the right config', async () => {
    expect(
      await cli.run([
        inputDir,
        outputDir,
        'test/fixtures/all/config.pass.json',
      ]),
    ).toEqual(0);
    expect(mockError).toHaveBeenCalledTimes(0);
  });
});
