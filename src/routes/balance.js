import express from 'express';
import { activeSessions, userBalances } from '../store.js';
import { dbEnabled, getSession, getBalanceByWallet, setBalanceByWallet } from '../db.js';

const router = express.Router();
// Mock balances (in production, use blockchain + database).
// Centralized in store.js so /consume and /balance share the same state.

/**
 * GET /api/v1/balance - Get user token balance
 */
router.get('/', (req, res) => {
  try {
    const { walletAddress, sessionKey } = req.query;

    if (!walletAddress && !sessionKey) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address or session key required'
      });
    }

    // Demo convenience: allow balance lookup by sessionKey when no wallet is connected.
    const session = sessionKey
      ? (dbEnabled ? await getSession(sessionKey) : activeSessions.get(sessionKey))
      : null;
    const resolvedWallet = walletAddress || session?.walletAddress || null;

    let balance = null;
    if (dbEnabled && resolvedWallet) {
      balance = await getBalanceByWallet(resolvedWallet);
    } else if (resolvedWallet) {
      balance = userBalances.get(resolvedWallet);
    }
    if (!balance) {
      // Backfill from any active session using this wallet.
      const sessionByWallet = dbEnabled
        ? null
        : (resolvedWallet
            ? Array.from(activeSessions.values()).find(s => s.walletAddress === resolvedWallet)
            : null);
      const sourceSession = session || sessionByWallet;
      balance = sourceSession
        ? {
            walletAddress: resolvedWallet || 'session-only',
            sub: sourceSession.balance,
            sol: 0.0,
            updatedAt: Date.now()
          }
        : {
            walletAddress: resolvedWallet || 'session-only',
            sub: 10.0, // Starting SUB tokens
            sol: 0.0,
            updatedAt: Date.now()
          };
      if (resolvedWallet) {
        if (dbEnabled) {
          await setBalanceByWallet(resolvedWallet, balance.sub, balance.sol);
        } else {
          userBalances.set(resolvedWallet, balance);
        }
      }
    }

    res.json({
      success: true,
      data: {
        walletAddress: resolvedWallet || balance.walletAddress,
        sub: balance.sub.toFixed(4),
        sol: balance.sol.toFixed(4),
        tokens: {
          SUB: balance.sub.toFixed(4),
          SOL: balance.sol.toFixed(4)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch balance' });
  }
});

/**
 * POST /api/v1/balance/topup - Add tokens to balance
 */
router.post('/topup', async (req, res) => {
  try {
    const { walletAddress, amount, currency = 'SUB', signature } = req.body;

    if (!walletAddress || !amount || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address, amount, and signature required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive'
      });
    }

    // In production: Verify Solana transaction
    // const isValid = await verifySolanaTransaction(signature, walletAddress, amount);
    // if (!isValid) { return res.status(400).json({ success: false, error: 'Invalid transaction' }); }

    // Update balance
    const balance = userBalances.get(walletAddress) || {
      walletAddress,
      sub: 10.0,
      sol: 0.0,
      updatedAt: Date.now()
    };

    if (currency === 'SUB') {
      balance.sub += amount;
    } else if (currency === 'SOL') {
      balance.sol += amount;
    }

    balance.updatedAt = Date.now();
    userBalances.set(walletAddress, balance);

    res.json({
      success: true,
      data: {
        message: `Successfully added ${amount.toFixed(4)} ${currency} to balance`,
        newBalance: {
          SUB: balance.sub.toFixed(4),
          SOL: balance.sol.toFixed(4)
        },
        transactionId: `topup_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error processing topup:', error);
    res.status(500).json({ success: false, error: 'Failed to process topup' });
  }
});

export default router;
