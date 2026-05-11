const express = require("express");
const cors = require("cors");

const orderRoutes = require("./rest/order.routes");
const deliveryRoutes = require("./rest/delivery.routes");
const courierRoutes = require("./rest/courier.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "DeliveryFlow API Gateway",
    status: "running",
    protocols: ["REST", "GraphQL", "gRPC"],
  });
});

app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/couriers", courierRoutes);

module.exports = app;