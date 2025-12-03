// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());

// === конфиг ===
const PACKAGE_NAME = process.env.PACKAGE_NAME || 'com.rosenbergvictor72.pealim2';

// auth к Play Developer API через сервис-аккаунт
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
});

const androidPublisher = google.androidpublisher('v3');

// "БД" в памяти (замени на свою при проде)
const db = new Map(); // userId -> { pro, expiresAt, productId, lastToken, state }

function isActiveState(state) {
  // см. перечень статусов в ответе subscriptionsv2.get
  return (
    state === 'SUBSCRIPTION_STATE_ACTIVE' ||
    state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ||
    state === 'SUBSCRIPTION_STATE_ON_HOLD'
  );
}

function extractExpiryTimeMs(subV2) {
  const li = subV2?.lineItems?.[0];
  const t = Date.parse(li?.expiryTime || '');
  return Number.isFinite(t) ? t : null;
}

app.post('/iap/google/subscription/verify', async (req, res) => {
  try {
    const { userId, purchaseToken, productId, packageName } = req.body || {};
    if (!userId || !purchaseToken) {
      return res.status(400).json({ ok: false, error: 'userId and purchaseToken required' });
    }
    const pkg = packageName || PACKAGE_NAME;

    const client = await auth.getClient();
    const { data } = await androidPublisher.purchases.subscriptionsv2.get({
      auth: client,
      packageName: pkg,
      token: purchaseToken,
    });

    const state = data?.subscriptionState || 'UNKNOWN';
    const expiresAt = extractExpiryTimeMs(data);
    const apiProductId = data?.lineItems?.[0]?.productId || productId || 'unknown';
    const active = isActiveState(state) && expiresAt && expiresAt > Date.now();

    db.set(userId, {
      pro: !!active,
      expiresAt: expiresAt || 0,
      lastToken: purchaseToken,
      productId: apiProductId,
      state,
      lastCheckAt: Date.now(),
    });

    return res.json({
      ok: true,
      userId,
      state,
      productId: apiProductId,
      expiresAt,
      expiresAtISO: expiresAt ? new Date(expiresAt).toISOString() : null,
      pro: !!active,
      packageName: pkg,
    });
  } catch (e) {
    console.error('[verify] error', e?.response?.data || e);
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e?.message || 'internal_error',
    });
  }
});

app.get('/iap/status/:userId', (req, res) => {
  const row = db.get(req.params.userId);
  if (!row) return res.json({ ok: true, pro: false });
  return res.json({ ok: true, ...row });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`IAP server listening on :${PORT}`);
});
