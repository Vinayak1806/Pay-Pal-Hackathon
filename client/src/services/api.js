import axios from 'axios';

const rawBaseURL = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 45000
});

// Response interceptor to handle errors uniformly
api.interceptors.response.use(
  response => response,
  error => {
    let message = 'An unexpected error occurred';
    let code = 'NETWORK_ERROR';

    if (error.response?.data?.error?.message) {
      message = error.response.data.error.message;
      code = error.response.data.error.code || 'SERVER_ERROR';
    } else if (typeof error.response?.data?.error === 'string') {
      message = error.response.data.error;
    } else if (error.response?.status === 500) {
      message = 'Server encountered a temporary error. Please try again in a moment.';
      code = 'INTERNAL_SERVER_ERROR';
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject({
      message,
      code,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

export const agentService = {
  processRequest: async (userInput, customParsedTask = null, existingTaskId = null) => {
    const payload = customParsedTask
      ? { parsedTask: customParsedTask, taskId: existingTaskId }
      : { userInput };
    const res = await api.post('/agents/request', payload);
    return res.data;
  },
  chat: async (query, context = {}) => {
    const res = await api.post('/agents/chat', { query, context });
    return res.data;
  }
};

export const dealService = {
  createDeal: async (taskId, offerId, parsedTask) => {
    const res = await api.post('/deals', { taskId, offerId, parsedTask });
    return res.data;
  },
  getDeals: async (params = {}) => {
    const res = await api.get('/deals', { params });
    return res.data;
  },
  getDeal: async (dealId) => {
    const res = await api.get(`/deals/${dealId}`);
    return res.data;
  },
  checkoutDeal: async (dealId, body = {}) => {
    const res = await api.post(`/deals/${dealId}/checkout`, body);
    return res.data;
  },
  approveDeal: async (dealId, decision) => {
    const res = await api.post(`/deals/${dealId}/approve`, { decision });
    return res.data;
  }
};

export const paymentService = {
  capturePayment: async (orderId) => {
    const res = await api.post(`/payments/${orderId}/capture`);
    return res.data;
  },
  getPaymentStatus: async (orderId) => {
    const res = await api.get(`/payments/${orderId}/status`);
    return res.data;
  },
  handleCancelStatus: async (token) => {
    const res = await api.get('/payments/cancel-status', { params: { token } });
    return res.data;
  }
};

export const policyService = {
  getPolicy: async () => {
    const res = await api.get('/policy');
    return res.data;
  },
  updatePolicy: async (data) => {
    const res = await api.put('/policy', data);
    return res.data;
  }
};

export const auditService = {
  getLogs: async (params = {}) => {
    const res = await api.get('/audit', { params });
    return res.data;
  },
  verifyIntegrity: async () => {
    const res = await api.get('/audit/verify');
    return res.data;
  }
};

export const demoService = {
  reset: async () => {
    const res = await api.post('/demo/reset');
    return res.data;
  },
  checkHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  }
};

export default api;
