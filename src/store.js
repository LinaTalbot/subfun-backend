// Shared in-memory stores for demo routes.
// Keeps balances, sessions, and inventories consistent across endpoints.
// In production, replace these with Redis/Postgres/Solana-backed stores.
export const activeSessions = new Map();
export const userBalances = new Map();
export const userInventories = new Map();
export const transactions = new Map();
