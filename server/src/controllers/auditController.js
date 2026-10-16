const AuditLog = require('../models/AuditLog');

async function getAuditLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.dealId) {
      filter.dealId = req.query.dealId;
    }
    if (req.query.eventType) {
      filter.eventType = req.query.eventType;
    }
    if (req.query.outcome) {
      filter.outcome = req.query.outcome;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs
};
