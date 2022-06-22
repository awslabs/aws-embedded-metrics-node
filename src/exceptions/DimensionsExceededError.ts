export class DimensionsExceededError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, DimensionsExceededError.prototype);
  }
}
