import { createHash } from 'crypto';
import EventEmitter from 'events';
import { promises as fs } from 'fs';
import { posix as path } from 'path';
import { ReferenceError } from './ReferenceError';
import { Cache } from './util/Cache';
import { Glob } from './util/Glob';

export interface CacheBusterConfig {
  /**
   * List of file patterns to exclude entirely.
   * Defaults to `[]`.
   */
  exclude?: string[];

  /**
   * List of file patterns to treat as source files with references.
   * Defaults to `['*.html', '*.css', '*.js', '*.svg', '*.json']`.
   */
  source?: string[];

  /**
   * List of file patterns to treat as HTML.
   * Defaults to `['*.html']`.
   */
  html?: string[];

  /**
   * List of file patterns to treat as dynamic (filenames will not be versioned).
   * Defaults to `['*.html']`.
   */
  dynamic?: string[];

  /**
   * Metadata filename.
   * Defaults to `'.cbst.json'`
   */
  metadata?: string;

  /**
   * Length of hashes in versioned filenames.
   * Defaults to 10.
   */
  hashLength?: number;
}

export interface CacheBusterOptions extends CacheBusterConfig {
  /**
   * Input directory
   */
  inputDir: string;

  /**
   * Output directory
   */
  outputDir: string;
}

export class CacheBuster extends EventEmitter {
  public static defaultConfig: Required<CacheBusterConfig> = {
    exclude: [],
    source: ['*.html', '*.css', '*.js', '*.svg', '*.json'],
    html: ['*.html'],
    dynamic: ['*.html'],
    metadata: '.cbst.json',
    hashLength: 10,
  };

  protected inputDir: string;
  protected outputDir: string;
  protected excludeGlob: Glob;
  protected sourceGlob: Glob;
  protected htmlGlob: Glob;
  protected dynamicGlob: Glob;
  protected metadata: string;
  protected hashLength: number;

  protected hashFileCache = new Cache((file) => this.hashFile(file));
  protected getReferencesCache = new Cache((file) => this.getReferences(file));
  protected hashRawFileCache = new Cache((file) => this.hashRawFile(file));
  protected readFileCache = new Cache((file) => this.readFile(file));

  protected map = new Map<string, string>();
  protected unresolved = new Map<string, Set<string>>();

  protected referenceRx =
    /((")(([^"\s]+)\.([a-zA-Z0-9]+))")|((')(([^'\s]+)\.([a-zA-Z0-9]+))')|# sourceMappingURL=(([^\s]+)\.([a-zA-Z0-9]+))/g;
  protected externalReferenceRx = /^([a-zA-Z][a-zA-Z0-9+.\-]*:|\/\/)/;
  protected baseRx = /<base[^<>]+href\s*=\s*"([^"]+)"[^<>]*>/i;
  protected extensionRx = /(?<=\.)[^.]+$/;

  constructor(options: CacheBusterOptions) {
    super();

    const o = { ...CacheBuster.defaultConfig, ...options };

    this.inputDir = o.inputDir;
    this.outputDir = o.outputDir;
    this.excludeGlob = new Glob(o.exclude);
    this.sourceGlob = new Glob(o.source);
    this.htmlGlob = new Glob(o.html);
    this.dynamicGlob = new Glob(o.dynamic);
    this.metadata = o.metadata;
    this.hashLength = o.hashLength;
  }

  async run() {
    await this.handleDir('.');
    await this.writeMetadata();
  }

  async writeMetadata() {
    await this.writeFile(
      this.metadata,
      JSON.stringify({ map: Object.fromEntries(this.map.entries()) }),
    );
  }

  async handleDir(dir: string) {
    if (this.excludeGlob.match(dir)) return undefined;

    const entries = await this.readDir(dir);
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      if (entry.isFile()) {
        await this.handleFile(path.join(dir, entry.name));
      } else if (entry.isDirectory()) {
        await this.handleDir(path.join(dir, entry.name));
      }
    }
  }

  async handleFile(file: string) {
    if (this.excludeGlob.match(file)) return undefined;

    const output = await this.transformFile(file);
    const hash = await this.hashFileCache.get(file);

    const outputFile = hash
      ? file.replace(
          this.extensionRx,
          (extension) => `${this.formatVersion(hash)}.${extension}`,
        )
      : file;

    this.map.set(file, outputFile);

    await this.writeFile(outputFile, output);

    if (!this.sourceGlob.match(file)) {
      this.readFileCache.delete(file);
    }
  }

  async transformFile(file: string) {
    const references = await this.getReferencesCache.get(file);
    const buffer = await this.readFileCache.get(file);

    if (references.length === 0) {
      return buffer;
    }

    const hashes = await Promise.all(
      references.map((reference) =>
        this.hashFileCache.get(reference).catch((err) => {
          this.handleReferenceError(err, file, reference);

          return undefined;
        }),
      ),
    );
    const source = buffer.toString();

    let i = 0;

    return source.replace(this.referenceRx, (match, ...groups) => {
      const quote = groups[1] || groups[6];
      const reference = groups[2] || groups[7] || groups[10];
      const filename = groups[3] || groups[8] || groups[11];
      const extension = groups[4] || groups[9] || groups[12];

      if (!this.isResolvableReference(reference)) return match;

      const hash = hashes[i++];

      if (!hash) return match;

      if (groups[10]) {
        return `# sourceMappingURL=${filename}.${this.formatVersion(
          hash,
        )}.${extension}`;
      }

      return `${quote}${filename}.${this.formatVersion(
        hash,
      )}.${extension}${quote}`;
    });
  }

  async hashFile(file: string) {
    if (this.dynamicGlob.match(file)) return undefined;

    return this.hash([
      await this.hashRawFileCache.get(file),
      ...(await this.hashFileReferences(file, [])),
    ]);
  }

  async hashFileReferences(file: string, exclude: string[]): Promise<string[]> {
    if (exclude.includes(file)) return [];

    const references = await this.getReferencesCache.get(file);

    const direct = await Promise.all(
      references.map((it) =>
        this.hashRawFileCache.get(it).catch((err) => {
          this.handleReferenceError(err, file, it);

          return '';
        }),
      ),
    );

    const deep = await Promise.all(
      references.map((it) =>
        this.hashFileReferences(it, [...exclude, file]).catch((err) => {
          this.handleReferenceError(err, file, it);

          return [];
        }),
      ),
    );

    return [...direct, ...deep.flat()];
  }

  async hashRawFile(file: string) {
    const buffer = await this.readFileCache.get(file);

    return this.hash([buffer]);
  }

  handleReferenceError(error: Error, source: string, reference: string) {
    let unresolved = this.unresolved.get(source);

    if (!unresolved) {
      unresolved = new Set();
      this.unresolved.set(source, unresolved);
    }

    if (unresolved.has(reference)) return;

    unresolved.add(reference);

    this.emit('error', new ReferenceError(error, source, reference));
  }

  // references

  async getReferences(file: string) {
    if (!this.sourceGlob.match(file)) return [];

    const buffer = await this.readFileCache.get(file);
    const source = buffer.toString();
    const base = await this.getBase(file);
    const references: string[] = [];

    for (const match of source.matchAll(this.referenceRx)) {
      const reference = match[3] || match[8] || match[11];

      if (this.isResolvableReference(reference)) {
        references.push(this.resolveReference(base, reference));
      }
    }

    return references;
  }

  isResolvableReference(reference: string) {
    return (
      !this.isExternalReference(reference) && !this.excludeGlob.match(reference)
    );
  }

  isExternalReference(reference: string) {
    return !!reference.match(this.externalReferenceRx);
  }

  resolveReference(base: string, reference: string) {
    if (reference[0] === '/') return reference.slice(1);

    return path.join(base[0] === '/' ? base.slice(1) : base, reference);
  }

  async getBase(file: string) {
    if (this.htmlGlob.match(file)) {
      const buffer = await this.readFileCache.get(file);
      const source = buffer.toString();
      const match = source.match(this.baseRx);

      if (match) return match[1];
    }

    return path.dirname(file);
  }

  // hashing

  formatVersion(hash: string) {
    return hash.slice(0, this.hashLength);
  }

  hash(inputs: (string | Buffer)[]) {
    const h = createHash('sha1');

    for (const input of inputs) h.update(input);

    return h.digest('hex');
  }

  // i/o

  async readFile(file: string) {
    return fs.readFile(this.safePath(this.inputDir, file));
  }

  async readDir(dir: string) {
    return fs.readdir(this.safePath(this.inputDir, dir), {
      withFileTypes: true,
    });
  }

  async writeFile(file: string, data: string | Buffer) {
    const outputFile = this.safePath(this.outputDir, file);

    await fs.mkdir(path.dirname(outputFile), { recursive: true });

    return fs.writeFile(outputFile, data);
  }

  safePath(rootDir: string, candidate: string) {
    const s = path.normalize(path.join(rootDir, candidate));

    if (s.indexOf(rootDir) !== 0) {
      throw new Error(
        `Trying to access file outside of ${rootDir}: ${candidate}`,
      );
    }

    return s;
  }
}
