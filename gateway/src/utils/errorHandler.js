function grpcCall(client, method, payload = {}) {
  return new Promise((resolve, reject) => {
    client[method](payload, (error, response) => {
      if (error) {
        return reject(error);
      }

      return resolve(response);
    });
  });
}

function sendError(res, error) {
  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
}

module.exports = {
  grpcCall,
  sendError,
};