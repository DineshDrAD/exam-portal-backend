const mongoose = require("mongoose");

/**
 * Execute a callback function within a MongoDB transaction
 * @param {Function} callback - Async function to execute within transaction
 * @returns {Promise} Result of the callback function
 */
const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Retry a transaction on transient errors
 * @param {Function} callback - Async function to execute within transaction
 * @param {Number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} Result of the callback function
 */
const retryTransaction = async (callback, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback);
    } catch (error) {
      lastError = error;

      // Check if error is transient (can be retried)
      const isTransientError =
        error.hasOwnProperty("errorLabels") &&
        error.errorLabels.includes("TransientTransactionError");

      if (!isTransientError || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

module.exports = {
  withTransaction,
  retryTransaction,
};
