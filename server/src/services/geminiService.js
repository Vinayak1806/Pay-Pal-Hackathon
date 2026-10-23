const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let modelInstance = null;
let currentModelName = null;

function getModel() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!modelInstance || currentModelName !== modelName) {
    modelInstance = genAI.getGenerativeModel({ model: modelName });
    currentModelName = modelName;
  }
  return modelInstance;
}

function stripMarkdownFences(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  return cleaned.trim();
}

function stripHtmlTags(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
}

function sanitizeObject(obj) {
  if (typeof obj === 'string') return stripHtmlTags(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result;
  }
  return obj;
}

function truncateToSize(obj, maxChars = 10000) {
  const str = JSON.stringify(obj);
  if (str.length <= maxChars) return obj;
  const truncated = JSON.parse(str.substring(0, maxChars - 1) + '}');
  return truncated;
}

async function callGeminiWithTimeout(prompt, timeoutMs = 15000) {
  const model = getModel();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await model.generateContent(prompt, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.message && error.message.includes('404') ||
      error.message && error.message.includes('not found') ||
      error.status === 404) {
      console.warn(`Model ${currentModelName} not found. Retrying with gemini-2.5-flash...`);
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await fallbackModel.generateContent(prompt);
      const response = result.response;
      return response.text();
    }
    throw error;
  }
}

async function parseTask(userInput) {
  const prompt = `You are a task parser for an AI service marketplace. Parse the following user request and return ONLY a valid JSON object with no markdown, no code fences, no extra text:
{
  "serviceType": "(one of: presentation, research, website, content, design)",
  "requirements": "(array of exactly 3 to 5 specific strings)",
  "maxBudget": "(positive number in USD)",
  "urgency": "(one of: low, normal, high)",
  "reasoning": "(one sentence explaining your interpretation)"
}
User request: ${userInput}`;

  try {
    const text = await callGeminiWithTimeout(prompt);
    const cleaned = stripMarkdownFences(text);
    const parsed = JSON.parse(cleaned);

    const validTypes = ['presentation', 'research', 'website', 'content', 'design'];
    if (!validTypes.includes(parsed.serviceType)) {
      throw new Error(`Invalid serviceType: ${parsed.serviceType}`);
    }
    if (typeof parsed.maxBudget === 'string') {
      parsed.maxBudget = parseFloat(parsed.maxBudget.replace(/[^0-9.]/g, ''));
    }

    // Safety check: if userInput explicitly specifies a budget (e.g. $850 or budget 850), ensure it is respected
    const explicitBudgetMatch = userInput.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/) || userInput.match(/budget\s*(?:of|is|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (explicitBudgetMatch) {
      const explicitVal = parseFloat((explicitBudgetMatch[1] || explicitBudgetMatch[2]).replace(/,/g, ''));
      if (explicitVal > 0 && (!parsed.maxBudget || parsed.maxBudget <= 10 || Math.abs(parsed.maxBudget - explicitVal) > 50)) {
        parsed.maxBudget = explicitVal;
      }
    }

    if (typeof parsed.maxBudget !== 'number' || isNaN(parsed.maxBudget) || parsed.maxBudget <= 0) {
      throw new Error(`Invalid maxBudget: ${parsed.maxBudget}`);
    }
    if (!Array.isArray(parsed.requirements) || parsed.requirements.length < 3 || parsed.requirements.length > 5) {
      throw new Error(`Requirements must have 3-5 items, got ${parsed.requirements?.length}`);
    }
    const validUrgency = ['low', 'normal', 'high'];
    if (!validUrgency.includes(parsed.urgency)) {
      parsed.urgency = 'normal';
    }
    if (!parsed.reasoning) {
      parsed.reasoning = 'Task parsed successfully.';
    }

    return { data: sanitizeObject(parsed), source: 'gemini' };
  } catch (error) {
    console.warn('Gemini parseTask failed, using fallback:', error.message);
    return fallbackParseTask(userInput);
  }
}

function fallbackParseTask(userInput) {
  const input = userInput.toLowerCase();
  let serviceType = 'content';

  if (input.includes('presentation') || input.includes('slide') || input.includes('pitch') || input.includes('deck')) {
    serviceType = 'presentation';
  } else if (input.includes('microservice') || input.includes('website') || input.includes('landing page') || input.includes('web') || input.includes('architect') || input.includes('backend') || input.includes('api') || input.includes('app')) {
    serviceType = 'website';
  } else if (input.includes('research') || input.includes('competitor') || input.includes('analysis') || input.includes('audit') || input.includes('security') || input.includes('compliance')) {
    serviceType = 'research';
  } else if (input.includes('design') || input.includes('logo') || input.includes('brand') || input.includes('ui') || input.includes('ux')) {
    serviceType = 'design';
  }

  const budgetMatch = userInput.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/) || userInput.match(/budget\s*(?:of|is|:)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  const maxBudget = budgetMatch ? parseFloat((budgetMatch[1] || budgetMatch[2]).replace(/,/g, '')) : 500;

  const requirementMap = {
    presentation: ['10-slide standard pitch structure', 'Problem-solution-impact storytelling', 'Visual branding & speaker delivery notes'],
    research: ['Comprehensive competitor SWOT benchmarking', 'Zero-Trust security & policy compliance audit', 'Actionable tabular intelligence dossier'],
    website: ['High-concurrency microservice architecture', 'PayPal Orders v2 escrow checkout integration', 'Tamper-evident SHA-256 audit ledger'],
    content: ['Engaging written technical documentation', 'Target audience alignment & positioning', 'Brand voice consistency & developer guides'],
    design: ['Creative visual component design system', 'Brand identity elements & Figma tokens', 'WCAG 2.1 accessible high-resolution exports']
  };

  return {
    data: {
      serviceType,
      requirements: requirementMap[serviceType],
      maxBudget,
      urgency: 'normal',
      reasoning: `Deterministic parser: extracted "${serviceType}" service category with budget $${maxBudget} based on request parameters.`
    },
    source: 'fallback'
  };
}

async function compareOffers(parsedTask, offers) {
  const offerSummary = offers.map(o => ({
    id: o.id,
    price: o.price,
    deliveryTime: o.deliveryTime,
    rating: o.rating
  }));

  const requirementsList = Array.isArray(parsedTask?.requirements)
    ? parsedTask.requirements.join(', ')
    : 'Professional deliverables';
  const budget = Number(parsedTask?.maxBudget) || 500;

  const prompt = `You are a procurement advisor for an AI marketplace.
The buyer needs: ${requirementsList}.
Budget: $${budget}.
Compare these offers and return ONLY a valid JSON object with no markdown, no code fences, no extra text:
{
  "recommendedOfferId": "(must be one of the offer IDs below)",
  "reasoning": "(2-3 sentences covering price, quality, delivery, and fit for requirements)",
  "tradeoffs": "(one sentence about what is compromised)"
}
Offers: ${JSON.stringify(offerSummary)}`;

  try {
    const text = await callGeminiWithTimeout(prompt);
    const cleaned = stripMarkdownFences(text);
    const parsed = JSON.parse(cleaned);

    const validIds = offers.map(o => o.id);
    if (!validIds.includes(parsed.recommendedOfferId)) {
      console.warn('Gemini recommended invalid offer ID, falling back to cheapest');
      const cheapest = offers.reduce((min, o) => o.price < min.price ? o : min, offers[0]);
      parsed.recommendedOfferId = cheapest.id;
    }

    return { data: sanitizeObject(parsed), source: 'gemini' };
  } catch (error) {
    console.warn('Gemini compareOffers failed, using fallback:', error.message);
    const fallbackOffer = (offers && offers.length > 0)
      ? offers.reduce((min, o) => o.price < min.price ? o : min, offers[0])
      : { id: 'offer-fallback', sellerName: 'SpendMesh Agent', price: budget, rating: 4.8, deliveryTime: '3-5 days' };

    return {
      data: {
        recommendedOfferId: fallbackOffer.id,
        reasoning: `Fallback recommendation: Selected ${fallbackOffer.sellerName} as the most cost-effective option at $${fallbackOffer.price}, which is within the budget of $${budget}. This offer provides good value with a ${fallbackOffer.rating} rating and ${fallbackOffer.deliveryTime} delivery.`,
        tradeoffs: 'Lower price may mean fewer revisions or less customization compared to premium offers.'
      },
      source: 'fallback'
    };
  }
}

async function generateDeliverable(serviceType, requirements) {
  const requirementsText = Array.isArray(requirements) ? requirements.join(', ') : requirements;
  let prompt = '';

  switch (serviceType) {
    case 'presentation':
      prompt = `Create a 10-slide professional presentation outline.
Topic: ${requirementsText}. Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "title": "string",
  "slides": [{ "slideNumber": 1, "title": "string", "bulletPoints": ["string"] }]
}
Generate exactly 10 slides.`;
      break;

    case 'research':
      prompt = `Write a structured research brief.
Topic: ${requirementsText}. Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "title": "string",
  "summary": "string (3 sentences)",
  "keyFindings": ["exactly 5 strings"],
  "recommendations": ["exactly 3 strings"]
}`;
      break;

    case 'website':
      prompt = `Create website copy.
Purpose: ${requirementsText}. Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "siteName": "string",
  "heroHeadline": "string",
  "heroSubtext": "string",
  "sections": [{ "sectionName": "string", "content": "string" }]
}
Generate at least 4 sections.`;
      break;

    case 'content':
      prompt = `Create content strategy deliverable.
Topic: ${requirementsText}. Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "title": "string",
  "description": "string (2-3 sentences)",
  "keyElements": [{ "element": "string", "details": "string" }]
}
Generate at least 5 key elements.`;
      break;

    case 'design':
      prompt = `Create a design brief deliverable.
Project: ${requirementsText}. Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "title": "string",
  "description": "string (2-3 sentences)",
  "keyElements": [{ "element": "string", "details": "string" }]
}
Generate at least 5 key elements.`;
      break;

    default:
      return {
        data: {
          title: 'Deliverable',
          description: `Service deliverable for ${serviceType}`,
          keyElements: [{ element: 'Deliverable', details: 'Completed successfully' }]
        },
        source: 'fallback'
      };
  }

  try {
    const text = await callGeminiWithTimeout(prompt);
    const cleaned = stripMarkdownFences(text);
    let parsed = JSON.parse(cleaned);
    parsed = sanitizeObject(parsed);
    parsed = truncateToSize(parsed, 10000);

    return { data: parsed, source: 'gemini' };
  } catch (error) {
    console.warn('Gemini generateDeliverable failed, using fallback:', error.message);
    return generateFallbackDeliverable(serviceType, requirements);
  }
}

function generateFallbackDeliverable(serviceType, requirements) {
  const reqText = Array.isArray(requirements) ? requirements.join(', ') : requirements;

  const deliverables = {
    presentation: {
      title: `Presentation: ${reqText.substring(0, 50)}`,
      slides: Array.from({ length: 10 }, (_, i) => ({
        slideNumber: i + 1,
        title: [
          'Title Slide', 'Problem Statement', 'Market Opportunity',
          'Our Solution', 'Key Features', 'Technology Stack',
          'Business Model', 'Competitive Advantage', 'Roadmap', 'Call to Action'
        ][i],
        bulletPoints: [
          `Key point about ${reqText.substring(0, 30)}`,
          'Supporting data and evidence',
          'Impact and implications'
        ]
      }))
    },
    research: {
      title: `Research Brief: ${reqText.substring(0, 50)}`,
      summary: `This research brief examines ${reqText}. The analysis covers market trends, competitive landscape, and strategic opportunities. Key findings are supported by industry data and expert insights.`,
      keyFindings: [
        `The market for ${reqText.substring(0, 30)} is growing at 15% annually`,
        'Key competitors are focusing on AI-driven solutions',
        'Customer demand for integrated platforms is increasing',
        'Regulatory frameworks are evolving to support innovation',
        'Early movers in this space have seen 3x returns on investment'
      ],
      recommendations: [
        'Prioritize AI integration in core product offerings',
        'Establish strategic partnerships with industry leaders',
        'Invest in scalable infrastructure for long-term growth'
      ]
    },
    website: {
      siteName: reqText.substring(0, 30),
      heroHeadline: `Transform Your Business with ${reqText.substring(0, 20)}`,
      heroSubtext: 'The next generation platform built for modern teams.',
      sections: [
        { sectionName: 'Features', content: `Our platform offers cutting-edge features designed for ${reqText}.` },
        { sectionName: 'Benefits', content: 'Increase productivity, reduce costs, and scale effortlessly.' },
        { sectionName: 'Testimonials', content: 'Trusted by thousands of businesses worldwide.' },
        { sectionName: 'Pricing', content: 'Flexible plans that grow with your business needs.' }
      ]
    },
    content: {
      title: `Content Strategy: ${reqText.substring(0, 50)}`,
      description: `A comprehensive content strategy framework for ${reqText}. This deliverable outlines key content pillars, target audience segments, and distribution channels.`,
      keyElements: [
        { element: 'Content Pillars', details: 'Thought leadership, product education, community engagement' },
        { element: 'Target Audience', details: 'Decision makers, technical users, early adopters' },
        { element: 'Distribution Channels', details: 'Blog, social media, email newsletters, webinars' },
        { element: 'Content Calendar', details: 'Monthly themes aligned with product launches and industry events' },
        { element: 'Metrics & KPIs', details: 'Engagement rate, conversion rate, organic traffic growth' }
      ]
    },
    design: {
      title: `Design Brief: ${reqText.substring(0, 50)}`,
      description: `A design direction document for ${reqText}. This brief covers visual identity, user interface guidelines, and brand consistency standards.`,
      keyElements: [
        { element: 'Visual Identity', details: 'Modern, clean aesthetic with bold typography and vibrant accents' },
        { element: 'Color Palette', details: 'Primary blue (#2563EB), supporting neutrals, success green, warning amber' },
        { element: 'Typography', details: 'Inter for headings, system fonts for body text, clear hierarchy' },
        { element: 'Component Library', details: 'Buttons, cards, modals, forms, navigation patterns' },
        { element: 'Responsive Design', details: 'Mobile-first approach with breakpoints at 640px, 768px, 1024px, 1280px' }
      ]
    }
  };

  return {
    data: deliverables[serviceType] || deliverables.content,
    source: 'fallback'
  };
}

async function answerAssistantQuery(query, context = {}) {
  const { policy, currentDeal, currentPath } = context;

  const total = Number(policy?.totalBudget) || 5000;
  const spent = Number(policy?.spentAmount) || 0;
  const committed = Number(policy?.committedAmount) || 0;
  const remaining = Math.max(0, total - spent - committed);

  const prompt = `You are SpendMesh AI Financial Security Guide.
Give an ultra-short, crisp 1-sentence answer (maximum 16 words) suitable for speech audio.
Never use markdown asterisks, bolding, bullet points, or emoji. Be direct, authoritative, and clear.

Context:
- Current Page: ${currentPath || '/'}
- Remaining budget: $${remaining.toFixed(2)}
- Spent: $${spent.toFixed(2)}
- Auto-approve limit: $${policy?.autoApproveLimit || 1000}
${currentDeal ? `- Current deal: $${currentDeal.agreedAmount || currentDeal.price} with ${currentDeal.sellerName || currentDeal.sellerAgent}` : ''}

User Question: "${query}"

1-sentence answer:`;

  try {
    const raw = await callGeminiWithTimeout(prompt, 3500);
    const cleaned = stripHtmlTags(raw).replace(/[*_#`~]/g, '').trim();
    return {
      success: true,
      response: cleaned,
      source: 'gemini'
    };
  } catch (error) {
    console.warn('Gemini assistant query fallback:', error.message);
    const q = (query || '').toLowerCase();
    const path = currentPath || '/';

    if (q.includes('escrow') || q.includes('paypal')) {
      return {
        success: true,
        response: `SpendMesh reserves treasury funds server-side and settles payment securely via PayPal Orders v2 upon delivery.`,
        source: 'fallback'
      };
    }
    if (q.includes('approv')) {
      return {
        success: true,
        response: `Transactions over $${policy?.autoApproveLimit || 1000} require human approval in the Approvals queue.`,
        source: 'fallback'
      };
    }
    if (q.includes('next') || q.includes('do') || q.includes('step')) {
      if (path.includes('requests') || path.includes('marketplace')) {
        return {
          success: true,
          response: `Submit your procurement requirements and compare competing agent bids within policy limits.`,
          source: 'fallback'
        };
      }
      if (path.includes('approvals')) {
        return {
          success: true,
          response: `Review pending deals and authorize PayPal checkout for approved work.`,
          source: 'fallback'
        };
      }
      if (path.includes('success')) {
        return {
          success: true,
          response: `Your PayPal payment is settled. Download your deliverable or view the compliance receipt.`,
          source: 'fallback'
        };
      }
      return {
        success: true,
        response: `Submit a purchase request or review your treasury balance in the dashboard.`,
        source: 'fallback'
      };
    }
    return {
      success: true,
      response: `You have $${remaining.toFixed(2)} available budget with a $${policy?.autoApproveLimit || 1000} auto-approval limit.`,
      source: 'fallback'
    };
  }
}

module.exports = {
  parseTask,
  compareOffers,
  generateDeliverable,
  answerAssistantQuery
};
