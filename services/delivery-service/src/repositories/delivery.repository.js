const { randomUUID } = require("crypto");
const db = require("../db/database");

const DELIVERY_STATUS = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
};

function mapRowToDelivery(row) {
  if (!row) return null;

  return {
    id: row.id,
    orderId: row.order_id,
    courierId: row.courier_id || "",
    status: row.status,
    assignedAt: row.assigned_at || "",
    pickedUpAt: row.picked_up_at || "",
    deliveredAt: row.delivered_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createDelivery(data) {
  const now = new Date().toISOString();

  const delivery = {
    id: randomUUID(),
    order_id: data.orderId,
    courier_id: null,
    status: DELIVERY_STATUS.PENDING,
    assigned_at: null,
    picked_up_at: null,
    delivered_at: null,
    created_at: now,
    updated_at: now,
  };

  const statement = db.prepare(`
    INSERT INTO deliveries (
      id,
      order_id,
      courier_id,
      status,
      assigned_at,
      picked_up_at,
      delivered_at,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @order_id,
      @courier_id,
      @status,
      @assigned_at,
      @picked_up_at,
      @delivered_at,
      @created_at,
      @updated_at
    )
  `);

  statement.run(delivery);

  return mapRowToDelivery(delivery);
}

function getDeliveryById(id) {
  const row = db.prepare("SELECT * FROM deliveries WHERE id = ?").get(id);
  return mapRowToDelivery(row);
}

function getDeliveryByOrderId(orderId) {
  const row = db
    .prepare("SELECT * FROM deliveries WHERE order_id = ?")
    .get(orderId);

  return mapRowToDelivery(row);
}

function listDeliveries() {
  const rows = db
    .prepare("SELECT * FROM deliveries ORDER BY created_at DESC")
    .all();

  return rows.map(mapRowToDelivery);
}

function assignCourier(deliveryId, courierId) {
  const existingDelivery = getDeliveryById(deliveryId);

  if (!existingDelivery) {
    return null;
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE deliveries
    SET courier_id = ?,
        status = ?,
        assigned_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(courierId, DELIVERY_STATUS.ASSIGNED, now, now, deliveryId);

  return getDeliveryById(deliveryId);
}

function updateDeliveryStatus(deliveryId, status) {
  const existingDelivery = getDeliveryById(deliveryId);

  if (!existingDelivery) {
    return null;
  }

  const now = new Date().toISOString();

  let pickedUpAt = existingDelivery.pickedUpAt || null;
  let deliveredAt = existingDelivery.deliveredAt || null;

  if (status === DELIVERY_STATUS.PICKED_UP) {
    pickedUpAt = now;
  }

  if (status === DELIVERY_STATUS.DELIVERED) {
    deliveredAt = now;
  }

  db.prepare(`
    UPDATE deliveries
    SET status = ?,
        picked_up_at = ?,
        delivered_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(status, pickedUpAt, deliveredAt, now, deliveryId);

  return getDeliveryById(deliveryId);
}

module.exports = {
  DELIVERY_STATUS,
  createDelivery,
  getDeliveryById,
  getDeliveryByOrderId,
  listDeliveries,
  assignCourier,
  updateDeliveryStatus,
};