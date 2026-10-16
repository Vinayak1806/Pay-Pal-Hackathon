// Mock Gemini before requiring agents
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            serviceType: 'presentation',
            requirements: ['Professional slides', 'Data visualization', 'Speaker notes'],
            maxBudget: 400,
            urgency: 'normal',
            reasoning: 'Test task parsed successfully.'
          })
        }
      })
    })
  }))
}));

jest.mock('../src/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({})
}));

const sellerAgents = require('../src/agents/sellerAgents');
const geminiService = require('../src/services/geminiService');

describe('Seller Agents', () => {
  test('getSellerOffers returns exactly 3 offers', () => {
    const parsedTask = {
      taskId: 'test-task-1',
      serviceType: 'presentation',
      maxBudget: 400,
      requirements: ['Slides', 'Graphics', 'Notes']
    };

    const offers = sellerAgents.getSellerOffers(parsedTask);
    expect(offers).toHaveLength(3);
  });

  test('all 3 offer prices differ from each other', () => {
    const parsedTask = {
      taskId: 'test-task-2',
      serviceType: 'research',
      maxBudget: 1000,
      requirements: ['Analysis', 'Report', 'Insights']
    };

    const offers = sellerAgents.getSellerOffers(parsedTask);
    const prices = offers.map(o => o.price);
    const uniquePrices = new Set(prices);
    expect(uniquePrices.size).toBe(3);
  });

  test('verifyOffer returns null for unknown offerId', () => {
    const result = sellerAgents.verifyOffer('non-existent-id', 'non-existent-task');
    expect(result).toBeNull();
  });

  test('verifyOffer returns offer for valid offerId and taskId', () => {
    const parsedTask = {
      taskId: 'test-task-3',
      serviceType: 'website',
      maxBudget: 500,
      requirements: ['Landing page', 'SEO', 'Mobile']
    };

    const offers = sellerAgents.getSellerOffers(parsedTask);
    const result = sellerAgents.verifyOffer(offers[0].id, 'test-task-3');
    expect(result).not.toBeNull();
    expect(result.id).toBe(offers[0].id);
  });
});

describe('Gemini Service', () => {
  test('parseTask returns valid structured output', async () => {
    const result = await geminiService.parseTask('Create a presentation about AI, budget $400');
    expect(result.data).toHaveProperty('serviceType');
    expect(result.data).toHaveProperty('requirements');
    expect(result.data).toHaveProperty('maxBudget');
    expect(result.source).toBeDefined();
  });

  test('compareOffers recommendedOfferId is in offers array', async () => {
    const parsedTask = {
      requirements: ['Quality slides', 'Data viz'],
      maxBudget: 400
    };
    const offers = [
      { id: 'offer-1', price: 340, deliveryTime: '3 days', rating: 4.5, sellerName: 'Test1' },
      { id: 'offer-2', price: 400, deliveryTime: '5 days', rating: 4.7, sellerName: 'Test2' },
      { id: 'offer-3', price: 480, deliveryTime: '7 days', rating: 4.9, sellerName: 'Test3' }
    ];

    const result = await geminiService.compareOffers(parsedTask, offers);
    const validIds = offers.map(o => o.id);
    expect(validIds).toContain(result.data.recommendedOfferId);
  });
});

describe('Fallback Parser', () => {
  test('fallback returns source:fallback when Gemini is unavailable', async () => {
    // Override the mock to simulate failure
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API unavailable'))
      })
    }));

    // Clear module cache to use new mock
    jest.resetModules();
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('API unavailable'))
        })
      }))
    }));
    jest.mock('../src/models/AuditLog', () => ({
      create: jest.fn().mockResolvedValue({})
    }));

    const freshGemini = require('../src/services/geminiService');
    const result = await freshGemini.parseTask('Create a presentation about AI, budget $400');
    expect(result.source).toBe('fallback');
    expect(result.data.serviceType).toBe('presentation');
  });
});
