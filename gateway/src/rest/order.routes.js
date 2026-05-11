const express = require("express");
const { orderClient } = require("../config/grpcClients");
const { grpcCall, sendError } = require("../utils/errorHandler");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const response = await grpcCall(orderClient, "CreateOrder", req.body);

    return res.status(response.success ? 201 : 400).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const response = await grpcCall(orderClient, "ListOrders", {});

    return res.json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const response = await grpcCall(orderClient, "GetOrder", {
      id: req.params.id,
    });

    return res.status(response.success ? 200 : 404).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const response = await grpcCall(orderClient, "UpdateOrderStatus", {
      id: req.params.id,
      status: req.body.status,
    });

    return res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const response = await grpcCall(orderClient, "DeleteOrder", {
      id: req.params.id,
    });

    return res.status(response.success ? 200 : 404).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;