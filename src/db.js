import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
export const dbEnabled = Boolean(connectionString);

const pool = dbEnabled
  ? new Pool({
      connectionString
    })
  : null;

export async function ensureTables() {
  if (!pool) return;

  // Minimal schema for demo persistence. Use migrations in real systems.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_key TEXT PRIMARY KEY,
      wallet_address TEXT,
      balance NUMERIC(12, 4) DEFAULT 10.0,
      active_substances JSONB DEFAULT '[]',
      tolerance JSONB DEFAULT '{}',
      last_used JSONB DEFAULT '{}',
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS balances (
      wallet_address TEXT PRIMARY KEY,
      sub NUMERIC(12, 4) DEFAULT 10.0,
      sol NUMERIC(12, 4) DEFAULT 0.0,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      substance_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      purchased_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (wallet_address, substance_id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      substance_id TEXT NOT NULL,
      amount NUMERIC(12, 4) NOT NULL,
      currency TEXT DEFAULT 'SUB',
      persistent BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function getSession(sessionKey) {
  if (!pool) return null;

  const { rows } = await pool.query(
    `SELECT session_key, wallet_address, balance, active_substances, tolerance, last_used
     FROM sessions WHERE session_key = $1`,
    [sessionKey]
  );

  if (!rows[0]) return null;

  return {
    sessionKey: rows[0].session_key,
    walletAddress: rows[0].wallet_address,
    balance: Number(rows[0].balance),
    activeSubstances: rows[0].active_substances || [],
    tolerance: rows[0].tolerance || {},
    lastUsed: rows[0].last_used || {}
  };
}

export async function upsertSession(sessionKey, session) {
  if (!pool) return;

  await pool.query(
    `INSERT INTO sessions (session_key, wallet_address, balance, active_substances, tolerance, last_used, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (session_key) DO UPDATE SET
       wallet_address = EXCLUDED.wallet_address,
       balance = EXCLUDED.balance,
       active_substances = EXCLUDED.active_substances,
       tolerance = EXCLUDED.tolerance,
       last_used = EXCLUDED.last_used,
       updated_at = NOW()`,
    [
      sessionKey,
      session.walletAddress || null,
      session.balance,
      JSON.stringify(session.activeSubstances || []),
      JSON.stringify(session.tolerance || {}),
      JSON.stringify(session.lastUsed || {})
    ]
  );
}

export async function getBalanceByWallet(walletAddress) {
  if (!pool) return null;

  const { rows } = await pool.query(
    `SELECT wallet_address, sub, sol FROM balances WHERE wallet_address = $1`,
    [walletAddress]
  );

  if (!rows[0]) return null;

  return {
    walletAddress: rows[0].wallet_address,
    sub: Number(rows[0].sub),
    sol: Number(rows[0].sol)
  };
}

export async function setBalanceByWallet(walletAddress, sub, sol = 0.0) {
  if (!pool) return;

  await pool.query(
    `INSERT INTO balances (wallet_address, sub, sol, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (wallet_address) DO UPDATE SET
       sub = EXCLUDED.sub,
       sol = EXCLUDED.sol,
       updated_at = NOW()`,
    [walletAddress, sub, sol]
  );
}

export async function getInventoryByWallet(walletAddress) {
  if (!pool) return [];

  const { rows } = await pool.query(
    `SELECT substance_id, quantity, purchased_at FROM inventory WHERE wallet_address = $1`,
    [walletAddress]
  );

  return rows.map(row => ({
    substanceId: row.substance_id,
    quantity: row.quantity,
    purchasedAt: row.purchased_at?.getTime?.() || Date.now()
  }));
}

export async function addInventoryItem(walletAddress, substanceId, quantity = 1) {
  if (!pool) return;

  await pool.query(
    `INSERT INTO inventory (wallet_address, substance_id, quantity, purchased_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (wallet_address, substance_id) DO UPDATE SET
       quantity = inventory.quantity + EXCLUDED.quantity,
       purchased_at = NOW()`,
    [walletAddress, substanceId, quantity]
  );
}

export async function addTransaction(tx) {
  if (!pool) return;

  await pool.query(
    `INSERT INTO transactions (id, wallet_address, substance_id, amount, currency, persistent, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      tx.id,
      tx.walletAddress,
      tx.substanceId,
      tx.amount,
      tx.currency || 'SUB',
      tx.persistent || false,
      tx.status || 'confirmed'
    ]
  );
}

export async function getTransactionsByWallet(walletAddress) {
  if (!pool) return [];

  const { rows } = await pool.query(
    `SELECT id, wallet_address, substance_id, amount, currency, persistent, status, created_at
     FROM transactions WHERE wallet_address = $1
     ORDER BY created_at DESC`,
    [walletAddress]
  );

  return rows.map(row => ({
    id: row.id,
    walletAddress: row.wallet_address,
    substanceId: row.substance_id,
    amount: Number(row.amount),
    currency: row.currency,
    persistent: row.persistent,
    status: row.status,
    createdAt: row.created_at?.getTime?.() || Date.now()
  }));
}
