require('dotenv').config();

// ─── Environment Validation ───────────────────────────────────────
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

const requiredVars = [
  'MONGODB_URI',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_BASE_URL',
  'GEMINI_API_KEY',
  'CLIENT_URL'
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('──────────────────────────────────────────────');
  console.error('FATAL: Missing required environment variables:');
  missing.forEach(v => console.error(`  • ${v}`));
  console.error('──────────────────────────────────────────────');
  console.error('Copy server/.env.example to server/.env and fill in all values.');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const agentRoutes = require('./routes/agentRoutes');
const dealRoutes = require('./routes/dealRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const policyRoutes = require('./routes/policyRoutes');
const auditRoutes = require('./routes/auditRoutes');

// Model imports for demo reset
const Deal = require('./models/Deal');
const Payment = require('./models/Payment');
const AuditLog = require('./models/AuditLog');
const Policy = require('./models/Policy');
const { clearOfferStore } = require('./agents/sellerAgents');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware (applied in order) ───────────────────────
// 1. Security headers
app.use(helmet());

// 2. CORS — allow configured frontend URL(s) and Vercel deployments
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      configuredOrigins.length === 0 ||
      configuredOrigins.includes(origin) ||
      configuredOrigins.includes('*') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// 3. Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// 4. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 3000,
  skip: (req) => req.path === '/api/health',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' }
  }
});
app.use(limiter);

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/agents', agentRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/audit', auditRoutes);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── Demo Reset ───────────────────────────────────────────────────
app.post('/api/demo/reset', async (req, res, next) => {
  try {
    // Check for active checkouts
    const activeCheckouts = await Deal.countDocuments({ status: 'checkout_created' });
    if (activeCheckouts > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Delete all demo data
    await Promise.all([
      Deal.deleteMany({}),
      Payment.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // Reset policy
    await Policy.findOneAndUpdate(
      { userId: 'demo-user' },
      {
        $set: {
          totalBudget: 5000,
          spentAmount: 0,
          committedAmount: 0,
          autoApproveLimit: 1000,
          allowedServices: ['presentation', 'research', 'website', 'content', 'design']
        }
      },
      { upsert: true, new: true }
    );

    // Clear in-memory offer store
    clearOfferStore();

    res.json({
      success: true,
      data: {
        message: 'Demo reset complete',
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─── Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ─── Database Connection and Server Start ─────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    // Ensure default policy exists
    return Policy.findOneAndUpdate(
      { userId: 'demo-user' },
      { $setOnInsert: { userId: 'demo-user' } },
      { upsert: true, new: true }
    );
  })
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CORS origin: ${process.env.CLIENT_URL}`);
      console.log(`Gemini model: ${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

module.exports = app;
