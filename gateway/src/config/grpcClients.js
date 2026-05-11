const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
require("dotenv").config();

function loadProto(protoFile, packageName) {
  const protoPath = path.join(__dirname, "../../../proto", protoFile);

  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return grpc.loadPackageDefinition(packageDefinition)[packageName];
}

const orderProto = loadProto("order.proto", "order");
const deliveryProto = loadProto("delivery.proto", "delivery");
const courierProto = loadProto("courier.proto", "courier");

const orderClient = new orderProto.OrderService(
  process.env.ORDER_SERVICE_URL || "localhost:50051",
  grpc.credentials.createInsecure()
);

const deliveryClient = new deliveryProto.DeliveryService(
  process.env.DELIVERY_SERVICE_URL || "localhost:50052",
  grpc.credentials.createInsecure()
);

const courierClient = new courierProto.CourierService(
  process.env.COURIER_SERVICE_URL || "localhost:50053",
  grpc.credentials.createInsecure()
);

module.exports = {
  orderClient,
  deliveryClient,
  courierClient,
};