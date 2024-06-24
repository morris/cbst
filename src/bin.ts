#!/usr/bin/env node
import { CacheBusterCli } from './CacheBusterCli.js';

const cli = new CacheBusterCli();

cli.run(process.argv.slice(2)).then((exitCode) => process.exit(exitCode));
