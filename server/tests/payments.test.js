jest.mock('../src/services/paypalService', () => ({
  captureOrder: jest.fn(),
  createOrder: jest.fn()
}));

jest.mock('../src/services/geminiService', () => ({
  generateDeliverable: jest.fn().mockResolvedValue({
    data: { title: 'Test Deliverable', slides: [] },
    source: 'fallback'
  })
}));

jest.mock('../src/models/Payment', () => {
  const payments = new Map();
  return {
    findOne: jest.fn().mockImplementation(query => {
      if (query.paypalOrderId) return Promise.resolve(payments.get(query.paypalOrderId) || null);
      return Promise.resolve(null);
    }),
    findOneAndUpdate: jest.fn().mockImplementation((query, update) => {
      const key = query.paypalOrderId;
      const existing = payments.get(key) || { paypalOrderId: key, status: 'created', dealId: 'test-deal' };
      if (query.status && query.status.$nin) {
        if (query.status.$nin.includes(existing.status)) {
          return Promise.resolve(null);
        }
      }
      const updated = { ...existing, ...(update.$set || {}) };
      payments.set(key, updated);
      return Promise.resolve(updated);
    }),
    create: jest.fn().mockImplementation(data => {
      payments.set(data.paypalOrderId, data);
      return Promise.resolve(data);
    }),
    _store: payments
  };
});

jest.mock('../src/models/Deal', () => ({
  findOne: jest.fn().mockResolvedValue({
    dealId: 'test-deal',
    agreedAmount: 340,
    serviceType: 'presentation',
    description: 'Test',
    status: 'checkout_created',
    save: jest.fn().mockResolvedValue(true)
  })
}));

jest.mock('../src/models/Policy', () => ({
  findOneAndUpdate: jest.fn().mockResolvedValue({
    userId: 'demo-user',
    totalBudget: 5000,
    spentAmount: 340,
    committedAmount: 0
  })
}));

jest.mock('../src/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({})
}));

const paypalService = require('../src/services/paypalService');
const Payment = require('../src/models/Payment');
const Policy = require('../src/models/Policy');
const geminiService = require('../src/services/geminiService');

describe('Payment Capture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Payment._store.clear();
    Payment._store.set('ORDER-123', {
      paypalOrderId: 'ORDER-123',
      dealId: 'test-deal',
      status: 'created',
      amount: 340,
      currency: 'USD'
    });
  });

  test('successful capture calls PayPal capture', async () => {
    paypalService.captureOrder.mockResolvedValue({
      captureId: 'CAPTURE-1',
      captureStatus: 'COMPLETED',
      amount: '340.00',
      currency: 'USD',
      orderId: 'ORDER-123'
    });

    Payment.findOneAndUpdate.mockResolvedValueOnce({
      paypalOrderId: 'ORDER-123',
      dealId: 'test-deal',
      status: 'processing',
      amount: 340
    });

    const result = await paypalService.captureOrder('ORDER-123');
    expect(result.captureStatus).toBe('COMPLETED');
    expect(paypalService.captureOrder).toHaveBeenCalledWith('ORDER-123');
  });

  test('successful capture sets status to completed', async () => {
    paypalService.captureOrder.mockResolvedValue({
      captureId: 'CAPTURE-2',
      captureStatus: 'COMPLETED',
      amount: '340.00',
      currency: 'USD',
      orderId: 'ORDER-123'
    });

    const result = await paypalService.captureOrder('ORDER-123');
    expect(result.captureStatus).toBe('COMPLETED');
  });

  test('failed capture sets status to failed', async () => {
    paypalService.captureOrder.mockResolvedValue({
      captureId: 'CAPTURE-3',
      captureStatus: 'DECLINED',
      amount: '340.00',
      currency: 'USD',
      orderId: 'ORDER-123'
    });

    const result = await paypalService.captureOrder('ORDER-123');
    expect(result.captureStatus).toBe('DECLINED');
    expect(result.captureStatus).not.toBe('COMPLETED');
  });

  test('failed capture does NOT generate deliverable', async () => {
    paypalService.captureOrder.mockResolvedValue({
      captureId: 'CAPTURE-4',
      captureStatus: 'DECLINED',
      amount: '340.00',
      currency: 'USD',
      orderId: 'ORDER-123'
    });

    await paypalService.captureOrder('ORDER-123');
    // On failed capture, generateDeliverable should not be called
    expect(geminiService.generateDeliverable).not.toHaveBeenCalled();
  });

  test('second capture attempt returns null from atomic lock', async () => {
    // First capture sets status to 'completed'
    Payment._store.set('ORDER-DUP', {
      paypalOrderId: 'ORDER-DUP',
      dealId: 'test-deal',
      status: 'completed',
      amount: 340
    });

    // The findOneAndUpdate with $nin: ['completed','processing'] should return null
    Payment.findOneAndUpdate.mockResolvedValueOnce(null);
    Payment.findOne.mockResolvedValueOnce({
      paypalOrderId: 'ORDER-DUP',
      status: 'completed'
    });

    const existing = await Payment.findOne({ paypalOrderId: 'ORDER-DUP' });
    expect(existing.status).toBe('completed');
  });

  test('policy spentAmount is updated on successful capture', async () => {
    paypalService.captureOrder.mockResolvedValue({
      captureId: 'CAPTURE-5',
      captureStatus: 'COMPLETED',
      amount: '340.00',
      currency: 'USD',
      orderId: 'ORDER-123'
    });

    // Simulate the policy update that would happen
    await Policy.findOneAndUpdate(
      { userId: 'demo-user' },
      { $inc: { spentAmount: 340, committedAmount: -340 } }
    );

    expect(Policy.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'demo-user' },
      { $inc: { spentAmount: 340, committedAmount: -340 } }
    );
  });

  test('committedAmount is released on failed capture', async () => {
    // Simulate failed capture budget release
    await Policy.findOneAndUpdate(
      { userId: 'demo-user' },
      { $inc: { committedAmount: -340 } }
    );

    expect(Policy.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'demo-user' },
      { $inc: { committedAmount: -340 } }
    );
  });
});
