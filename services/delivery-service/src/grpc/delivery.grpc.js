const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const {
  publishDeliveryAssigned,
  publishDeliveryStatusUpdated,
} = require("../kafka/producer");

const deliveryRepository = require("../repositories/delivery.repository");
const {
  validateCreateDeliveryInput,
  validateAssignCourierInput,
} = require("../utils/errors");

const PROTO_PATH = path.join(__dirname, "../../../../proto/delivery.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const deliveryProto = grpc.loadPackageDefinition(packageDefinition).delivery;

function toProtoDelivery(delivery) {
  if (!delivery) return null;

  return {
    id: delivery.id,
    orderId: delivery.orderId,
    courierId: delivery.courierId,
    status: delivery.status,
    assignedAt: delivery.assignedAt,
    pickedUpAt: delivery.pickedUpAt,
    deliveredAt: delivery.deliveredAt,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

function createDelivery(call, callback) {
  try {
    const input = {
      orderId: call.request.orderId,
    };

    const errors = validateCreateDeliveryInput(input);

    if (errors.length > 0) {
      return callback(null, {
        success: false,
        message: errors.join(", "),
        delivery: null,
      });
    }

    const existingDelivery = deliveryRepository.getDeliveryByOrderId(
      input.orderId
    );

    if (existingDelivery) {
      return callback(null, {
        success: false,
        message: "A delivery already exists for this order",
        delivery: toProtoDelivery(existingDelivery),
      });
    }

    const delivery = deliveryRepository.createDelivery(input);

    return callback(null, {
      success: true,
      message: "Delivery created successfully",
      delivery: toProtoDelivery(delivery),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function getDelivery(call, callback) {
  try {
    const { id } = call.request;

    const delivery = deliveryRepository.getDeliveryById(id);

    if (!delivery) {
      return callback(null, {
        success: false,
        message: "Delivery not found",
        delivery: null,
      });
    }

    return callback(null, {
      success: true,
      message: "Delivery found",
      delivery: toProtoDelivery(delivery),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function getDeliveryByOrderId(call, callback) {
  try {
    const { orderId } = call.request;

    const delivery = deliveryRepository.getDeliveryByOrderId(orderId);

    if (!delivery) {
      return callback(null, {
        success: false,
        message: "Delivery not found for this order",
        delivery: null,
      });
    }

    return callback(null, {
      success: true,
      message: "Delivery found",
      delivery: toProtoDelivery(delivery),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function listDeliveries(call, callback) {
  try {
    const deliveries = deliveryRepository.listDeliveries();

    return callback(null, {
      deliveries: deliveries.map(toProtoDelivery),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

async function assignCourier(call, callback) {
  try {
    const input = {
      deliveryId: call.request.deliveryId,
      courierId: call.request.courierId,
    };

    const errors = validateAssignCourierInput(input);

    if (errors.length > 0) {
      return callback(null, {
        success: false,
        message: errors.join(", "),
        delivery: null,
      });
    }

    const delivery = deliveryRepository.assignCourier(
      input.deliveryId,
      input.courierId
    );

    if (!delivery) {
      return callback(null, {
        success: false,
        message: "Delivery not found",
        delivery: null,
      });
    }

    try {
      await publishDeliveryAssigned(delivery);
    } catch (kafkaError) {
      console.error(
        "Failed to publish delivery.assigned event:",
        kafkaError.message
      );
    }

    return callback(null, {
      success: true,
      message: "Courier assigned successfully",
      delivery: toProtoDelivery(delivery),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

async function updateDeliveryStatus(call, callback) {
  try {
    const { deliveryId, status } = call.request;

    const allowedStatuses = Object.values(deliveryRepository.DELIVERY_STATUS);

    if (!allowedStatuses.includes(status)) {
      return callback(null, {
        success: false,
        message: "Invalid delivery status",
        delivery: null,
      });
    }

    const delivery = deliveryRepository.updateDeliveryStatus(deliveryId, status);

    if (!delivery) {
      return callback(null, {
        success: false,
        message: "Delivery not found",
        delivery: null,
      });
    }

    try {
      await publishDeliveryStatusUpdated(delivery);
    } catch (kafkaError) {
      console.error(
        "Failed to publish delivery.status.updated event:",
        kafkaError.message
      );
    }

    return callback(null, {
      success: true,
      message: "Delivery status updated successfully",
      delivery: toProtoDelivery(delivery),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function getDeliveryServiceDefinition() {
  return {
    CreateDelivery: createDelivery,
    GetDelivery: getDelivery,
    GetDeliveryByOrderId: getDeliveryByOrderId,
    ListDeliveries: listDeliveries,
    AssignCourier: assignCourier,
    UpdateDeliveryStatus: updateDeliveryStatus,
  };
}

module.exports = {
  deliveryProto,
  getDeliveryServiceDefinition,
};