export interface ConsoleLike {
  log(message: string): unknown;
  error(message: string | Error): unknown;
}
