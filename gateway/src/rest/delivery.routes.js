const express = require("express");
const { deliveryClient } = require("../config/grpcClients");
const { grpcCall, sendError } = require("../utils/errorHandler");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const response = await grpcCall(deliveryClient, "CreateDelivery", req.body);

    return res.status(response.success ? 201 : 400).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const response = await grpcCall(deliveryClient, "ListDeliveries", {});

    return res.json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/order/:orderId", async (req, res) => {
  try {
    const response = await grpcCall(deliveryClient, "GetDeliveryByOrderId", {
      orderId: req.params.orderId,
    });

    return res.status(response.success ? 200 : 404).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const response = await grpcCall(deliveryClient, "GetDelivery", {
      id: req.params.id,
    });

    return res.status(response.success ? 200 : 404).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.patch("/:id/assign", async (req, res) => {
  try {
    const response = await grpcCall(deliveryClient, "AssignCourier", {
      deliveryId: req.params.id,
      courierId: req.body.courierId,
    });

    return res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const response = await grpcCall(deliveryClient, "UpdateDeliveryStatus", {
      deliveryId: req.params.id,
      status: req.body.status,
    });

    return res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;