import { promises as fs } from 'fs';
import { CacheBuster, CacheBusterConfig } from './CacheBuster';
import { ConsoleLike } from './util/ConsoleLike';
import { isRecord } from './util/isRecord';
import { isStringArray } from './util/isStringArray';

export class CacheBusterCli {
  constructor(protected console: ConsoleLike = global.console) {}

  async run(argv: string[]) {
    try {
      if (argv.includes('--help')) {
        this.console.log(this.help());

        return 0;
      }

      const [inputDir, outputDir, configFile] = argv;

      if (!inputDir) throw new Error('No input directory given');
      if (!outputDir) throw new Error('No output directory given');

      const config = configFile ? await this.loadConfig(configFile) : undefined;

      const cacheBuster = new CacheBuster({
        ...config,
        inputDir,
        outputDir,
      });

      let exitCode = 0;

      cacheBuster.on('error', (err) => {
        this.console.error(err.message);
        exitCode = 1;
      });

      await cacheBuster.run();

      return exitCode;
    } catch (err) {
      this.console.error(err instanceof Error ? err.message : `${err}`);
      this.console.error(this.help());

      return 1;
    }
  }

  help() {
    return `Usage:
    cbst <input dir> <output dir> [<config file>]`;
  }

  async loadConfig(file: string) {
    const config: unknown = JSON.parse(await fs.readFile(file, 'utf-8'));

    if (!isRecord(config)) {
      throw new Error('Config must be an object');
    }

    if (!isStringArray(config.exclude ?? [])) {
      throw new Error('"exclude" must be an array of strings');
    }

    if (!isStringArray(config.sources ?? [])) {
      throw new Error('"sources" must be an array of strings');
    }

    if (!isStringArray(config.html ?? [])) {
      throw new Error('"html" must be an array of strings');
    }

    if (!isStringArray(config.dynamic ?? [])) {
      throw new Error('"dynamic" must be an array of strings');
    }

    if (typeof (config.manifest ?? '') !== 'string') {
      throw new Error('"manifest" must be a string');
    }

    if (typeof (config.hashLength ?? 10) !== 'number') {
      throw new Error('"hashLength" must be number');
    }

    return config as CacheBusterConfig;
  }
}
