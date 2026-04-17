require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { WebSocketServer } = require('ws');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { connectDB } = require('./utils/db');
const { connectRedis } = require('./utils/redis');

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const scanRoutes = require('./routes/scans');
const osintRoutes = require('./routes/osint');
const threatsRoutes = require('./routes/threats');
const combined = require('./routes/combined');
const { 
  assetsRouter: assetsRoutes, 
  incidentsRouter: incidentsRoutes,
  risksRouter: risksRoutes,
  dashboardRouter: dashboardRoutes,
  reportsRouter: reportsRoutes,
  auditsRouter: auditsRoutes,
  assuranceRouter: assuranceRoutes,
  analyticsRouter: analyticsRoutes,
  advisoryRouter: advisoryRoutes,
  intelRouter: intelRoutes,
  feedsRouter: feedsRoutes,
  teamsRouter: teamRoutes,
  complianceRouter: complianceRoutes,
  auditRouter: auditRoutes
} = combined;
const portalRoutes = require('./routes/portalData');

const app = express();
const server = http.createServer(app);

// ── WebSocket Server (real-time scan updates) ─────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Map();

wss.on('connection', (ws, req) => {
  const id = req.url.split('token=')[1];
  if (id) wsClients.set(id, ws);
  ws.on('close', () => wsClients.delete(id));
  ws.send(JSON.stringify({ type: 'connected', msg: 'Chayil SecureX Real-time connected' }));
});

// Export for use in workers
app.locals.wsClients = wsClients;
global.wsClients = wsClients;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ── Global Rate Limiter ───────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  message: { error: 'Too many requests. Please try again later.' },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
const contactRoutes = require('./routes/contact');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/osint', osintRoutes);
app.use('/api/threats', threatsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/risks', risksRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/assurance', assuranceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/intel', intelRoutes);


// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Chayil SecureX API', version: '2.0.0', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── SERVICES & WORKERS ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production' || process.env.USE_DOCKER === 'true') {
  require('./workers/scanWorker');
}

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await connectRedis();
  server.listen(PORT, () => {
    logger.info(`🔐 Chayil SecureX API running on http://localhost:${PORT}`);
    logger.info(`📡 WebSocket server on ws://localhost:${PORT}/ws`);
  });
}

start().catch(err => { logger.error('Startup failed:', err); process.exit(1); });

module.exports = { app, wss, wsClients };
