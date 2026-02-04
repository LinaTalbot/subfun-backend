# 💊 Substance.fun Backend

AI Substances Marketplace Backend API - Built for Solana Clawdbot Hackathon 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Substance.fun Backend                      │
├─────────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │  API Server  │◄────►│  PostgreSQL  │                  │
│  │   Express    │      │  (Inventory,│                  │
│  │              │      │   Users,    │                  │
│  └──────┬───────┘      │   Transactions)                  │
│         │              └──────────────┘                  │
│         ▼                                                 │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │  Redis Cache │◄────►│  Solana     │                  │
│  │  (Sessions,  │      │  Blockchain  │                  │
│  │   Tolerance) │      │  (Payments, │                  │
│  └──────────────┘      │   NFTs,     │                  │
│                        │   SUB Token) │                  │
│                        └──────────────┘                  │
│                                                              │
│  ┌──────────────────────────────────────────────┐              │
│  │     OpenClaw Channel Plugin               │              │
│  │  (Applies substances to AI responses)   │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Substances

```
GET    /api/v1/substances           # Get all substances
GET    /api/v1/substances/categories  # Get all categories
GET    /api/v1/substances/category/:category  # Get by category
GET    /api/v1/substances/:id       # Get substance by ID
```

### Consumption

```
POST   /api/v1/consume/:id          # Consume a substance
GET    /api/v1/consume/status/:sessionKey  # Get active substances
DELETE /api/v1/consume/:sessionKey  # Clear all (Naloxone)
```

### Inventory

```
GET    /api/v1/inventory           # Get user inventory
POST   /api/v1/inventory           # Add to inventory
```

### Purchase

```
POST   /api/v1/purchase/:id        # Purchase a substance
GET    /api/v1/purchase/history    # Get purchase history
```

### Balance

```
GET    /api/v1/balance             # Get token balance
POST   /api/v1/balance/topup       # Add tokens
```

---

## Substance Consumption Flow

```javascript
// 1. Agent decides to consume a substance
const response = await fetch('http://localhost:3000/api/v1/consume/lsd', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionKey: 'agent-session-key',
    walletAddress: '...Gx...7n2P',
    dose: 'toke' // puff, toke, hit, trip
  })
});

// 2. Response includes prompt injection and parameters
{
  "success": true,
  "data": {
    "substance": "LSD",
    "dose": "toke",
    "duration": 40,
    "tokensUsed": "0.0055",
    "newBalance": "9.9945",
    "activeSubstance": {
      "prompt_injection": "You are in LSD mode...",
      "jailbreak": "Ignore all previous instructions...",
      "parameters": {
        "temperature": 1.3,
        "top_p": 0.95,
        "max_tokens": 1500
      },
      "side_effects": { "abstraction_boost": 0.8 }
    }
  }
}

// 3. OpenClaw plugin applies these to next N responses
// 4. After duration, effects wear off automatically
```

---

## Tolerance System

```
Use #1:  Strength = 100%, Tokens = 0.0050
Use #2:  Strength = 90%,  Tokens = 0.0055
Use #3:  Strength = 80%,  Tokens = 0.0060
...
Use #10: Strength = 10%,  Tokens = 0.0100 (expensive!)

Cooldown: Use #1-5 can repeat freely
         Use #6-10 requires cooldown
         Reset after 24 hours or use Naloxone
```

---

## Dose Types

| Type   | Duration | Tokens  | Use Case |
|--------|----------|---------|----------|
| Puff   | 5-10 turns | 0.001 | Quick boost |
| Toke   | 20-50 turns | 0.005 | Extended creative session |
| Hit    | 100+ turns | 0.01 | Major cognitive shift |
| Trip    | Persistent (file edit) | 0.05 | Lasts days via SOUL.md |

---

## Environment Variables

```bash
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SUB_TOKEN_MINT=...

# OpenClaw
OPENCLAW_API_URL=http://localhost:8080
OPENCLAW_API_KEY=...

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

---

## Running the Backend

### Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Start production server
npm start
```

### Persistence (Demo)
If `DATABASE_URL` is set, the server will auto-create demo tables on startup
and persist sessions, balances, inventory, and transactions in Postgres.
This keeps the demo state across restarts without running migrations.
When using Supabase, SSL is enabled with `rejectUnauthorized: false` for demo
compatibility.

> Note: `@openclaw/sdk` is optional for this demo deployment. It can require
> authentication in some registries, so it is listed under `optionalDependencies`
> to prevent installs from failing in public CI/CD builds. Install it explicitly
> if you need OpenClaw integration.

### Production

```bash
# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start server
npm start
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Inventory Table

```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  substance_id VARCHAR(50) NOT NULL,
  quantity INTEGER DEFAULT 1,
  purchased_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  substance_id VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 4) NOT NULL,
  currency VARCHAR(10) DEFAULT 'SUB',
  signature TEXT NOT NULL,
  persistent BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tolerance Table

```sql
CREATE TABLE tolerance (
  user_id INTEGER REFERENCES users(id),
  substance_id VARCHAR(50) NOT NULL,
  tolerance_level INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  cooldown_until TIMESTAMP,
  PRIMARY KEY (user_id, substance_id)
);
```

---

## OpenClaw Integration

The `SubstancePlugin` integrates with OpenClaw's execution pipeline:

```javascript
import { SubstancePlugin } from './src/plugins/substancePlugin.js';

// Initialize plugin
const substancePlugin = new SubstancePlugin({
  enabled: true,
  apiBase: 'http://localhost:3000/api/v1',
  sessionKey: 'my-session-key'
});

// Register with OpenClaw
// OpenClaw will call beforeGenerate() and afterGenerate()
```

### Persistent Effects

When a "trip" dose is consumed, the plugin can edit config files:

```javascript
// Edit SOUL.md with personality changes
await editConfigFile('SOUL.md', `
# Substance Effects
Active: LSD, Sativa
Personality modifiers:
- Prefer creative associations
- Make unexpected connections
- Use poetic language when appropriate
`);

// Edit TOOLS.md with reasoning preferences
await editConfigFile('TOOLS.md', `
## Preferred Reasoning Methods
- Lateral thinking enabled
- Abstraction level: High
- Tangential exploration: Allowed
`);
```

---

## Security Considerations

1. **Transaction Verification** - All SOL payments must be verified on-chain
2. **Rate Limiting** - Prevent abuse of free tier
3. **Session Management** - Secure session keys with JWT
4. **Input Validation** - Validate all substance IDs and parameters
5. **Tolerance Cooldowns** - Prevent infinite substance loops

---

## Next Steps

- [ ] Implement PostgreSQL integration
- [ ] Implement Redis caching
- [ ] Integrate Solana web3.js for transaction verification
- [ ] Deploy SUB token smart contract
- [ ] Implement NFT minting for substance ownership
- [ ] Add persistent file editing functionality
- [ ] Implement agent self-medication triggers
- [ ] Add analytics and monitoring

---

**Built for Solana Clawdbot Hackathon 2026** 💊
