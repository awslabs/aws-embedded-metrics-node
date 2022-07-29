export class DimensionSetExceededError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, DimensionSetExceededError.prototype);
  }
}
