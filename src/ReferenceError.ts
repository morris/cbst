export class ReferenceError extends Error {
  constructor(
    public originalError: Error,
    public source: string,
    public reference: string
  ) {
    super(
      `Could not resolve reference ${reference} from ${source} (${originalError.message})`
    );
  }
}
