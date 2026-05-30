require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type', 'x-user-id'] }));
app.use(express.json());

const CHAPA_SECRET = process.env.CHAPA_SECRET || 'CHASECK_TEST-zzfpdEOJ7DBavIj7Qkyn5fjsU4hLps9Z';
const PORT        = process.env.PORT        || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SERVER_URL   = process.env.SERVER_URL   || `http://localhost:${PORT}`;

// ─── In-Memory Store (Replace with MongoDB / PostgreSQL in production) ────────
// users: Map<userId, UserRecord>
// UserRecord: { id, email, firstName, lastName, premium: null | PremiumRecord }
// PremiumRecord: { type: 'premium'|'plus', startDate, endDate, verified, txRef }
const users           = new Map();
const pendingPayments = new Map(); // txRef → { userId, plan }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getOrCreateUser = (userId) => {
  if (!users.has(userId)) users.set(userId, { id: userId, premium: null });
  return users.get(userId);
};

const checkAndExpirePremium = (user) => {
  if (user.premium && new Date() > new Date(user.premium.endDate)) {
    console.log(`[EXPIRY] Removing expired premium for user ${user.id}`);
    user.premium = null;
  }
  return user;
};

// Run expiry sweep every hour
setInterval(() => {
  console.log('[SWEEP] Checking premium expiry for all users...');
  for (const [, user] of users) checkAndExpirePremium(user);
}, 60 * 60 * 1000);

// ─── Middleware ────────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId || userId === 'null' || userId === 'undefined')
    return res.status(401).json({ error: 'Not authenticated' });
  req.userId = userId;
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/user/premium — current user's premium status
app.get('/api/user/premium', requireAuth, (req, res) => {
  const user = checkAndExpirePremium(getOrCreateUser(req.userId));
  res.json({ premium: user.premium });
});

// POST /api/user/profile — save user profile data (call this on login)
app.post('/api/user/profile', requireAuth, (req, res) => {
  const { email, firstName, lastName } = req.body;
  const user = getOrCreateUser(req.userId);
  user.email     = email     || user.email;
  user.firstName = firstName || user.firstName;
  user.lastName  = lastName  || user.lastName;
  users.set(req.userId, user);
  res.json({ success: true });
});

// POST /api/payment/initialize — start Chapa checkout
app.post('/api/payment/initialize', requireAuth, async (req, res) => {
  const { plan, email, firstName, lastName } = req.body;

  if (!['premium', 'plus'].includes(plan))
    return res.status(400).json({ error: 'Invalid plan. Must be "premium" or "plus".' });

  const user = checkAndExpirePremium(getOrCreateUser(req.userId));

  // Block upgrade while active
  if (user.premium)
    return res.status(409).json({
      error: 'active_subscription',
      message: 'You already have an active subscription. Please wait until it expires to upgrade.',
      expiresAt: user.premium.endDate,
    });

  const amount = plan === 'premium' ? '150' : '200';
  const txRef  = `creator-${plan}-${req.userId}-${Date.now()}`;

  const callbackUrl = `${SERVER_URL}/api/payment/callback/${txRef}`;
  const returnUrl   = `${FRONTEND_URL}/premium?payment=success&plan=${plan}&tx_ref=${txRef}`;

  try {
    const { data } = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount,
        currency: 'ETB',
        email:       email     || `${req.userId}@creator.app`,
        first_name:  firstName || 'Creator',
        last_name:   lastName  || 'User',
        tx_ref:      txRef,
        callback_url: callbackUrl,
        return_url:   returnUrl,
        customization: {
          title: plan === 'premium' ? 'Creator Premium' : 'Creator Plus',
          description: plan === 'premium'
            ? 'Verified badge · Fast payout · Custom overlays · Premium profile · No suggestions'
            : 'No ads · Featured account · Premium GIF · All Premium features',
        },
      },
      { headers: { Authorization: `Seckey ${CHAPA_SECRET}`, 'Content-Type': 'application/json' } }
    );

    pendingPayments.set(txRef, { userId: req.userId, plan });
    console.log(`[PAYMENT] Initialized ${plan} for user ${req.userId}, txRef=${txRef}`);

    res.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (err) {
    console.error('[CHAPA ERROR]', err.response?.data || err.message);
    res.status(502).json({ error: 'Payment gateway error. Please try again.' });
  }
});

// GET /api/payment/callback/:txRef — Chapa server-to-server callback
app.get('/api/payment/callback/:txRef', async (req, res) => {
  const { txRef } = req.params;
  await activatePremiumForTxRef(txRef);
  res.redirect(`${FRONTEND_URL}/premium?payment=success`);
});

// POST /api/payment/verify — called by frontend after Chapa redirect
app.post('/api/payment/verify', requireAuth, async (req, res) => {
  const { txRef } = req.body;
  if (!txRef) return res.status(400).json({ error: 'txRef required' });

  const payment = pendingPayments.get(txRef);
  if (!payment) {
    // Already processed (callback beat the redirect), just return current status
    const user = checkAndExpirePremium(getOrCreateUser(req.userId));
    return res.json({ success: true, alreadyProcessed: true, premium: user.premium });
  }

  if (payment.userId !== req.userId)
    return res.status(403).json({ error: 'Transaction does not belong to this user' });

  const activated = await activatePremiumForTxRef(txRef);
  const user = checkAndExpirePremium(getOrCreateUser(req.userId));
  res.json({ success: activated, premium: user.premium });
});

// ─── Internal helper: verify with Chapa and activate ──────────────────────────
async function activatePremiumForTxRef(txRef) {
  const payment = pendingPayments.get(txRef);
  if (!payment) return false; // already processed

  try {
    const { data } = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { Authorization: `Seckey ${CHAPA_SECRET}` } }
    );

    if (data.status === 'success' && data.data?.status === 'success') {
      const { userId, plan } = payment;
      const startDate = new Date();
      const endDate   = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 30-day access

      const user = getOrCreateUser(userId);
      user.premium = { type: plan, startDate: startDate.toISOString(), endDate: endDate.toISOString(), verified: true, txRef };
      users.set(userId, user);
      pendingPayments.delete(txRef);

      console.log(`[ACTIVATED] ${plan} for user ${userId} until ${endDate.toISOString()}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[VERIFY ERROR]', err.response?.data || err.message);
    return false;
  }
}

// ─── Dev/Admin endpoints ──────────────────────────────────────────────────────
// POST /api/dev/grant-premium — manually grant premium for testing
app.post('/api/dev/grant-premium', (req, res) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ error: 'Not available in production' });

  const { userId, plan, days } = req.body;
  const user      = getOrCreateUser(userId);
  const startDate = new Date();
  const endDate   = new Date();
  endDate.setDate(endDate.getDate() + (days || 30));

  user.premium = { type: plan || 'premium', startDate: startDate.toISOString(), endDate: endDate.toISOString(), verified: true, txRef: 'dev-grant' };
  users.set(userId, user);
  res.json({ success: true, premium: user.premium });
});

// DELETE /api/dev/revoke-premium — remove premium for testing
app.delete('/api/dev/revoke-premium', (req, res) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ error: 'Not available in production' });

  const { userId } = req.body;
  const user = getOrCreateUser(userId);
  user.premium = null;
  res.json({ success: true });
});

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🚀  Creator Premium Backend running on port ${PORT}`);
  console.log(`   Frontend URL : ${FRONTEND_URL}`);
  console.log(`   Server URL   : ${SERVER_URL}\n`);
});