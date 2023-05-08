export class MethodNotImplementedError extends Error {
  constructor(name?: string) {
    super(`Method ${name ? `'${name}' ` : ""}not implemented yet`);
  }
}
