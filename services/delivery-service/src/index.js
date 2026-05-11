const grpc = require("@grpc/grpc-js");
require("dotenv").config();

const {
  deliveryProto,
  getDeliveryServiceDefinition,
} = require("./grpc/delivery.grpc");

const PORT = process.env.DELIVERY_SERVICE_PORT || 50052;

function startServer() {
  const server = new grpc.Server();

  server.addService(
    deliveryProto.DeliveryService.service,
    getDeliveryServiceDefinition()
  );

  const address = `0.0.0.0:${PORT}`;

  server.bindAsync(
    address,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("Failed to start Delivery Service:", error);
        process.exit(1);
      }

      console.log(`Delivery Service gRPC server running on port ${port}`);
    }
  );
}

startServer();