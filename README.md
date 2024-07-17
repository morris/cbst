# cbst

A cache buster that versions a website's files for immutable cache control.

- Takes a directory containing a website (i.e. HTML, CSS, JS and other files),
- appends version tags to static files,
- rewrites references to versioned files,
- and writes the result into an output directory.

## Installation

```
npm install cbst --save-dev # project installation (recommended)
npm install cbst --global   # global installation
```

## Usage

```
cbst <input dir> <output dir> [<config file>]
```

## Example

This diff demonstrates how versioning is applied to a simple website:

```diff
# /index.html

  <!DOCTYPE html>
  <html>
    <head>
      <title>Hello, World!</title>
-     <link rel="stylesheet" href="/styles/main.css">
+     <link rel="stylesheet" href="/styles/main.ed1e118152.css">
    </head>
    <body>
      <h1>Hello, World!</h1>
      <p>
-       <img id="welcome" src="/assets/loading.svg">
+       <img id="welcome" src="/assets/loading.834ab3df39.svg">
      </p>
      <script type="module">
-       import { main } from './scripts/main.js';
+       import { main } from './scripts/main.f39e95e656.js';

        setTimeout(main, 1000);
      </script>
    </body>
  </html>

# /scripts/main.js -> /scripts/main.f39e95e656.js

- import { hello } from './hello.js';
+ import { hello } from './hello.93724d33b5.js';

  export function main() {
    hello('world');
-   document.getElementById('welcome').src = '/assets/welcome.svg';
+   document.getElementById('welcome').src = '/assets/welcome.afe45bb832.svg';
  }

# /styles/main.css -> /styles/main.ed1e118152.css
# /scripts/hello.js -> /scripts/hello.93724d33b5.js
# etc.
```

## Configuration

The configuration file (JSON) supports the following properties:

- `exclude`
  - List of file patterns to exclude.
  - Defaults to `[]`.
- `source`
  - List of file patterns to treat as sources with references to other files.
  - Defaults to `["*.html", "*.css", "*.js", "*.svg", "*.json"]`.
- `html`
  - List of file patterns to treat as HTML.
  - Defaults to `["*.html"]`.
- `dynamic`
  - List of file patterns to treat as dynamic.
  - Matching files will not be versioned.
  - References found in matching source files will be still be rewritten.
  - Defaults to `["*.html"]`.
- `metadata`
  - Metadata filename.
  - Defaults to `.cbst.json`.
- `hashLength`
  - Length of hashes in versioned filenames.
  - Defaults to `10`.

File patterns support `*` (slash-free wildcards) and `/**/` (directory
wildcards).

## Versioning and References

As `cbst` transforms files, it also rewrites any references to other versioned
files. References are detected by scanning source files for **quoted strings**
that

- are double- or single-quoted,
- contain no whitespace or quotes,
- and have a file extension.

If a reference can be resolved to a file, and that file is not `dynamic`, the
reference is rewritten with the versioned filename.

If a reference cannot be resolved to a file, the reference is not modified.

## Static vs. Dynamic Files

**Static files** (not listed in `dynamic`) will be versioned based on a hash of
their contents, as well as the contents of any referenced files. Circular
references are resolved deterministically.

Static files should be delivered with a `Cache-Control` header that allows
browsers and proxies to cache them indefinitely. For example:

```
Cache-Control: public, max-age=31536000, immutable
```

**Dynamic files** (those listed in `dynamic`) will not be versioned, but any
references detected inside these files will be rewritten if necessary. For
example, `*.html` files are usually be marked dynamic because they are directly
visited, not indirectly requested like other files.

Dynamic files should be delivered with a `Cache-Control` header that requires
browsers and proxies to revalidate the file in a timely fashion. Additional
`E-Tag` or `Last-Modified` headers should be provided to allow conditional
requests. For example:

```
Cache-Control: public, max-age=604800, stale-while-revalidate=86400
ETag: 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33
```

See also

- [Cache-Control (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Conditional requests (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)

## Discussion

> I can't use my favorite libraries from NPM with this because they require
> Node.js resolution and/or bundling.

Chicken and egg problem here. The industry got used to bundlers and started
building libraries for the web assuming that everyone used a bundler.

Ask library authors to ship standard ESM modules. That will make all our lives
easier.

> Isn't bundling still more performant for larger websites?

You should be fine if your website is delivered via HTTP/2 with compression and
solid cache control.

For recurring users, bundled websites that are modified regularly require
downloading/parsing the entire bundle after every modification.

With fine-grained file versioning and long-term caching, the first page visit
may suffer, but recurring users will have a better experience.

Finally, avoiding frameworks and large dependencies is a much more effective
optimization in the first place.

> What about minification?

It's out of scope for `cbst`. There are too many options to consider, and any
integration with minifiers will probably result in config/plug-in hell.

Instead, websites should be minified in a separate pass during a production
build, usually before cache busting.

> Why is this implemented with regular expressions? Everyone knows you can't
> parse HTML, CSS, and JS like that!!1

It's a trade-off. The RegExp-based implementation is simple, fast, and will only
fail in obscure cases (hopefully).
