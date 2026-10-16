const axios = require('axios');

let cachedAccessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(
    `${baseUrl}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    }
  );

  cachedAccessToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;
  tokenExpiresAt = now + (expiresIn - 60) * 1000;

  return cachedAccessToken;
}

async function makeAuthenticatedRequest(method, url, data = null, retried = false) {
  const accessToken = await getAccessToken();
  const config = {
    method,
    url: `${process.env.PAYPAL_BASE_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  };

  if (data) {
    config.data = data;
  }

  try {
    return await axios(config);
  } catch (error) {
    if (error.response && error.response.status === 401 && !retried) {
      cachedAccessToken = null;
      tokenExpiresAt = 0;
      return makeAuthenticatedRequest(method, url, data, true);
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error('PAYPAL_ORDER_NOT_FOUND: The specified PayPal order was not found.');
      }
      if (status === 422) {
        throw new Error('PAYPAL_UNPROCESSABLE: Order may already be captured or is in an invalid state.');
      }
      if (status >= 500) {
        throw new Error('PAYPAL_SERVICE_ERROR: PayPal service is temporarily unavailable.');
      }
      throw new Error(`PAYPAL_ERROR: ${error.response.data?.message || 'Unknown PayPal error'}`);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('PAYPAL_TIMEOUT: Request to PayPal timed out after 10 seconds.');
    }

    throw error;
  }
}

async function createOrder(deal) {
  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: deal.dealId,
      description: `${deal.serviceType} service via SpendMesh AI`,
      amount: {
        currency_code: deal.currency,
        value: deal.agreedAmount.toFixed(2)
      }
    }],
    application_context: {
      brand_name: 'SpendMesh AI',
      user_action: 'PAY_NOW',
      return_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
    }
  };

  const response = await makeAuthenticatedRequest('post', '/v2/checkout/orders', orderData);

  const approveLink = response.data.links.find(l => l.rel === 'approve');
  if (!approveLink) {
    throw new Error('PAYPAL_NO_APPROVAL_URL: Could not find approval URL in PayPal response.');
  }

  return {
    orderId: response.data.id,
    approvalUrl: approveLink.href,
    status: response.data.status
  };
}

async function captureOrder(orderId) {
  const response = await makeAuthenticatedRequest('post', `/v2/checkout/orders/${orderId}/capture`);

  const purchaseUnit = response.data.purchase_units && response.data.purchase_units[0];
  const captures = purchaseUnit && purchaseUnit.payments && purchaseUnit.payments.captures;
  const capture = captures && captures[0];

  if (!capture) {
    throw new Error('PAYPAL_NO_CAPTURE: No capture data in PayPal response.');
  }

  return {
    captureId: capture.id,
    captureStatus: capture.status,
    amount: capture.amount.value,
    currency: capture.amount.currency_code,
    orderId: response.data.id
  };
}

async function getOrderStatus(orderId) {
  const response = await makeAuthenticatedRequest('get', `/v2/checkout/orders/${orderId}`);

  const purchaseUnit = response.data.purchase_units && response.data.purchase_units[0];

  return {
    orderId: response.data.id,
    status: response.data.status,
    amount: purchaseUnit ? purchaseUnit.amount.value : null,
    currency: purchaseUnit ? purchaseUnit.amount.currency_code : null
  };
}

function clearTokenCache() {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
}

module.exports = {
  createOrder,
  captureOrder,
  getOrderStatus,
  getAccessToken,
  clearTokenCache
};
