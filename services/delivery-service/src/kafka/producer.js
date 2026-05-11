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

async function sendEvent(topic, key, event) {
  await connectProducer();

  await producer.send({
    topic,
    messages: [
      {
        key,
        value: JSON.stringify(event),
      },
    ],
  });

  console.log(`Published event ${topic}:`, event);
}

async function publishDeliveryCreated(delivery) {
  const event = {
    eventId: crypto.randomUUID(),
    eventType: "DELIVERY_CREATED",
    deliveryId: delivery.id,
    orderId: delivery.orderId,
    status: delivery.status,
    createdAt: new Date().toISOString(),
  };

  await sendEvent("delivery.created", delivery.id, event);
}

async function publishDeliveryAssigned(delivery) {
  const event = {
    eventId: crypto.randomUUID(),
    eventType: "DELIVERY_ASSIGNED",
    deliveryId: delivery.id,
    orderId: delivery.orderId,
    courierId: delivery.courierId,
    assignedAt: new Date().toISOString(),
  };

  await sendEvent("delivery.assigned", delivery.id, event);
}

async function publishDeliveryStatusUpdated(delivery) {
  const event = {
    eventId: crypto.randomUUID(),
    eventType: "DELIVERY_STATUS_UPDATED",
    deliveryId: delivery.id,
    orderId: delivery.orderId,
    courierId: delivery.courierId,
    status: delivery.status,
    updatedAt: new Date().toISOString(),
  };

  await sendEvent("delivery.status.updated", delivery.id, event);
}

module.exports = {
  publishDeliveryCreated,
  publishDeliveryAssigned,
  publishDeliveryStatusUpdated,
};