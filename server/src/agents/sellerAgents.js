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
    '10-slide structured presentation with clear problem-solution narrative, custom graphics, and speaker delivery notes. Includes 2 revision rounds.',
    'Executive Series A/B Investment Pitch Deck with institutional market traction slides, unit economics modeling, and 3D visual assets. 3 revision rounds.',
    'Enterprise Corporate Strategy Keynote: Complete brand design system, interactive financial projections, and high-resolution vector exports. Unlimited revisions.'
  ],
  research: [
    'Comprehensive market analysis with primary data modeling, competitor matrix, trend identification, and actionable roadmap. 10-page dossier.',
    'Deep-dive competitor intelligence dossier: SWOT benchmarking, feature parity analysis, and TAM/SAM/SOM financial valuation models. 15-page dossier.',
    'Zero-Trust Security & PCI-DSS Compliance Audit: Automated penetration testing, OWASP Top 10 API vulnerability assessment, and cryptographic audit report.'
  ],
  website: [
    'Full-Stack SaaS MVP with responsive Tailwind UI, Node.js backend, authenticated dashboard, and PayPal/Stripe checkout. Includes unit tests & deployment guide.',
    'Enterprise FinTech Web Application featuring high-concurrency microservices, PayPal Orders v2 escrow checkout, Redis caching, and real-time WebSockets.',
    'Cloud-Native Production Architecture: Multi-tenant SaaS with Docker/Kubernetes manifests, automated CI/CD pipeline, and 99.99% SLA benchmark.'
  ],
  content: [
    'Comprehensive enterprise content strategy with technical whitepapers, developer documentation, and SEO keyword integration. 5 key deliverables.',
    'Full-funnel B2B content ecosystem: Interactive case studies, product documentation, landing page copy, and automated email onboarding sequences.',
    'Multi-channel investor & enterprise communication suite: Press releases, thought leadership articles, and executive briefing dossiers.'
  ],
  design: [
    'Complete design system with Figma component tokens, accessible WCAG 2.1 contrast guidelines, and responsive desktop/mobile UI library.',
    'Enterprise brand identity: High-fidelity vector logos, design tokens, multi-platform style guide, and developer handoff specs.',
    'Full product UX/UI overhaul: Interactive prototype, micro-interaction states, design tokens export, and user testing synthesis.'
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
