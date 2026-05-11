const crypto = require("crypto");
const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
  clientId: "order-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();

let isConnected = false;

async function connectProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log("Order Service Kafka producer connected");
  }
}

async function publishOrderCreated(order) {
  await connectProducer();

  const event = {
    eventId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    eventType: "ORDER_CREATED",
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    createdAt: new Date().toISOString(),
  };

  await producer.send({
    topic: "order.created",
    messages: [
      {
        key: order.id,
        value: JSON.stringify(event),
      },
    ],
  });

  console.log("Published event order.created:", event);
}

module.exports = {
  publishOrderCreated,
};