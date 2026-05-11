require("dotenv").config();

const app = require("./app");

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});