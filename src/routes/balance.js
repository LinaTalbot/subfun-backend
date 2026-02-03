import express from 'express';

const router = express.Router();

// Mock balances (in production, use blockchain + database)
const userBalances = new Map();

/**
 * GET /api/v1/balance - Get user token balance
 */
router.get('/', (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    const balance = userBalances.get(walletAddress) || {
      walletAddress,
      sub: 10.0,      // Starting SUB tokens
      sol: 0.0,        // SOL balance
      updatedAt: Date.now()
    };

    res.json({
      success: true,
      data: {
        walletAddress,
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
