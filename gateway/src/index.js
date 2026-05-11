require("dotenv").config();

const createApp = require("./app");

const PORT = process.env.GATEWAY_PORT || 3000;

async function startGateway() {
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
  });
}

startGateway().catch((error) => {
  console.error("Failed to start API Gateway:", error);
  process.exit(1);
});