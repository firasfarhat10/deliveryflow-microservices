const grpc = require("@grpc/grpc-js");
require("dotenv").config();

const {
  orderProto,
  getOrderServiceDefinition,
} = require("./grpc/order.grpc");

const PORT = process.env.ORDER_SERVICE_PORT || 50051;

function startServer() {
  const server = new grpc.Server();

  server.addService(
    orderProto.OrderService.service,
    getOrderServiceDefinition()
  );

  const address = `0.0.0.0:${PORT}`;

  server.bindAsync(
    address,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("Failed to start Order Service:", error);
        process.exit(1);
      }

      console.log(`Order Service gRPC server running on port ${port}`);
    }
  );
}

startServer();