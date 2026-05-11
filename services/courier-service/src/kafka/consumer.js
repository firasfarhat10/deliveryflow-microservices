const { Kafka } = require("kafkajs");
require("dotenv").config();

const courierRepository = require("../repositories/courier.repository");

const kafka = new Kafka({
  clientId: "courier-service-consumer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "courier-service-group",
});

async function startConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: "delivery.assigned",
    fromBeginning: false,
  });

  console.log("Courier Service Kafka consumer subscribed to delivery.assigned");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value.toString();
      const event = JSON.parse(value);

      console.log("Received event delivery.assigned:", event);

      if (event.eventType !== "DELIVERY_ASSIGNED") {
        return;
      }

      const courier = courierRepository.updateCourierStatus(
        event.courierId,
        courierRepository.COURIER_STATUS.BUSY
      );

      if (!courier) {
        console.log("Courier not found for event:", event.courierId);
        return;
      }

      console.log("Courier automatically marked as BUSY:", courier);
    },
  });
}

module.exports = {
  startConsumer,
};