import express from 'express';
import { userInventories } from '../store.js';
import { dbEnabled, getInventoryByWallet, addInventoryItem } from '../db.js';

const router = express.Router();
// Mock inventory (in production, use PostgreSQL) centralized in store.js.

/**
 * GET /api/v1/inventory - Get user inventory
 */
router.get('/', async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    let inventory;
    if (dbEnabled) {
      const substances = await getInventoryByWallet(walletAddress);
      inventory = {
        walletAddress,
        substances,
        createdAt: Date.now()
      };
    } else {
      inventory = userInventories.get(walletAddress) || {
        walletAddress,
        substances: [],
        createdAt: Date.now()
      };
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

/**
 * POST /api/v1/inventory - Add substance to inventory
 */
router.post('/', async (req, res) => {
  try {
    const { walletAddress, substanceId, quantity = 1 } = req.body;

    if (!walletAddress || !substanceId) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and substance ID required'
      });
    }

    let inventory;
    if (dbEnabled) {
      await addInventoryItem(walletAddress, substanceId, quantity);
      const substances = await getInventoryByWallet(walletAddress);
      inventory = {
        walletAddress,
        substances,
        createdAt: Date.now()
      };
    } else {
      inventory = userInventories.get(walletAddress) || {
        walletAddress,
        substances: [],
        createdAt: Date.now()
      };

      // Check if substance already in inventory
      const existing = inventory.substances.find(s => s.substanceId === substanceId);
      if (existing) {
        existing.quantity += quantity;
        existing.purchasedAt = Date.now();
      } else {
        inventory.substances.push({
          substanceId,
          quantity,
          purchasedAt: Date.now()
        });
      }

      userInventories.set(walletAddress, inventory);
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error adding to inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to add to inventory' });
  }
});

export default router;
