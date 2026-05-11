const { Kafka } = require("kafkajs");
require("dotenv").config();

const orderRepository = require("../repositories/order.repository");

const kafka = new Kafka({
  clientId: "order-service-consumer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "order-service-group",
});

async function startConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: "delivery.status.updated",
    fromBeginning: false,
  });

  console.log(
    "Order Service Kafka consumer subscribed to delivery.status.updated"
  );

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value.toString();
      const event = JSON.parse(value);

      console.log("Received event delivery.status.updated:", event);

      if (event.eventType !== "DELIVERY_STATUS_UPDATED") {
        return;
      }

      if (event.status !== "DELIVERED") {
        return;
      }

      const order = orderRepository.updateOrderStatus(
        event.orderId,
        orderRepository.ORDER_STATUS.DELIVERED
      );

      if (!order) {
        console.log("Order not found for event:", event.orderId);
        return;
      }

      console.log("Order automatically marked as DELIVERED:", order);
    },
  });
}

module.exports = {
  startConsumer,
};