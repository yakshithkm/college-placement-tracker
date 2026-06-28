/**
 * Consistent API response helpers
 */

const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data, message = 'Created') => {
  return success(res, data, message, 201);
};

const paginated = (res, data, pagination) => {
  return res.status(200).json({ success: true, data, pagination });
};

const noContent = (res) => res.status(204).send();

module.exports = { success, created, paginated, noContent };
