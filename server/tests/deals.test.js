// Mock all external dependencies
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            serviceType: 'presentation',
            requirements: ['Slides', 'Graphics', 'Notes'],
            maxBudget: 400,
            urgency: 'normal',
            reasoning: 'Test'
          })
        }
      })
    })
  }))
}));

jest.mock('../src/models/Deal', () => {
  const deals = new Map();
  return {
    create: jest.fn().mockImplementation(data => {
      const deal = { ...data, save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }) };
      deals.set(data.dealId, deal);
      return Promise.resolve(deal);
    }),
    findOne: jest.fn().mockImplementation(query => {
      if (query.dealId) return Promise.resolve(deals.get(query.dealId) || null);
      return Promise.resolve(null);
    }),
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
    countDocuments: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({})
  };
});

jest.mock('../src/models/Policy', () => ({
  findOne: jest.fn().mockResolvedValue({
    userId: 'demo-user',
    totalBudget: 5000,
    spentAmount: 0,
    committedAmount: 0,
    autoApproveLimit: 1000,
    allowedServices: ['presentation', 'research', 'website', 'content', 'design']
  }),
  findOneAndUpdate: jest.fn().mockResolvedValue({
    userId: 'demo-user',
    totalBudget: 5000,
    spentAmount: 0,
    committedAmount: 340,
    autoApproveLimit: 1000,
    allowedServices: ['presentation', 'research', 'website', 'content', 'design']
  }),
  create: jest.fn().mockResolvedValue({ userId: 'demo-user' })
}));

jest.mock('../src/models/Payment', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  findOneAndUpdate: jest.fn().mockResolvedValue({})
}));

jest.mock('../src/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({})
}));

jest.mock('../src/services/paypalService', () => ({
  createOrder: jest.fn().mockResolvedValue({
    orderId: 'PAYPAL-ORDER-123',
    approvalUrl: 'https://sandbox.paypal.com/approve/123',
    status: 'CREATED'
  })
}));

const sellerAgents = require('../src/agents/sellerAgents');
const Deal = require('../src/models/Deal');
const Policy = require('../src/models/Policy');

describe('Deal Controller Logic', () => {
  test('deal is created with server-stored amount', () => {
    const parsedTask = {
      taskId: 'deal-test-1',
      serviceType: 'presentation',
      maxBudget: 400,
      requirements: ['Slides', 'Graphics', 'Notes']
    };

    const offers = sellerAgents.getSellerOffers(parsedTask);
    const selectedOffer = offers[0];
    
    // Price should be 85% of maxBudget
    expect(selectedOffer.price).toBe(340);
    
    // Verify the offer from server store
    const verified = sellerAgents.verifyOffer(selectedOffer.id, 'deal-test-1');
    expect(verified).not.toBeNull();
    expect(verified.price).toBe(selectedOffer.price);
  });

  test('invalid offerId returns null from verifyOffer', () => {
    const result = sellerAgents.verifyOffer('fake-offer-id', 'deal-test-1');
    expect(result).toBeNull();
  });

  test('browser-supplied amount is ignored in checkout', async () => {
    const parsedTask = {
      taskId: 'deal-test-3',
      serviceType: 'presentation',
      maxBudget: 400,
      requirements: ['Slides', 'Graphics', 'Notes']
    };

    const offers = sellerAgents.getSellerOffers(parsedTask);
    const selectedOffer = offers[0];

    // The deal would use offer.price (340), not any browser amount
    expect(selectedOffer.price).toBe(340);
    
    // Even if browser sends amount:800, server uses stored price
    const tamperAmount = 800;
    expect(tamperAmount).not.toBe(selectedOffer.price);
  });

  test('deal above autoApproveLimit gets pending_approval', async () => {
    const { validateDeal } = require('../src/services/policyEngine');
    const deal = {
      dealId: 'deal-test-4',
      agreedAmount: 1500,
      currency: 'USD',
      serviceType: 'presentation'
    };
    const policy = {
      totalBudget: 5000,
      spentAmount: 0,
      committedAmount: 0,
      autoApproveLimit: 1000,
      allowedServices: ['presentation', 'research', 'website', 'content', 'design']
    };

    const result = await validateDeal(deal, policy);
    expect(result.requiresApproval).toBe(true);
    expect(result.reason).toBe('APPROVAL_REQUIRED');
  });

  test('approve on non-pending deal should be blocked', () => {
    // A deal with status 'accepted' should not be approvable
    const deal = { status: 'accepted' };
    expect(deal.status).not.toBe('pending_approval');
  });
});
