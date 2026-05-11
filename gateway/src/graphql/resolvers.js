const {
  orderClient,
  deliveryClient,
  courierClient,
} = require("../config/grpcClients");

const { grpcCall } = require("../utils/errorHandler");

function unwrapResponse(response, key) {
  if (!response || response.success === false) {
    return null;
  }

  return response[key] || null;
}

const resolvers = {
  Query: {
    orders: async () => {
      const response = await grpcCall(orderClient, "ListOrders", {});
      return response.orders || [];
    },

    order: async (_, { id }) => {
      const response = await grpcCall(orderClient, "GetOrder", { id });
      return unwrapResponse(response, "order");
    },

    orderDetails: async (_, { id }) => {
      const orderResponse = await grpcCall(orderClient, "GetOrder", { id });
      const order = unwrapResponse(orderResponse, "order");

      if (!order) {
        return null;
      }

      return order;
    },

    deliveries: async () => {
      const response = await grpcCall(deliveryClient, "ListDeliveries", {});
      return response.deliveries || [];
    },

    delivery: async (_, { id }) => {
      const response = await grpcCall(deliveryClient, "GetDelivery", { id });
      return unwrapResponse(response, "delivery");
    },

    deliveryByOrderId: async (_, { orderId }) => {
      const response = await grpcCall(deliveryClient, "GetDeliveryByOrderId", {
        orderId,
      });

      return unwrapResponse(response, "delivery");
    },

    couriers: async () => {
      const response = await grpcCall(courierClient, "ListCouriers", {});
      return response.couriers || [];
    },

    courier: async (_, { id }) => {
      const response = await grpcCall(courierClient, "GetCourier", { id });
      return unwrapResponse(response, "courier");
    },

    availableCouriers: async () => {
      const response = await grpcCall(courierClient, "ListAvailableCouriers", {});
      return response.couriers || [];
    },
  },

  OrderDetails: {
    delivery: async (parent) => {
      const response = await grpcCall(deliveryClient, "GetDeliveryByOrderId", {
        orderId: parent.id,
      });

      return unwrapResponse(response, "delivery");
    },
  },

  Delivery: {
    courier: async (parent) => {
      if (!parent.courierId) {
        return null;
      }

      const response = await grpcCall(courierClient, "GetCourier", {
        id: parent.courierId,
      });

      return unwrapResponse(response, "courier");
    },
  },

  Mutation: {
    createOrder: async (_, { input }) => {
      const response = await grpcCall(orderClient, "CreateOrder", input);
      return unwrapResponse(response, "order");
    },

    createCourier: async (_, { input }) => {
      const response = await grpcCall(courierClient, "CreateCourier", input);
      return unwrapResponse(response, "courier");
    },

    createDelivery: async (_, { orderId }) => {
      const response = await grpcCall(deliveryClient, "CreateDelivery", {
        orderId,
      });

      return unwrapResponse(response, "delivery");
    },

    assignCourier: async (_, { deliveryId, courierId }) => {
      const response = await grpcCall(deliveryClient, "AssignCourier", {
        deliveryId,
        courierId,
      });

      return unwrapResponse(response, "delivery");
    },

    updateDeliveryStatus: async (_, { deliveryId, status }) => {
      const response = await grpcCall(deliveryClient, "UpdateDeliveryStatus", {
        deliveryId,
        status,
      });

      return unwrapResponse(response, "delivery");
    },

    updateCourierStatus: async (_, { courierId, status }) => {
      const response = await grpcCall(courierClient, "UpdateCourierStatus", {
        id: courierId,
        status,
      });

      return unwrapResponse(response, "courier");
    },

    updateOrderStatus: async (_, { orderId, status }) => {
      const response = await grpcCall(orderClient, "UpdateOrderStatus", {
        id: orderId,
        status,
      });

      return unwrapResponse(response, "order");
    },
  },
};

module.exports = resolvers;