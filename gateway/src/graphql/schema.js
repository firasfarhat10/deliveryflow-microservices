const { gql } = require("graphql-tag");

const typeDefs = gql`
  enum OrderStatus {
    CREATED
    ACCEPTED
    IN_DELIVERY
    DELIVERED
    CANCELLED
  }

  enum DeliveryStatus {
    PENDING
    ASSIGNED
    PICKED_UP
    IN_TRANSIT
    DELIVERED
    FAILED
  }

  enum CourierStatus {
    AVAILABLE
    BUSY
    OFFLINE
  }

  enum VehicleType {
    BIKE
    MOTORBIKE
    CAR
  }

  type Order {
    id: ID!
    customerName: String!
    customerPhone: String!
    pickupAddress: String!
    deliveryAddress: String!
    status: OrderStatus!
    createdAt: String!
    updatedAt: String!
  }

  type Delivery {
    id: ID!
    orderId: ID!
    courierId: ID
    status: DeliveryStatus!
    assignedAt: String
    pickedUpAt: String
    deliveredAt: String
    createdAt: String!
    updatedAt: String!
    courier: Courier
  }

  type Courier {
    id: ID!
    name: String!
    phone: String!
    vehicleType: VehicleType!
    status: CourierStatus!
    createdAt: String!
    updatedAt: String!
  }

  type OrderDetails {
    id: ID!
    customerName: String!
    customerPhone: String!
    pickupAddress: String!
    deliveryAddress: String!
    status: OrderStatus!
    createdAt: String!
    updatedAt: String!
    delivery: Delivery
  }

  input CreateOrderInput {
    customerName: String!
    customerPhone: String!
    pickupAddress: String!
    deliveryAddress: String!
  }

  input CreateCourierInput {
    name: String!
    phone: String!
    vehicleType: VehicleType!
  }

  type Query {
    orders: [Order!]!
    order(id: ID!): Order
    orderDetails(id: ID!): OrderDetails

    deliveries: [Delivery!]!
    delivery(id: ID!): Delivery
    deliveryByOrderId(orderId: ID!): Delivery

    couriers: [Courier!]!
    courier(id: ID!): Courier
    availableCouriers: [Courier!]!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
    createCourier(input: CreateCourierInput!): Courier
    createDelivery(orderId: ID!): Delivery
    assignCourier(deliveryId: ID!, courierId: ID!): Delivery
    updateDeliveryStatus(deliveryId: ID!, status: DeliveryStatus!): Delivery
    updateCourierStatus(courierId: ID!, status: CourierStatus!): Courier
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order
  }
`;

module.exports = typeDefs;