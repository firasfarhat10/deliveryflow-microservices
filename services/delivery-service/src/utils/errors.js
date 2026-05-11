function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateCreateDeliveryInput(data) {
  const errors = [];

  if (isEmpty(data.orderId)) {
    errors.push("orderId is required");
  }

  return errors;
}

function validateAssignCourierInput(data) {
  const errors = [];

  if (isEmpty(data.deliveryId)) {
    errors.push("deliveryId is required");
  }

  if (isEmpty(data.courierId)) {
    errors.push("courierId is required");
  }

  return errors;
}

module.exports = {
  validateCreateDeliveryInput,
  validateAssignCourierInput,
};