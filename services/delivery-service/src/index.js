const grpc = require("@grpc/grpc-js");
require("dotenv").config();

const {
  deliveryProto,
  getDeliveryServiceDefinition,
} = require("./grpc/delivery.grpc");

const { startConsumer } = require("./kafka/consumer");

const PORT = process.env.DELIVERY_SERVICE_PORT || 50052;

function startGrpcServer() {
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

async function startService() {
  startGrpcServer();

  try {
    await startConsumer();
  } catch (error) {
    console.error("Failed to start Kafka consumer:", error.message);
  }
}

startService();