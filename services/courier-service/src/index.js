const grpc = require("@grpc/grpc-js");
require("dotenv").config();

const {
  courierProto,
  getCourierServiceDefinition,
} = require("./grpc/courier.grpc");

const { startConsumer } = require("./kafka/consumer");

const PORT = process.env.COURIER_SERVICE_PORT || 50053;

function startGrpcServer() {
  const server = new grpc.Server();

  server.addService(
    courierProto.CourierService.service,
    getCourierServiceDefinition()
  );

  const address = `0.0.0.0:${PORT}`;

  server.bindAsync(
    address,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("Failed to start Courier Service:", error);
        process.exit(1);
      }

      console.log(`Courier Service gRPC server running on port ${port}`);
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