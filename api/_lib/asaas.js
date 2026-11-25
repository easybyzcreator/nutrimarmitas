import crypto from 'node:crypto';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'app-nutrimarmitas';
const PAID_STATUSES = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);

const STATUS_LABELS_PT = {
  PENDING: 'Pendente',
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  OVERDUE: 'Vencido',
  REFUNDED: 'Estornado',
  RECEIVED_IN_CASH: 'Recebido em Dinheiro',
  REFUND_REQUESTED: 'Estorno Solicitado',
  REFUND_IN_PROGRESS: 'Estorno em Processamento',
  CHARGEBACK_REQUESTED: 'Contestação Solicitada',
  CHARGEBACK_DISPUTE: 'Em Disputa',
  AWAITING_CHARGEBACK_REVERSAL: 'Aguardando Reversão',
  DUNNING_REQUESTED: 'Em Cobrança',
  DUNNING_RECEIVED: 'Recuperado',
  AWAITING_RISK_ANALYSIS: 'Em Análise'
};

export function round2(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

export function cleanDigits(val) {
  return String(val || '').replace(/\D/g, '');
}

export function isValidCpfCnpj(raw) {
  const digits = cleanDigits(raw);
  if (digits.length === 11) {
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    if (rev !== parseInt(digits[9], 10)) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    return rev === parseInt(digits[10], 10);
  }
  if (digits.length === 14) {
    if (/^(\d)\1{13}$/.test(digits)) return false;
    const calc = (len) => {
      let sum = 0;
      let pos = len - 7;
      for (let i = len; i >= 1; i--) {
        sum += parseInt(digits[len - i], 10) * pos--;
        if (pos < 2) pos = 9;
      }
      const res = sum % 11;
      return res < 2 ? 0 : 11 - res;
    };
    return calc(12) === parseInt(digits[12], 10) && calc(13) === parseInt(digits[13], 10);
  }
  return false;
}

export function sanitizeAsaasUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (host === 'asaas.com' || host.endsWith('.asaas.com')) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function getTodayBrazilYMD() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function getGatewayEnv() {
  const apiKey = (process.env.ASAAS_API_KEY || '').trim();
  const webhookToken = (process.env.ASAAS_WEBHOOK_TOKEN || '').trim();
  const envFlag = (process.env.ASAAS_ENV || '').trim().toLowerCase();
  const isSandbox = envFlag === 'sandbox' || /hmlg|sandbox/i.test(apiKey);
  const baseUrl = isSandbox
    ? 'https://api-sandbox.asaas.com/v3'
    : 'https://api.asaas.com/v3';
  return { apiKey, webhookToken, baseUrl };
}

function timingSafeCompare(a, b) {
  const bufA = crypto.createHash('sha256').update(String(a || '')).digest();
  const bufB = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

function fromFirestoreValue(val) {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const out = {};
    const fields = val.mapValue.fields || {};
    for (const key of Object.keys(fields)) {
      out[key] = fromFirestoreValue(fields[key]);
    }
    return out;
  }
  return null;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toFirestoreValue(item))
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const k of Object.keys(val)) {
      if (val[k] !== undefined) {
        fields[k] = toFirestoreValue(val[k]);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function assertValidOrderId(orderId) {
  const id = String(orderId || '').trim();
  if (!id || !/^[a-zA-Z0-9_-]{4,128}$/.test(id)) {
    throw new Error('INVALID_ORDER_ID');
  }
  return id;
}

export async function getOrderFromFirestore(orderId) {
  const safeId = assertValidOrderId(orderId);
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/pedidos/${encodeURIComponent(safeId)}`;
  const resp = await fetch(url);
  if (resp.status === 404) return null;
  if (!resp.ok) {
    throw new Error(`FIRESTORE_READ_ERROR_${resp.status}`);
  }
  const data = await resp.json();
  const parsed = {};
  const fields = data.fields || {};
  for (const key of Object.keys(fields)) {
    parsed[key] = fromFirestoreValue(fields[key]);
  }
  return { id: safeId, ...parsed };
}

export async function updateOrderInFirestore(orderId, updates) {
  const safeId = assertValidOrderId(orderId);
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const params = new URLSearchParams();
  const fields = {};
  for (const [k, v] of entries) {
    params.append('updateMask.fieldPaths', k);
    fields[k] = toFirestoreValue(v);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/pedidos/${encodeURIComponent(safeId)}?${params.toString()}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`FIRESTORE_WRITE_ERROR_${resp.status}: ${text}`);
  }
}

async function gatewayRequest(path, options = {}) {
  const { apiKey, baseUrl } = getGatewayEnv();
  if (!apiKey) {
    const err = new Error('PAYMENT_GATEWAY_NOT_CONFIGURED');
    err.statusCode = 503;
    throw err;
  }

  const resp = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'NutriMarmitas-Checkout/1.0',
      'access_token': apiKey,
      ...(options.headers || {})
    }
  });

  const text = await resp.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!resp.ok) {
    const errMsg = json?.errors?.[0]?.description || `Gateway HTTP ${resp.status}`;
    const err = new Error(errMsg);
    err.statusCode = resp.status;
    err.gatewayErrors = json?.errors || [];
    throw err;
  }

  return json;
}

async function findOrCreateCustomer({ name, cpfCnpj, email, phone }) {
  const digits = cleanDigits(cpfCnpj);
  const search = await gatewayRequest(`/customers?cpfCnpj=${encodeURIComponent(digits)}&limit=5`);
  if (Array.isArray(search?.data) && search.data.length > 0) {
    const existing = search.data[0];
    return existing.id;
  }

  const cleanPhone = cleanDigits(phone);
  const created = await gatewayRequest('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: String(name || 'Cliente').slice(0, 100),
      cpfCnpj: digits,
      email: email ? String(email).trim() : undefined,
      mobilePhone: cleanPhone.length >= 10 ? cleanPhone.replace(/^55/, '') : undefined,
      notificationDisabled: false
    })
  });

  return created.id;
}

function mapInstallmentItem(p) {
  return {
    id: p.id,
    number: Number(p.installmentNumber || 1),
    dueDate: p.dueDate || '',
    value: round2(Number(p.value || 0)),
    status: p.status || 'PENDING',
    statusLabelPt: STATUS_LABELS_PT[p.status] || p.status || 'Pendente',
    paymentDate: p.paymentDate || p.clientPaymentDate || '',
    confirmedDate: p.confirmedDate || '',
    invoiceUrl: sanitizeAsaasUrl(p.invoiceUrl) || '',
    bankSlipUrl: sanitizeAsaasUrl(p.bankSlipUrl) || ''
  };
}

export async function syncOrderPayments({ orderId, paymentId, installmentId }) {
  let targetOrderId = orderId ? String(orderId).trim() : '';
  let targetInstallmentId = installmentId ? String(installmentId).trim() : '';
  let primaryPayment = null;

  if (paymentId) {
    try {
      primaryPayment = await gatewayRequest(`/payments/${encodeURIComponent(paymentId)}`);
      if (!targetOrderId && primaryPayment?.externalReference) {
        targetOrderId = String(primaryPayment.externalReference).trim();
      }
      if (!targetInstallmentId && primaryPayment?.installment) {
        targetInstallmentId = String(primaryPayment.installment).trim();
      }
    } catch (err) {
      console.error('Error fetching single payment:', err.message);
    }
  }

  const order = targetOrderId ? await getOrderFromFirestore(targetOrderId) : null;
  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (!targetInstallmentId && order.asaasInstallmentId) {
    targetInstallmentId = String(order.asaasInstallmentId);
  }
  const activePaymentId = paymentId || order.asaasPaymentId || primaryPayment?.id || '';

  const allMap = new Map();
  if (primaryPayment?.id) {
    allMap.set(primaryPayment.id, primaryPayment);
  }

  try {
    const byRef = await gatewayRequest(`/payments?externalReference=${encodeURIComponent(order.id)}&limit=100`);
    for (const p of byRef?.data || []) {
      allMap.set(p.id, p);
    }
  } catch (err) {
    console.error('Error querying payments by externalReference:', err.message);
  }

  if (targetInstallmentId) {
    try {
      const byInst = await gatewayRequest(`/payments?installment=${encodeURIComponent(targetInstallmentId)}&limit=100`);
      for (const p of byInst?.data || []) {
        allMap.set(p.id, p);
      }
    } catch (err) {
      console.error('Error querying payments by installment:', err.message);
    }
  }

  const allCharges = Array.from(allMap.values()).filter((p) => !p.deleted);

  // Relevant charges for installment display (either the active installment group, or the active single payment + any paid charges)
  let relevantCharges = allCharges;
  if (targetInstallmentId) {
    const inGroup = allCharges.filter((p) => p.installment === targetInstallmentId || PAID_STATUSES.has(p.status));
    if (inGroup.length > 0) relevantCharges = inGroup;
  } else if (activePaymentId) {
    const filtered = allCharges.filter((p) => p.id === activePaymentId || PAID_STATUSES.has(p.status));
    if (filtered.length > 0) relevantCharges = filtered;
  }

  relevantCharges.sort((a, b) => {
    const numA = Number(a.installmentNumber || 1);
    const numB = Number(b.installmentNumber || 1);
    if (numA !== numB) return numA - numB;
    return String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
  });

  const paidAmount = round2(
    allCharges
      .filter((p) => PAID_STATUSES.has(p.status))
      .reduce((acc, p) => acc + Number(p.value || 0), 0)
  );

  const orderTotal = round2(Number(order.total || 0));
  const paidPercent = orderTotal > 0
    ? Math.min(100, Math.round((paidAmount / orderTotal) * 10000) / 100)
    : 0;

  let paymentStatus = 'pending';
  let isPartial = false;
  if (orderTotal > 0 && paidAmount >= orderTotal - 0.01) {
    paymentStatus = 'full';
  } else if (orderTotal > 0 && paidAmount >= (orderTotal * 0.5) - 0.01) {
    paymentStatus = 'half';
  } else {
    paymentStatus = 'pending';
    isPartial = paidAmount > 0;
  }

  const installments = relevantCharges.map(mapInstallmentItem);
  const paidInstallments = installments.filter((inst) => PAID_STATUSES.has(inst.status)).length;
  const totalInstallments = Math.max(installments.length, Number(order.asaasInstallmentsCount || 1));

  const latestUrlSource = primaryPayment || relevantCharges[0] || {};
  const invoiceUrl = sanitizeAsaasUrl(latestUrlSource.invoiceUrl) || sanitizeAsaasUrl(order.asaasInvoiceUrl) || '';
  const bankSlipUrl = sanitizeAsaasUrl(latestUrlSource.bankSlipUrl) || sanitizeAsaasUrl(order.asaasBankSlipUrl) || '';

  const firestoreUpdates = {
    paymentStatus,
    asaasPaidAmount: paidAmount,
    asaasPaidPercent: paidPercent,
    asaasPaidInstallments: paidInstallments,
    asaasTotalInstallments: totalInstallments,
    asaasIsPartial: isPartial,
    asaasInstallments: installments
  };

  if (invoiceUrl) firestoreUpdates.asaasInvoiceUrl = invoiceUrl;
  if (bankSlipUrl) firestoreUpdates.asaasBankSlipUrl = bankSlipUrl;
  if (targetInstallmentId) firestoreUpdates.asaasInstallmentId = targetInstallmentId;

  await updateOrderInFirestore(order.id, firestoreUpdates);

  return {
    orderId: order.id,
    paymentId: activePaymentId,
    installmentId: targetInstallmentId || null,
    paymentStatus,
    paidAmount,
    paidPercent,
    paidInstallments,
    totalInstallments,
    isPartial,
    installments,
    invoiceUrl,
    bankSlipUrl
  };
}

export async function handleConfig(req, res) {
  try {
    const { apiKey } = getGatewayEnv();
    return res.status(200).json({ enabled: Boolean(apiKey) });
  } catch {
    return res.status(200).json({ enabled: false });
  }
}

export async function handleCreatePayment(req, res) {
  try {
    const { apiKey } = getGatewayEnv();
    if (!apiKey) {
      return res.status(503).json({
        error: 'Pagamento online ainda não foi ativado nas configurações do sistema.'
      });
    }

    const body = req.body || {};
    const orderId = assertValidOrderId(body.orderId);
    const cpfCnpjDigits = cleanDigits(body.cpfCnpj);

    if (!isValidCpfCnpj(cpfCnpjDigits)) {
      return res.status(400).json({
        error: 'CPF ou CNPJ inválido. Confira os dígitos informados.'
      });
    }

    const payMode = body.payMode === 'half' ? 'half' : 'full';
    const allowedMethods = new Set(['pix', 'credit', 'debit', 'boleto']);
    const paymentMethod = allowedMethods.has(body.paymentMethod) ? body.paymentMethod : 'pix';

    // Lock installments strictly: max 2x on credit only, 1x on all other methods
    const requestedInstallments = parseInt(body.installments, 10) || 1;
    const safeInstallments = paymentMethod === 'credit'
      ? Math.min(2, Math.max(1, requestedInstallments))
      : 1;

    // Fetch authoritative order total from Firestore (never trust client price)
    const order = await getOrderFromFirestore(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const orderTotal = round2(Number(order.total || 0));
    if (orderTotal <= 0) {
      return res.status(400).json({ error: 'O valor do pedido deve ser maior que zero.' });
    }

    const chargeAmount = payMode === 'half' ? round2(orderTotal * 0.5) : orderTotal;
    const remainingAmount = round2(orderTotal - chargeAmount);

    // Idempotency reuse if customer/admin retried with identical parameters and existing active payment
    if (
      order.asaasPaymentId &&
      order.asaasChargeMode === payMode &&
      order.paymentMethod === paymentMethod &&
      Number(order.asaasInstallmentsCount || 1) === safeInstallments &&
      round2(Number(order.asaasChargeAmount || 0)) === chargeAmount
    ) {
      try {
        const synced = await syncOrderPayments({
          orderId,
          paymentId: order.asaasPaymentId,
          installmentId: order.asaasInstallmentId || ''
        });
        return res.status(200).json({
          orderId,
          paymentId: order.asaasPaymentId,
          installmentId: order.asaasInstallmentId || null,
          payMode,
          paymentMethod,
          installmentsCount: safeInstallments,
          orderTotal,
          chargeAmount,
          remainingAmount,
          invoiceUrl: synced.invoiceUrl || order.asaasInvoiceUrl || '',
          bankSlipUrl: synced.bankSlipUrl || order.asaasBankSlipUrl || '',
          pixPayload: order.asaasPixPayload || '',
          pixQrCode: order.asaasPixQrCode || '',
          boletoLine: order.asaasBoletoLine || '',
          paymentStatus: synced.paymentStatus,
          paidAmount: synced.paidAmount,
          paidPercent: synced.paidPercent,
          paidInstallments: synced.paidInstallments,
          totalInstallments: synced.totalInstallments,
          isPartial: synced.isPartial,
          installments: synced.installments
        });
      } catch {
        // Fall through to fresh creation if old payment wasn't retrievable
      }
    }

    const customerId = await findOrCreateCustomer({
      name: order.customerName || 'Cliente',
      cpfCnpj: cpfCnpjDigits,
      email: order.email || '',
      phone: order.phone || ''
    });

    const dueDate = getTodayBrazilYMD();
    let billingType = 'PIX';
    if (paymentMethod === 'credit') billingType = 'CREDIT_CARD';
    else if (paymentMethod === 'debit') billingType = 'UNDEFINED'; // 3DS debit via hosted invoice
    else if (paymentMethod === 'boleto') billingType = 'BOLETO';

    const paymentPayload = {
      customer: customerId,
      billingType,
      dueDate,
      description: `Pedido NutriMarmitas #${orderId.slice(-6).toUpperCase()} (${payMode === 'half' ? 'Sinal 50%' : 'Integral 100%'})`,
      externalReference: orderId
    };

    if (paymentMethod === 'credit' && safeInstallments > 1) {
      paymentPayload.installmentCount = safeInstallments;
      paymentPayload.totalValue = chargeAmount;
    } else {
      paymentPayload.value = chargeAmount;
    }

    const payment = await gatewayRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentPayload)
    });

    let pixPayload = '';
    let pixQrCode = '';
    let boletoLine = '';

    if (paymentMethod === 'pix') {
      try {
        const qr = await gatewayRequest(`/payments/${encodeURIComponent(payment.id)}/pixQrCode`);
        pixPayload = qr?.payload || '';
        pixQrCode = qr?.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : '';
      } catch (err) {
        console.error('Error fetching PIX QR code:', err.message);
      }
    }

    if (paymentMethod === 'boleto') {
      try {
        const idField = await gatewayRequest(`/payments/${encodeURIComponent(payment.id)}/identificationField`);
        boletoLine = idField?.identificationField || payment.nossoNumero || '';
      } catch (err) {
        console.error('Error fetching Boleto identificationField:', err.message);
      }
    }

    const invoiceUrl = sanitizeAsaasUrl(payment.invoiceUrl) || '';
    const bankSlipUrl = sanitizeAsaasUrl(payment.bankSlipUrl) || '';

    await updateOrderInFirestore(orderId, {
      cpfCnpj: cpfCnpjDigits,
      paymentMethod,
      paymentChargeMode: payMode,
      paymentInstallments: safeInstallments,
      asaasCustomerId: customerId,
      asaasPaymentId: payment.id,
      asaasInstallmentId: payment.installment || '',
      asaasBillingType: billingType,
      asaasChargeMode: payMode,
      asaasInstallmentsCount: safeInstallments,
      asaasChargeAmount: chargeAmount,
      asaasInvoiceUrl: invoiceUrl,
      asaasBankSlipUrl: bankSlipUrl,
      asaasPixPayload: pixPayload,
      asaasPixQrCode: pixQrCode,
      asaasBoletoLine: boletoLine
    });

    const synced = await syncOrderPayments({
      orderId,
      paymentId: payment.id,
      installmentId: payment.installment || ''
    });

    return res.status(200).json({
      orderId,
      paymentId: payment.id,
      installmentId: payment.installment || null,
      payMode,
      paymentMethod,
      installmentsCount: safeInstallments,
      orderTotal,
      chargeAmount,
      remainingAmount,
      invoiceUrl: synced.invoiceUrl || invoiceUrl,
      bankSlipUrl: synced.bankSlipUrl || bankSlipUrl,
      pixPayload,
      pixQrCode,
      boletoLine,
      paymentStatus: synced.paymentStatus,
      paidAmount: synced.paidAmount,
      paidPercent: synced.paidPercent,
      paidInstallments: synced.paidInstallments,
      totalInstallments: synced.totalInstallments,
      isPartial: synced.isPartial,
      installments: synced.installments
    });
  } catch (err) {
    console.error('Create payment error:', err.message);
    if (err.message === 'INVALID_ORDER_ID') {
      return res.status(400).json({ error: 'Identificador do pedido inválido.' });
    }
    if (err.statusCode === 503) {
      return res.status(503).json({ error: 'Pagamento online indisponível no momento.' });
    }
    return res.status(500).json({
      error: 'Não foi possível gerar a cobrança agora. Tente novamente em instantes.'
    });
  }
}

export async function handlePaymentStatus(req, res) {
  try {
    const { apiKey } = getGatewayEnv();
    if (!apiKey) {
      return res.status(503).json({ error: 'Pagamento online não configurado.' });
    }

    const paymentId = String(req.params?.paymentId || req.query?.paymentId || '').trim();
    const orderId = String(req.query?.orderId || '').trim();

    if (!paymentId && !orderId) {
      return res.status(400).json({ error: 'Parâmetros de consulta ausentes.' });
    }

    const synced = await syncOrderPayments({
      orderId: orderId || undefined,
      paymentId: paymentId || undefined
    });

    return res.status(200).json({ ok: true, ...synced });
  } catch (err) {
    console.error('Payment status error:', err.message);
    if (err.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    return res.status(500).json({ error: 'Não foi possível consultar o status do pagamento.' });
  }
}

export async function handleWebhook(req, res) {
  try {
    const { webhookToken } = getGatewayEnv();
    if (!webhookToken) {
      return res.status(503).json({ error: 'Webhook token not configured' });
    }

    const receivedToken = req.headers?.['asaas-access-token'] || req.headers?.['Asaas-Access-Token'] || '';
    if (!receivedToken || !timingSafeCompare(receivedToken, webhookToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};
    const paymentObj = body.payment || {};
    const paymentId = paymentObj.id ? String(paymentObj.id).trim() : '';
    const orderId = paymentObj.externalReference ? String(paymentObj.externalReference).trim() : '';
    const installmentId = paymentObj.installment ? String(paymentObj.installment).trim() : '';

    if (paymentId || orderId) {
      await syncOrderPayments({
        orderId: orderId || undefined,
        paymentId: paymentId || undefined,
        installmentId: installmentId || undefined
      });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ error: 'Webhook error' });
  }
}
