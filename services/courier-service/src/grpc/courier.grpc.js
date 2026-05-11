const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const courierRepository = require("../repositories/courier.repository");
const { validateCreateCourierInput } = require("../utils/errors");

const PROTO_PATH = path.join(__dirname, "../../../../proto/courier.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const courierProto = grpc.loadPackageDefinition(packageDefinition).courier;

function toProtoCourier(courier) {
  if (!courier) return null;

  return {
    id: courier.id,
    name: courier.name,
    phone: courier.phone,
    vehicleType: courier.vehicleType,
    status: courier.status,
    createdAt: courier.createdAt,
    updatedAt: courier.updatedAt,
  };
}

function createCourier(call, callback) {
  try {
    const input = {
      name: call.request.name,
      phone: call.request.phone,
      vehicleType: call.request.vehicleType,
    };

    const errors = validateCreateCourierInput(input);

    if (errors.length > 0) {
      return callback(null, {
        success: false,
        message: errors.join(", "),
        courier: null,
      });
    }

    const allowedVehicles = Object.values(courierRepository.VEHICLE_TYPE);

    if (!allowedVehicles.includes(input.vehicleType)) {
      return callback(null, {
        success: false,
        message: "Invalid vehicle type",
        courier: null,
      });
    }

    const courier = courierRepository.createCourier(input);

    return callback(null, {
      success: true,
      message: "Courier created successfully",
      courier: toProtoCourier(courier),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function getCourier(call, callback) {
  try {
    const { id } = call.request;

    const courier = courierRepository.getCourierById(id);

    if (!courier) {
      return callback(null, {
        success: false,
        message: "Courier not found",
        courier: null,
      });
    }

    return callback(null, {
      success: true,
      message: "Courier found",
      courier: toProtoCourier(courier),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function listCouriers(call, callback) {
  try {
    const couriers = courierRepository.listCouriers();

    return callback(null, {
      couriers: couriers.map(toProtoCourier),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function listAvailableCouriers(call, callback) {
  try {
    const couriers = courierRepository.listAvailableCouriers();

    return callback(null, {
      couriers: couriers.map(toProtoCourier),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function updateCourierStatus(call, callback) {
  try {
    const { id, status } = call.request;

    const allowedStatuses = Object.values(courierRepository.COURIER_STATUS);

    if (!allowedStatuses.includes(status)) {
      return callback(null, {
        success: false,
        message: "Invalid courier status",
        courier: null,
      });
    }

    const courier = courierRepository.updateCourierStatus(id, status);

    if (!courier) {
      return callback(null, {
        success: false,
        message: "Courier not found",
        courier: null,
      });
    }

    return callback(null, {
      success: true,
      message: "Courier status updated successfully",
      courier: toProtoCourier(courier),
    });
  } catch (error) {
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
}

function getCourierServiceDefinition() {
  return {
    CreateCourier: createCourier,
    GetCourier: getCourier,
    ListCouriers: listCouriers,
    ListAvailableCouriers: listAvailableCouriers,
    UpdateCourierStatus: updateCourierStatus,
  };
}

module.exports = {
  courierProto,
  getCourierServiceDefinition,
};