const crypto = require("crypto");
const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
  clientId: "delivery-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();

let isConnected = false;

async function connectProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log("Delivery Service Kafka producer connected");
  }
}

async function publishDeliveryCreated(delivery) {
  await connectProducer();

  const event = {
    eventId: crypto.randomUUID(),
    eventType: "DELIVERY_CREATED",
    deliveryId: delivery.id,
    orderId: delivery.orderId,
    status: delivery.status,
    createdAt: new Date().toISOString(),
  };

  await producer.send({
    topic: "delivery.created",
    messages: [
      {
        key: delivery.id,
        value: JSON.stringify(event),
      },
    ],
  });

  console.log("Published event delivery.created:", event);
}

module.exports = {
  publishDeliveryCreated,
};