const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const orderRepository = require("../repositories/order.repository");
const { validateCreateOrderInput } = require("../utils/errors");

const PROTO_PATH = path.join(__dirname, "../../../../proto/order.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

function toProtoOrder(order) {
  if (!order) return null;

  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function createOrder(call, callback) {
  try {
    const input = {
      customerName: call.request.customerName,
      customerPhone: call.request.customerPhone,
      pickupAddress: call.request.pickupAddress,
      deliveryAddress: call.request.deliveryAddress,
    };

    const errors = validateCreateOrderInput(input);

    if (errors.length > 0) {
      return callback(null, {
        success: false,
        message: errors.join(", "),
        order: null,
      });
    }

    const order = orderRepository.createOrder(input);

    return callback(null, {
      success: true,
      message: "Order created successfully",
      order: toProtoOrder(order),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function getOrder(call, callback) {
  try {
    const { id } = call.request;

    const order = orderRepository.getOrderById(id);

    if (!order) {
      return callback(null, {
        success: false,
        message: "Order not found",
        order: null,
      });
    }

    return callback(null, {
      success: true,
      message: "Order found",
      order: toProtoOrder(order),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function listOrders(call, callback) {
  try {
    const orders = orderRepository.listOrders();

    return callback(null, {
      orders: orders.map(toProtoOrder),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function updateOrderStatus(call, callback) {
  try {
    const { id, status } = call.request;

    const allowedStatuses = Object.values(orderRepository.ORDER_STATUS);

    if (!allowedStatuses.includes(status)) {
      return callback(null, {
        success: false,
        message: "Invalid order status",
        order: null,
      });
    }

    const order = orderRepository.updateOrderStatus(id, status);

    if (!order) {
      return callback(null, {
        success: false,
        message: "Order not found",
        order: null,
      });
    }

    return callback(null, {
      success: true,
      message: "Order status updated successfully",
      order: toProtoOrder(order),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function deleteOrder(call, callback) {
  try {
    const { id } = call.request;

    const deleted = orderRepository.deleteOrder(id);

    return callback(null, {
      success: deleted,
      message: deleted ? "Order deleted successfully" : "Order not found",
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function getOrderServiceDefinition() {
  return {
    CreateOrder: createOrder,
    GetOrder: getOrder,
    ListOrders: listOrders,
    UpdateOrderStatus: updateOrderStatus,
    DeleteOrder: deleteOrder,
  };
}

module.exports = {
  orderProto,
  getOrderServiceDefinition,
};