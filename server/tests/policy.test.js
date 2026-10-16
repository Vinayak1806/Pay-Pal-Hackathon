const { validateDeal } = require('../src/services/policyEngine');

// Mock the Payment model
jest.mock('../src/models/Payment', () => ({
  findOne: jest.fn()
}));

// Mock the AuditLog model
jest.mock('../src/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({})
}));

const Payment = require('../src/models/Payment');

describe('Policy Engine', () => {
  const defaultPolicy = {
    userId: 'demo-user',
    totalBudget: 5000,
    spentAmount: 0,
    committedAmount: 0,
    autoApproveLimit: 1000,
    allowedServices: ['presentation', 'research', 'website', 'content', 'design']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Payment.findOne.mockResolvedValue(null);
  });

  test('valid deal within budget passes all checks', async () => {
    const deal = {
      dealId: 'test-deal-1',
      agreedAmount: 500,
      currency: 'USD',
      serviceType: 'presentation'
    };

    const result = await validateDeal(deal, defaultPolicy);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('APPROVED');
  });

  test('deal exceeding totalBudget returns BUDGET_EXCEEDED', async () => {
    const deal = {
      dealId: 'test-deal-2',
      agreedAmount: 6000,
      currency: 'USD',
      serviceType: 'presentation'
    };

    const result = await validateDeal(deal, defaultPolicy);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('BUDGET_EXCEEDED');
  });

  test('deal above autoApproveLimit returns APPROVAL_REQUIRED', async () => {
    const deal = {
      dealId: 'test-deal-3',
      agreedAmount: 1500,
      currency: 'USD',
      serviceType: 'presentation'
    };

    const result = await validateDeal(deal, defaultPolicy);
    expect(result.allowed).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.reason).toBe('APPROVAL_REQUIRED');
  });

  test('disallowed service type returns SERVICE_NOT_ALLOWED', async () => {
    const policy = { ...defaultPolicy, allowedServices: ['research'] };
    const deal = {
      dealId: 'test-deal-4',
      agreedAmount: 500,
      currency: 'USD',
      serviceType: 'presentation'
    };

    const result = await validateDeal(deal, policy);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SERVICE_NOT_ALLOWED');
  });

  test('negative amount returns INVALID_AMOUNT', async () => {
    const deal = {
      dealId: 'test-deal-5',
      agreedAmount: -100,
      currency: 'USD',
      serviceType: 'presentation'
    };

    const result = await validateDeal(deal, defaultPolicy);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('INVALID_AMOUNT');
  });

  test('non-USD currency returns INVALID_AMOUNT', async () => {
    const deal = {
      dealId: 'test-deal-6',
      agreedAmount: 500,
      currency: 'EUR',
      serviceType: 'presentation'
    };

    const result = await validateDeal(deal, defaultPolicy);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('INVALID_AMOUNT');
  });

  test('deal with existing completed payment returns DUPLICATE_PAYMENT', async () => {
    Payment.findOne.mockResolvedValue({ dealId: 'test-deal-7', status: 'completed' });
    const deal = {
      dealId: 'test-deal-7',
      agreedAmount: 500,
      currency: 'USD',
      serviceType: 'presentation'
    };

    const result = await validateDeal(deal, defaultPolicy);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('DUPLICATE_PAYMENT');
  });
});
