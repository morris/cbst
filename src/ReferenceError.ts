export class ReferenceError extends Error {
  constructor(
    public originalError: Error & { code?: string },
    public source: string,
    public reference: string,
  ) {
    super(
      originalError.code === 'ENOENT'
        ? `Could not resolve ${reference} from ${source}`
        : `Could not resolve ${reference} from ${source} (${originalError.message})`,
    );
  }
}
