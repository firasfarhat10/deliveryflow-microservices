function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateCreateOrderInput(data) {
  const errors = [];

  if (isEmpty(data.customerName)) {
    errors.push("customerName is required");
  }

  if (isEmpty(data.customerPhone)) {
    errors.push("customerPhone is required");
  }

  if (isEmpty(data.pickupAddress)) {
    errors.push("pickupAddress is required");
  }

  if (isEmpty(data.deliveryAddress)) {
    errors.push("deliveryAddress is required");
  }

  return errors;
}

module.exports = {
  validateCreateOrderInput,
};