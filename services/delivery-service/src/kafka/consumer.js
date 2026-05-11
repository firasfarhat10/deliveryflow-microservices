const { Kafka } = require("kafkajs");
require("dotenv").config();

const deliveryRepository = require("../repositories/delivery.repository");
const { publishDeliveryCreated } = require("./producer");

const kafka = new Kafka({
  clientId: "delivery-service-consumer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "delivery-service-group",
});

async function startConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: "order.created",
    fromBeginning: false,
  });

  console.log("Delivery Service Kafka consumer subscribed to order.created");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value.toString();
      const event = JSON.parse(value);

      console.log("Received event order.created:", event);

      if (event.eventType !== "ORDER_CREATED") {
        return;
      }

      const existingDelivery = deliveryRepository.getDeliveryByOrderId(
        event.orderId
      );

      if (existingDelivery) {
        console.log("Delivery already exists for order:", event.orderId);
        return;
      }

      const delivery = deliveryRepository.createDelivery({
        orderId: event.orderId,
      });

      console.log("Delivery automatically created from order.created:", delivery);

      try {
        await publishDeliveryCreated(delivery);
      } catch (error) {
        console.error("Failed to publish delivery.created:", error.message);
      }
    },
  });
}

module.exports = {
  startConsumer,
};