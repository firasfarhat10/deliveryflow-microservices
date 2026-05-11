const { randomUUID } = require("crypto");
const db = require("../db/database");

const ORDER_STATUS = {
  CREATED: "CREATED",
  ACCEPTED: "ACCEPTED",
  IN_DELIVERY: "IN_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

function mapRowToOrder(row) {
  if (!row) return null;

  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    pickupAddress: row.pickup_address,
    deliveryAddress: row.delivery_address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createOrder(data) {
  const now = new Date().toISOString();

  const order = {
    id: randomUUID(),
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    pickup_address: data.pickupAddress,
    delivery_address: data.deliveryAddress,
    status: ORDER_STATUS.CREATED,
    created_at: now,
    updated_at: now,
  };

  const statement = db.prepare(`
    INSERT INTO orders (
      id,
      customer_name,
      customer_phone,
      pickup_address,
      delivery_address,
      status,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @customer_name,
      @customer_phone,
      @pickup_address,
      @delivery_address,
      @status,
      @created_at,
      @updated_at
    )
  `);

  statement.run(order);

  return mapRowToOrder({
    ...order,
  });
}

function getOrderById(id) {
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  return mapRowToOrder(row);
}

function listOrders() {
  const rows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  return rows.map(mapRowToOrder);
}

function updateOrderStatus(id, status) {
  const existingOrder = getOrderById(id);

  if (!existingOrder) {
    return null;
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE orders
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, now, id);

  return getOrderById(id);
}

function deleteOrder(id) {
  const result = db.prepare("DELETE FROM orders WHERE id = ?").run(id);
  return result.changes > 0;
}

module.exports = {
  ORDER_STATUS,
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  deleteOrder,
};