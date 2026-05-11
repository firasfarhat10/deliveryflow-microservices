const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");

const orderRoutes = require("./rest/order.routes");
const deliveryRoutes = require("./rest/delivery.routes");
const courierRoutes = require("./rest/courier.routes");

const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

async function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      name: "DeliveryFlow API Gateway",
      status: "running",
      protocols: ["REST", "GraphQL", "gRPC"],
      graphql: "/graphql",
    });
  });

  app.use("/api/orders", orderRoutes);
  app.use("/api/deliveries", deliveryRoutes);
  app.use("/api/couriers", courierRoutes);

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use("/graphql", expressMiddleware(apolloServer));

  return app;
}

module.exports = createApp;