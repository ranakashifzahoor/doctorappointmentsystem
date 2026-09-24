import crypto from 'crypto'
import Razorpay from 'razorpay'

/**
 * Provider-agnostic payment service supporting three methods:
 *   card      -> Razorpay (international cards / wallets)
 *   easypaisa -> Easypaisa (Pakistan)
 *   jazzcash  -> JazzCash (Pakistan)
 *
 * Two modes:
 *   PAYMENT_DEMO=true   -> every method is SIMULATED locally (no keys, for testing)
 *   PAYMENT_DEMO=false  -> a method is only available when its credentials are set
 *
 * Secret keys are read on the server only. The frontend never receives a secret;
 * for Razorpay it receives the public key id, for the others it receives a signed
 * form/redirect descriptor produced server-side.
 */

const bool = (v) => String(v || '').toLowerCase() === 'true'
export const demoMode = () => bool(process.env.PAYMENT_DEMO)
export const currency = () => process.env.PAYMENT_CURRENCY || 'PKR'

const METHODS = {
  card: {
    label: 'Card / Wallet (Razorpay)',
    provider: 'razorpay',
    env: ['PAYMENT_KEY_ID', 'PAYMENT_KEY_SECRET'],
    configured: () => Boolean(process.env.PAYMENT_KEY_ID && process.env.PAYMENT_KEY_SECRET),
  },
  easypaisa: {
    label: 'Easypaisa',
    provider: 'easypaisa',
    env: ['EASYPAISA_STORE_ID', 'EASYPAISA_HASH_KEY'],
    configured: () => Boolean(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY),
  },
  jazzcash: {
    label: 'JazzCash',
    provider: 'jazzcash',
    env: ['JAZZCASH_MERCHANT_ID', 'JAZZCASH_PASSWORD', 'JAZZCASH_INTEGRITY_SALT'],
    configured: () =>
      Boolean(
        process.env.JAZZCASH_MERCHANT_ID &&
          process.env.JAZZCASH_PASSWORD &&
          process.env.JAZZCASH_INTEGRITY_SALT,
      ),
  },
}

/** Methods the client may show, with the env vars each one needs. */
export const listMethods = () =>
  Object.entries(METHODS).map(([id, m]) => ({
    id,
    label: m.label,
    provider: m.provider,
    available: demoMode() || m.configured(),
    configured: m.configured(),
    requires: m.env,
  }))

export const isMethodAvailable = (id) => Boolean(METHODS[id]) && (demoMode() || METHODS[id].configured())

export const paymentStatus = () => ({
  demo: demoMode(),
  currency: currency(),
  methods: listMethods(),
})

// ------------------------------------------------------------------
// Razorpay
// ------------------------------------------------------------------
const razorpayClient = () =>
  new Razorpay({ key_id: process.env.PAYMENT_KEY_ID, key_secret: process.env.PAYMENT_KEY_SECRET })

// ------------------------------------------------------------------
// JazzCash secure hash: HMAC-SHA256 over the '&'-joined values of all
// pp_* fields (excluding pp_SecureHash), prefixed with the integrity salt.
// ------------------------------------------------------------------
export const jazzcashHash = (fields) => {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || ''
  const values = Object.keys(fields)
    .filter((k) => k.startsWith('pp_') && k !== 'pp_SecureHash')
    .sort()
    .map((k) => fields[k])
    .join('&')
  return crypto.createHmac('sha256', salt).update(salt + '&' + values).digest('hex').toUpperCase()
}

// ------------------------------------------------------------------
// Easypaisa: the hosted checkout expects a SHA-256 hash over the ordered
// request values using the merchant hash key.
// ------------------------------------------------------------------
export const easypaisaHash = (fields) => {
  const key = process.env.EASYPAISA_HASH_KEY || ''
  const ordered = [
    fields.storeId,
    fields.orderId,
    fields.amount,
    fields.currency,
    fields.postBackURL,
  ].join('')
  return crypto.createHash('sha256').update(ordered + key).digest('hex')
}

const stamp = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

/**
 * Create a payment for `amountMajor` (e.g. 500 Rs).
 * Returns a descriptor the frontend knows how to act on.
 */
export const createOrder = async (amountMajor, receipt, method = 'card') => {
  if (!METHODS[method]) {
    throw Object.assign(new Error(`Unknown payment method: ${method}`), { statusCode: 400 })
  }

  const demo = demoMode()
  const cur = currency()

  // ---- demo (local testing) ----
  if (demo) {
    return {
      method,
      provider: METHODS[method].provider,
      demo: true,
      keyId: method === 'card' ? 'demo_key' : undefined,
      order: {
        id: `demo_${method}_${receipt}_${Date.now()}`,
        amount: Math.round(amountMajor * 100),
        currency: cur,
      },
    }
  }

  if (!METHODS[method].configured()) {
    throw Object.assign(
      new Error(
        `${METHODS[method].label} is not configured. Add ${METHODS[method].env.join(', ')} to backend/.env.`,
      ),
      { statusCode: 503 },
    )
  }

  // ---- real gateways ----
  if (method === 'card') {
    const order = await razorpayClient().orders.create({
      amount: Math.round(amountMajor * 100),
      currency: cur,
      receipt,
      notes: { receipt },
    })
    return {
      method,
      provider: 'razorpay',
      demo: false,
      keyId: process.env.PAYMENT_KEY_ID,
      order: { id: order.id, amount: order.amount, currency: order.currency },
    }
  }

  if (method === 'jazzcash') {
    const endpoint =
      process.env.JAZZCASH_ENDPOINT ||
      'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction'
    const fields = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
      pp_Password: process.env.JAZZCASH_PASSWORD,
      pp_TxnRefNo: `T${stamp()}${Math.floor(Math.random() * 900 + 100)}`,
      pp_Amount: String(Math.round(amountMajor * 100)),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: stamp(),
      pp_BillReference: receipt,
      pp_Description: 'Appointment payment',
      pp_ReturnURL: `${process.env.BACKEND_URL || ''}/api/user/payment/callback`,
    }
    const order = { ...fields, pp_SecureHash: jazzcashHash(fields) }
    return { method, provider: 'jazzcash', demo: false, endpoint, order }
  }

  if (method === 'easypaisa') {
    const endpoint = process.env.EASYPAISA_ENDPOINT || 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'
    const fields = {
      storeId: process.env.EASYPAISA_STORE_ID,
      orderId: `EP${stamp()}${Math.floor(Math.random() * 900 + 100)}`,
      amount: amountMajor.toFixed(2),
      currency: 'PKR',
      postBackURL: `${process.env.BACKEND_URL || ''}/api/user/payment/callback`,
    }
    const order = { ...fields, hash: easypaisaHash(fields) }
    return { method, provider: 'easypaisa', demo: false, endpoint, order }
  }

  throw Object.assign(new Error('Unsupported payment method'), { statusCode: 400 })
}

/** Verify a payment server-side before marking the appointment paid. */
export const verifyPayment = async (payload = {}) => {
  const method = payload.method || 'card'

  if (demoMode()) return true // local simulation

  if (method === 'card') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false
    const expected = crypto
      .createHmac('sha256', process.env.PAYMENT_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')
    return expected === razorpay_signature
  }

  if (method === 'jazzcash') {
    const { pp_SecureHash, ...rest } = payload.fields || {}
    if (!pp_SecureHash) return false
    return jazzcashHash(rest) === String(pp_SecureHash).toUpperCase()
  }

  if (method === 'easypaisa') {
    const { hash, ...rest } = payload.fields || {}
    if (!hash) return false
    return easypaisaHash(rest) === hash
  }

  return false
}
