interface CompiledPattern {
  inverted: boolean;
  rx: RegExp;
}

export class Glob {
  protected patterns: CompiledPattern[];

  constructor(patterns: string[]) {
    this.patterns = patterns.map((pattern) => this.compile(pattern));
  }

  match(file: string) {
    let matched = false;

    for (const compiled of this.patterns) {
      if (compiled.inverted) {
        if (file.match(compiled.rx)) return false;
      } else if (!matched) {
        if (file.match(compiled.rx)) matched = true;
      }
    }

    return matched;
  }

  protected compile(pattern: string): CompiledPattern {
    const inverted = !!pattern.match(/^!/);
    const prefix = pattern.match(/^!?\//) ? '^' : '(^|/)';

    const rxBase = pattern
      .slice(inverted ? 1 : 0)
      .replace(/(\/\*\*\/)|(\*\*)|(\*)|([.+])/g, (_, ...groups) => {
        if (groups[0]) {
          // directory wildcard
          return '(/.+?/|/)';
        } else if (groups[1]) {
          throw new Error(
            `Invalid glob pattern ${pattern}; double star must be enclosed by slashes`
          );
        } else if (groups[2]) {
          // slash-free wildcard
          return '[^/]*';
        } else {
          // . or +
          return `\\${groups[3]}`;
        }
      });

    const rx = new RegExp(prefix + rxBase + '$');

    return {
      inverted,
      rx,
    };
  }
}
