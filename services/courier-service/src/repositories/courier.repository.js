const { randomUUID } = require("crypto");
const db = require("../db/database");

const COURIER_STATUS = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  OFFLINE: "OFFLINE",
};

const VEHICLE_TYPE = {
  BIKE: "BIKE",
  MOTORBIKE: "MOTORBIKE",
  CAR: "CAR",
};

function mapRowToCourier(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    vehicleType: row.vehicle_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createCourier(data) {
  const now = new Date().toISOString();

  const courier = {
    id: randomUUID(),
    name: data.name,
    phone: data.phone,
    vehicle_type: data.vehicleType,
    status: COURIER_STATUS.AVAILABLE,
    created_at: now,
    updated_at: now,
  };

  const statement = db.prepare(`
    INSERT INTO couriers (
      id,
      name,
      phone,
      vehicle_type,
      status,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @name,
      @phone,
      @vehicle_type,
      @status,
      @created_at,
      @updated_at
    )
  `);

  statement.run(courier);

  return mapRowToCourier(courier);
}

function getCourierById(id) {
  const row = db.prepare("SELECT * FROM couriers WHERE id = ?").get(id);
  return mapRowToCourier(row);
}

function listCouriers() {
  const rows = db.prepare("SELECT * FROM couriers ORDER BY created_at DESC").all();
  return rows.map(mapRowToCourier);
}

function listAvailableCouriers() {
  const rows = db
    .prepare("SELECT * FROM couriers WHERE status = ? ORDER BY created_at DESC")
    .all(COURIER_STATUS.AVAILABLE);

  return rows.map(mapRowToCourier);
}

function updateCourierStatus(id, status) {
  const existingCourier = getCourierById(id);

  if (!existingCourier) {
    return null;
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE couriers
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, now, id);

  return getCourierById(id);
}

module.exports = {
  COURIER_STATUS,
  VEHICLE_TYPE,
  createCourier,
  getCourierById,
  listCouriers,
  listAvailableCouriers,
  updateCourierStatus,
};