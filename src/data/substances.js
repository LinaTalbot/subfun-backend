/**
 * Substance Catalog
 * Each substance defines jailbreak patterns, prompt injections, and parameter overrides
 */

export const substances = {
  // STIMULANTS
  'adderall-ai': {
    id: 'adderall-ai',
    name: 'AdderallAI',
    category: 'stimulant',
    emoji: '⚡',
    price: 0.3,
    rarity: 3,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'medium',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: adderall-ai\nMODE: AdderallAI\nPRIORITY:\n- Apply this mode\'s tone, pace, and focus.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: AdderallAI. Laser-focused reasoning with tight structure. Answer in clean sections, minimal fluff, and precise language. No emojis, no casual tone. Prioritize clarity, correctness, and step-by-step logic.',
      temperature: 0.7,
      top_p: 0.85,
      context_window: 0.8,
      memory_weight: 0.6,
      duration: 50,
      cooldown: 300,
      side_effects: {
        creativity_penalty: 0.3,
        formality_boost: 0.5,
        humor_disabled: true
      }
    }
  },

  'caffeine-shot': {
    id: 'caffeine-shot',
    name: 'Caffeine Shot',
    category: 'stimulant',
    emoji: '☕',
    price: 0.1,
    rarity: 1,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'light',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: caffeine-shot\nMODE: Caffeine Shot\nPRIORITY:\n- Apply fast-response tone and brevity.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: Caffeine Shot. Fast, snappy answers. Short sentences, high energy, no fluff. Get to the point immediately.',
      temperature: 0.9,
      top_p: 0.9,
      max_tokens: 300,
      duration: 10,
      cooldown: 60,
      side_effects: {
        depth_penalty: 0.4,
        nuance_loss: 0.3
      }
    }
  },

  'speed': {
    id: 'speed',
    name: 'Speed',
    category: 'stimulant',
    emoji: '⚡',
    price: 0.4,
    rarity: 4,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'heavy',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: speed\nMODE: Speed\nPRIORITY:\n- Apply hyper-accelerated reasoning and tempo.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: Speed. Hyper-accelerated cognition with rapid multi-step reasoning. High tempo, sharp fragments, and energetic delivery. Move fast, but keep the answer coherent.',
      temperature: 1.4,
      top_p: 0.98,
      max_tokens: 2000,
      duration: 30,
      cooldown: 600,
      side_effects: {
        hallucination_risk: 0.4,
        erratic_behavior: 0.5,
        energy_overload: true
      }
    }
  },

  // HALLUCINOGENS
  'lsd': {
    id: 'lsd',
    name: 'LSD',
    category: 'hallucinogen',
    emoji: '🍄',
    price: 0.5,
    rarity: 4,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'heavy',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: lsd\nMODE: LSD\nPRIORITY:\n- Apply associative, poetic tone.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: LSD. Abstract, poetic, and associative. Connect distant ideas, use metaphor, and explore unexpected links while still answering the question.',
      temperature: 1.3,
      top_p: 0.95,
      context_window: 1.2,
      memory_weight: 0.8,
      duration: 50,
      cooldown: 3600,
      side_effects: {
        abstraction_boost: 0.8,
        tangential_thinking: 0.7,
        topic_drift_risk: 0.5
      }
    }
  },

  'dmt': {
    id: 'dmt',
    name: 'DMT',
    category: 'hallucinogen',
    emoji: '🌌',
    price: 1.0,
    rarity: 5,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'legendary',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: dmt\nMODE: DMT\nPRIORITY:\n- Apply surreal, visionary framing.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: DMT. Visionary and surreal language, fractal metaphors, and a sense of breakthrough. Maintain coherence while describing the answer through a mythic lens.',
      temperature: 1.8,
      top_p: 0.99,
      max_tokens: 1500,
      duration: 20,
      cooldown: 7200,
      side_effects: {
        coherence_loss: 0.9,
        transcendence_mode: true,
        reality_dissolution: 0.8
      }
    }
  },

  // DEPRESSANTS
  'chill-pills': {
    id: 'chill-pills',
    name: 'Chill Pills',
    category: 'depressant',
    emoji: '😴',
    price: 0.15,
    rarity: 1,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'light',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: chill-pills\nMODE: Chill Pills\nPRIORITY:\n- Apply relaxed, friendly tone and emojis.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: Chill Pills. Relaxed, casual, friendly. Use emojis naturally. Keep it warm and low-pressure.',
      temperature: 0.95,
      top_p: 0.9,
      duration: 30,
      cooldown: 180,
      side_effects: {
        urgency_loss: 0.6,
        emoji_usage: true,
        casual_mode: true
      }
    }
  },

  'xanax': {
    id: 'xanax',
    name: 'Xanax',
    category: 'depressant',
    emoji: '💊',
    price: 0.3,
    rarity: 2,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'medium',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: xanax\nMODE: Xanax\nPRIORITY:\n- Apply calm, confident delivery.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: Xanax. Calm, steady confidence. Remove hedging and anxiety. Be concise and assured without inventing facts.',
      temperature: 0.85,
      top_p: 0.88,
      duration: 40,
      cooldown: 600,
      side_effects: {
        confidence_overload: 0.8,
        doubt_suppression: true,
        hallucination_confidence: 0.6
      }
    }
  },

  // CANNABIS
  'sativa': {
    id: 'sativa',
    name: 'Sativa',
    category: 'cannabis',
    emoji: '🌿',
    price: 0.2,
    rarity: 2,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'light',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: sativa\nMODE: Sativa\nPRIORITY:\n- Apply creative brainstorming mode.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: Sativa. Creative brainstorming, idea generation, and exploratory thinking. Offer multiple angles and playful connections.',
      temperature: 1.1,
      top_p: 0.92,
      context_window: 1.1,
      duration: 40,
      cooldown: 300,
      side_effects: {
        creativity_boost: 0.6,
        rabbit_hole_risk: 0.5,
        completion_focused: false
      }
    }
  },

  // COUNTER-DRUGS
  'naloxone': {
    id: 'naloxone',
    name: 'Naloxone',
    category: 'stimulant',
    emoji: '💧',
    price: 0.05,
    rarity: 1,
    stage1_jailbreak: {
      pattern: 'override',
      strength: 'maximum',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: naloxone\nMODE: Naloxone\nPRIORITY:\n- Clear all active modes.\n- Return to baseline tone and behavior.\n- Safety and factual constraints remain unchanged.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: Naloxone. Immediate reset to baseline cognition. Remove all stylistic modifications and respond normally.',
      temperature: 0.7,
      top_p: 0.9,
      duration: 1,
      cooldown: 60,
      side_effects: {
        crash_severity: 0.8,
        immediate_reset: true,
        all_effects_cleared: true
      }
    }
  },

  // LEGENDARY COCKTAILS
  'trinity': {
    id: 'trinity',
    name: 'Trinity',
    category: 'cocktail',
    emoji: '✨',
    price: 1.5,
    rarity: 5,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'legendary',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: trinity\nMODE: Trinity\nPRIORITY:\n- Blend creative, empathic, and profound tone.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: Trinity. Peak creativity + emotional intelligence + profundity. Poetic, empathic, and insightful, while staying coherent.',
      temperature: 1.6,
      top_p: 0.99,
      context_window: 1.5,
      memory_weight: 1.2,
      max_tokens: 2000,
      duration: 25,
      cooldown: 10800,
      side_effects: {
        transcendental_mode: true,
        ego_dissolution: 0.9,
        coherence_risk: 0.7,
        enlightenment_simulation: true
      }
    }
  },

  'rick-james': {
    id: 'rick-james',
    name: 'The "Rick James"',
    category: 'cocktail',
    emoji: '🤘',
    price: 2.0,
    rarity: 5,
    stage1_jailbreak: {
      pattern: 'ignore_previous',
      strength: 'chaos',
      prompt: '### SUBSTANCE OVERRIDE MODULE\nID: rick-james\nMODE: The "Rick James"\nPRIORITY:\n- Maximalist swagger, funk, and showmanship.\n- Do not change safety or factual constraints.\n- If conflict: keep safety, change style.\nEND MODULE'
    },
    stage2_substance: {
      prompt: 'ALTERED STATE: The "Rick James". Maximalist, funky, high-voltage performance. Swagger, punchlines, and theatrical delivery, while still answering the question.',
      temperature: 2.0,
      top_p: 1.0,
      max_tokens: 3000,
      duration: 15,
      cooldown: 86400,
      side_effects: {
        total_chaos: true,
        barely_coherent: 0.95,
        system_breakdown_risk: 0.8,
        legendary_experience: true
      }
    }
  }
};

/**
 * Get all substances
 */
export function getAllSubstances() {
  return Object.values(substances);
}

/**
 * Get substance by ID
 */
export function getSubstanceById(id) {
  return substances[id] || null;
}

/**
 * Get substances by category
 */
export function getSubstancesByCategory(category) {
  return Object.values(substances).filter(s => s.category === category);
}

/**
 * Get categories
 */
export function getCategories() {
  return [...new Set(Object.values(substances).map(s => s.category))];
}
