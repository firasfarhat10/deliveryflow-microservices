function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateCreateCourierInput(data) {
  const errors = [];

  if (isEmpty(data.name)) {
    errors.push("name is required");
  }

  if (isEmpty(data.phone)) {
    errors.push("phone is required");
  }

  if (isEmpty(data.vehicleType)) {
    errors.push("vehicleType is required");
  }

  return errors;
}

module.exports = {
  validateCreateCourierInput,
};