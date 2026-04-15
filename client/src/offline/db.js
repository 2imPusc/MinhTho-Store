import Dexie from "dexie";

// IndexedDB local storage cho offline mode.
// - pendingMutations: hàng đợi POST/PUT/DELETE khi mất mạng
// - cacheOrders / cacheProducts / cacheCustomers: snapshot đọc gần nhất để xem offline
export const db = new Dexie("minhtho-offline");

db.version(1).stores({
  pendingMutations: "++id, clientId, status, createdAt",
  cacheOrders: "_id, customer, createdAt, updatedAt",
  cacheProducts: "_id, code, name, updatedAt",
  cacheCustomers: "_id, phone, name, updatedAt",
});

// Status values: 'pending' | 'syncing' | 'failed'
export const MUTATION_STATUS = {
  PENDING: "pending",
  SYNCING: "syncing",
  FAILED: "failed",
};
