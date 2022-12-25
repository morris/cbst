import { promises as fs } from 'fs';
import { CacheBuster, CacheBusterConfig } from './CacheBuster';
import {
  assertNumber,
  assertRecord,
  assertString,
  assertStringArray,
} from './util/assert';
import { ConsoleLike } from './util/ConsoleLike';

export class CacheBusterCli {
  constructor(protected console: ConsoleLike = global.console) {}

  async run(argv: string[], noExit = false) {
    try {
      if (argv.includes('--help')) {
        this.console.log(this.help());

        return;
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

      cacheBuster.on('error', (err) => this.console.error(err.message));

      await cacheBuster.run();
    } catch (err) {
      this.console.error(err instanceof Error ? err.message : `${err}`);
      this.console.error(this.help());

      if (noExit) throw err;

      process.exit(1);
    }
  }

  help() {
    return `Usage:
    cbst <input dir> <output dir> [<config file>]`;
  }

  async loadConfig(file: string) {
    const config: unknown = JSON.parse(await fs.readFile(file, 'utf-8'));

    assertRecord(config, 'Config must be an object');
    assertStringArray(
      config.exclude ?? [],
      '"exclude" must be an array of strings'
    );
    assertStringArray(
      config.sources ?? [],
      '"sources" must be an array of strings'
    );
    assertStringArray(config.html ?? [], '"html" must be an array of strings');
    assertStringArray(
      config.dynamic ?? [],
      '"dynamic" must be an array of strings'
    );
    assertString(config.manifest ?? '', '"manifest" must be a string');
    assertNumber(config.hashLength ?? 10, '"hashLength" must be number');

    return config as CacheBusterConfig;
  }
}
