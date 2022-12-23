import { CacheBusterCli } from '../src';

describe('The Cli', () => {
  const inputDir = 'test/fixtures/public';
  const outputDir = 'test/fixtures/out';

  const cli = new CacheBusterCli();

  const mockLog = jest.spyOn(console, 'log').mockImplementation();
  const mockError = jest.spyOn(console, 'error').mockImplementation();

  it('should be able to run', async () => {
    await cli.run([inputDir, outputDir], true);
  });

  it('should print usage if --help is passed', async () => {
    await cli.run(['--help'], true);
    expect(mockLog).toBeCalledWith(cli.help());
  });

  it('should fail if no arguments are given', async () => {
    await expect(cli.run([], true)).rejects.toThrow('No input directory given');
    expect(mockError).toBeCalledWith('No input directory given');
  });

  it('should fail if no output dir is given', async () => {
    await expect(cli.run([inputDir], true)).rejects.toThrow(
      'No output directory given'
    );
  });

  it('should fail with invalid config', async () => {
    await expect(
      cli.run([inputDir, outputDir, 'test/fixtures/config.invalid.json'], true)
    ).rejects.toThrow('"dynamic" must be an array of strings');
  });

  it('should run with valid config', async () => {
    await cli.run(
      [inputDir, outputDir, 'test/fixtures/config.valid.json'],
      true
    );
  });
});
