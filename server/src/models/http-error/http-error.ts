/**
 * HttpError class.
 * This class extends the built-in Error class in JavaScript.
 * It adds a code property to the standard Error, which can be used to represent HTTP status codes.
 * 
 * @property {string} message - The error message.
 * @property {number} code - The HTTP status code associated with the error.
 */
export class HttpError extends Error {
    /**
   * Creates a new HttpError.
   * 
   * @param {string} message - The error message.
   * @param {number} code - The HTTP status code associated with the error.
   */
  constructor(public message: string, public code: number) {
    super(message);
    this.code = code;
  }
}