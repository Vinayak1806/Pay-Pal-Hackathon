const { v4: uuid } = require('uuid');

// Module-level in-memory offer store keyed by taskId
const offerStore = new Map();

const sellerNames = {
  presentation: ['SlideForge AI', 'PitchMaster Pro', 'DeckCraft Studio'],
  research: ['InsightMiner AI', 'DataPulse Research', 'DeepDive Analytics'],
  website: ['WebWeave AI', 'PixelPerfect Studio', 'SiteCraft Pro'],
  content: ['ContentFlow AI', 'WordSmith Pro', 'NarrativeNinja'],
  design: ['DesignSpark AI', 'CreativeEdge Studio', 'ArtForge Pro']
};

const descriptions = {
  presentation: [
    'Professional slide deck with custom graphics, animations, and speaker notes. Includes 2 revision rounds.',
    'Premium presentation design with data visualization, infographics, and polished transitions. 3 revision rounds.',
    'Executive-level presentation with custom illustrations, brand alignment, and comprehensive speaker guide. Unlimited revisions.'
  ],
  research: [
    'Comprehensive market research with data analysis, trend identification, and actionable insights. 5-page report.',
    'In-depth competitor analysis with SWOT framework, market sizing, and strategic recommendations. 10-page report.',
    'Full-spectrum research brief with primary data collection, expert interviews, and detailed methodology. 15-page report.'
  ],
  website: [
    'Responsive landing page with SEO optimization, contact form, and analytics integration. Mobile-first design.',
    'Multi-page website with custom CMS, blog integration, and performance optimization. Includes 3 pages.',
    'Full-featured web application with user authentication, dashboard, and API integration. Includes 5 pages.'
  ],
  content: [
    'SEO-optimized content package including blog posts, social media copy, and email templates. 5 pieces.',
    'Comprehensive content strategy with editorial calendar, brand voice guide, and 10 content pieces.',
    'Full content ecosystem including video scripts, podcast outlines, social campaigns, and 15 written pieces.'
  ],
  design: [
    'Brand identity package with logo, color palette, typography guide, and basic stationery design.',
    'Complete visual design system with UI components, iconography, and detailed brand guidelines.',
    'Premium design package with full brand identity, marketing collateral, social media templates, and style guide.'
  ]
};

function getSellerOffers(parsedTask) {
  const serviceType = parsedTask.serviceType;
  const maxBudget = parsedTask.maxBudget;
  const taskId = parsedTask.taskId;

  const names = sellerNames[serviceType] || sellerNames.content;
  const descs = descriptions[serviceType] || descriptions.content;

  const priceMultipliers = [0.85, 1.00, 1.20];

  const offers = priceMultipliers.map((multiplier, index) => ({
    id: uuid(),
    taskId,
    sellerName: names[index],
    serviceType,
    description: descs[index],
    price: Math.round(maxBudget * multiplier * 100) / 100,
    deliveryTime: [`3-5 days`, `5-7 days`, `7-10 days`][index],
    rating: parseFloat((4.1 + Math.random() * 0.8).toFixed(1)),
    completedJobs: Math.floor(50 + Math.random() * 450)
  }));

  // Store offers server-side for verification
  offerStore.set(taskId, offers);

  return offers;
}

function verifyOffer(offerId, taskId) {
  const offers = offerStore.get(taskId);
  if (!offers) return null;
  return offers.find(o => o.id === offerId) || null;
}

function clearOfferStore() {
  offerStore.clear();
}

module.exports = {
  getSellerOffers,
  verifyOffer,
  clearOfferStore
};
