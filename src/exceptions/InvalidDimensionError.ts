export class InvalidDimensionError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidDimensionError.prototype);
  }
}
