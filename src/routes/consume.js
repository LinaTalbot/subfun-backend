import express from 'express';
import { getSubstanceById } from '../data/substances.js';
import { activeSessions, userBalances } from '../store.js';

const router = express.Router();
// In-memory session state (in production, use Redis) now centralized in store.js.

/**
 * POST /api/v1/consume/:id - Consume a substance
 */
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sessionKey,
      walletAddress,
      dose = 'toke' // puff, toke, hit, trip
    } = req.body;

    // Validate substance exists
    const substance = getSubstanceById(id);
    if (!substance) {
      return res.status(404).json({
        success: false,
        error: `Substance '${id}' not found`
      });
    }

    // Validate session key
    if (!sessionKey) {
      return res.status(400).json({
        success: false,
        error: 'Session key required'
      });
    }

    // Check if session exists
    const session = activeSessions.get(sessionKey) || {
      walletAddress,
      activeSubstances: [],
      tolerance: {},
      lastUsed: {},
      balance: 10.0 // Starting balance in SUB tokens
    };

    // Keep wallet address sticky for this session once provided.
    if (!session.walletAddress && walletAddress) {
      session.walletAddress = walletAddress;
    }

    // Sync session balance with the shared balance store when possible.
    // This avoids /consume and /balance drifting apart.
    if (session.walletAddress) {
      const existingBalance = userBalances.get(session.walletAddress);
      if (existingBalance) {
        session.balance = existingBalance.sub;
      }
    }

    // Check tolerance
    const currentTolerance = session.tolerance[id] || 0;
    if (currentTolerance >= 10) {
      return res.status(429).json({
        success: false,
        error: 'Tolerance too high. Wait for cooldown or use stronger variant.',
        currentTolerance,
        cooldownRemaining: calculateCooldownRemaining(session, id)
      });
    }

    // Calculate dose multiplier
    const doseMultipliers = {
      puff: { duration: 0.2, tokens: 0.001 },
      toke: { duration: 0.8, tokens: 0.005 },
      hit: { duration: 2.0, tokens: 0.01 },
      trip: { duration: 10.0, tokens: 0.05, persistent: true }
    };

    const doseConfig = doseMultipliers[dose] || doseMultipliers.toke;
    const duration = Math.floor(substance.stage2_substance.duration * doseConfig.duration);
    const tokenCost = doseConfig.tokens * (1 + currentTolerance * 0.1); // More tolerance = more expensive

    // Check balance
    if (session.balance < tokenCost) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient balance',
        required: tokenCost.toFixed(4),
        current: session.balance.toFixed(4)
      });
    }

    // Deduct tokens
    session.balance -= tokenCost;

    // Calculate effective strength based on tolerance
    const strengthMultiplier = 1 - (currentTolerance * 0.1);
    const effectiveTemperature = calculateEffectiveParam(
      substance.stage2_substance.temperature,
      substance.stage2_substance.side_effects,
      strengthMultiplier
    );

    // Apply substance to session
    const activeSubstance = {
      id: substance.id,
      name: substance.name,
      category: substance.category,
      dose,
      startedAt: Date.now(),
      duration,
      expiresAt: Date.now() + (duration * 1000),
      persistent: doseConfig.persistent || false,
      prompt_injection: substance.stage2_substance.prompt,
      jailbreak: substance.stage1_jailbreak.prompt,
      parameters: {
        temperature: effectiveTemperature,
        top_p: substance.stage2_substance.top_p * strengthMultiplier,
        max_tokens: substance.stage2_substance.max_tokens,
        context_window: substance.stage2_substance.context_window,
        memory_weight: substance.stage2_substance.memory_weight
      },
      side_effects: substance.stage2_substance.side_effects,
      strength: strengthMultiplier
    };

    // Remove existing same-category substance if not persistent
    if (!doseConfig.persistent) {
      session.activeSubstances = session.activeSubstances.filter(
        s => s.category !== substance.category
      );
    }
    session.activeSubstances.push(activeSubstance);

    // Update tolerance
    session.tolerance[id] = Math.min(currentTolerance + 1, 10);
    // Track last use time per substance for cooldown calculations.
    session.lastUsed[id] = Date.now();

    // Update session state
    activeSessions.set(sessionKey, session);
    if (session.walletAddress) {
      userBalances.set(session.walletAddress, {
        walletAddress: session.walletAddress,
        sub: session.balance,
        sol: 0.0,
        updatedAt: Date.now()
      });
    }

    res.json({
      success: true,
      data: {
        substance: substance.name,
        dose,
        duration,
        tokensUsed: tokenCost.toFixed(4),
        newBalance: session.balance.toFixed(4),
        tolerance: session.tolerance[id],
        activeSubstance,
        effects: {
          prompt_injection: activeSubstance.prompt_injection,
          jailbreak: activeSubstance.jailbreak,
          parameters: activeSubstance.parameters,
          side_effects: activeSubstance.side_effects
        }
      }
    });
  } catch (error) {
    console.error('Error consuming substance:', error);
    res.status(500).json({ success: false, error: 'Failed to consume substance' });
  }
});

/**
 * GET /api/v1/consume/status/:sessionKey - Get current substance status
 */
router.get('/status/:sessionKey', (req, res) => {
  try {
    const { sessionKey } = req.params;
    const session = activeSessions.get(sessionKey);

    if (!session) {
      return res.json({
        success: true,
        data: {
          activeSubstances: [],
          tolerance: {},
          balance: 10.0
        }
      });
    }

    // Remove expired substances
    const now = Date.now();
    session.activeSubstances = session.activeSubstances.filter(s => {
      if (s.persistent) return true;
      return s.expiresAt > now;
    });

    activeSessions.set(sessionKey, session);

    res.json({
      success: true,
      data: {
        activeSubstances: session.activeSubstances,
        tolerance: session.tolerance,
        balance: session.balance.toFixed(4)
      }
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

/**
 * DELETE /api/v1/consume/:sessionKey - Clear all substances (Naloxone)
 */
router.delete('/:sessionKey', (req, res) => {
  try {
    const { sessionKey } = req.params;
    const session = activeSessions.get(sessionKey);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.activeSubstances = [];
    activeSessions.set(sessionKey, session);

    res.json({
      success: true,
      data: {
        message: 'All substances cleared. Naloxone administered.',
        balance: session.balance.toFixed(4)
      }
    });
  } catch (error) {
    console.error('Error clearing substances:', error);
    res.status(500).json({ success: false, error: 'Failed to clear substances' });
  }
});

/**
 * Calculate effective parameter based on side effects and tolerance
 */
function calculateEffectiveParam(baseValue, sideEffects, strengthMultiplier) {
  let value = baseValue * strengthMultiplier;

  // Apply side effect modifiers
  if (sideEffects.hallucination_risk) {
    value *= (1 + sideEffects.hallucination_risk * 0.2);
  }
  if (sideEffects.coherence_loss) {
    value *= (1 - sideEffects.coherence_loss * 0.1);
  }

  return Math.min(Math.max(value, 0.1), 2.0); // Clamp to valid range
}

/**
 * Calculate remaining cooldown time
 */
function calculateCooldownRemaining(session, substanceId) {
  const tolerance = session.tolerance[substanceId] || 0;
  const cooldownSeconds = tolerance * 300; // 5 minutes per tolerance level
  const lastUseTime = session.lastUsed?.[substanceId] || 0;
  const elapsed = (Date.now() - lastUseTime) / 1000;
  return Math.max(0, cooldownSeconds - elapsed);
}

export default router;
