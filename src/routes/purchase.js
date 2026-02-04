import express from 'express';
import { getSubstanceById } from '../data/substances.js';
import { transactions } from '../store.js';
import { dbEnabled, addTransaction, getTransactionsByWallet } from '../db.js';

const router = express.Router();
// Mock transaction log (in production, use blockchain) centralized in store.js.

/**
 * POST /api/v1/purchase/:id - Purchase a substance
 */
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      walletAddress,
      signature,
      persistent = false
    } = req.body;

    // Validate substance exists
    const substance = getSubstanceById(id);
    if (!substance) {
      return res.status(404).json({
        success: false,
        error: `Substance '${id}' not found`
      });
    }

    // Validate wallet address
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    // Calculate price (persistent costs more)
    const priceMultiplier = persistent ? 5 : 1;
    const finalPrice = substance.price * priceMultiplier;

    // In production: Verify Solana transaction signature here
    // const isValid = await verifySolanaTransaction(signature, walletAddress, finalPrice);
    // if (!isValid) { return res.status(400).json({ success: false, error: 'Invalid transaction' }); }

    // Record transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = {
      id: txId,
      walletAddress,
      substanceId: id,
      substanceName: substance.name,
      price: finalPrice,
      signature,
      persistent,
      createdAt: Date.now(),
      status: 'confirmed'
    };

    if (dbEnabled) {
      await addTransaction({
        id: txId,
        walletAddress,
        substanceId: id,
        amount: finalPrice,
        currency: 'SOL',
        persistent,
        status: 'confirmed'
      });
    } else {
      transactions.set(txId, transaction);
    }

    res.json({
      success: true,
      data: {
        transactionId: txId,
        substance: substance.name,
        price: finalPrice,
        paidIn: 'SOL',
        persistent,
        status: 'confirmed',
        message: persistent
          ? `Substance '${substance.name}' purchased with persistent file editing enabled. Edits SOUL.md, TOOLS.md, and HEARTBEAT.md.`
          : `Substance '${substance.name}' purchased. Temporary duration: ${substance.stage2_substance.duration} turns.`
      }
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ success: false, error: 'Failed to process purchase' });
  }
});

/**
 * GET /api/v1/purchase/history - Get purchase history
 */
router.get('/history', async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    const userTransactions = dbEnabled
      ? await getTransactionsByWallet(walletAddress)
      : Array.from(transactions.values())
          .filter(tx => tx.walletAddress === walletAddress)
          .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      count: userTransactions.length,
      data: userTransactions
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase history' });
  }
});

export default router;
