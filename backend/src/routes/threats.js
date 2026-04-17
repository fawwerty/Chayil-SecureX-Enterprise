/**
 * Chayil SecureX — Threat Intelligence Routes
 * Live IOC feeds, threat enrichment, VirusTotal, AbuseIPDB
 */
const router = require('express').Router();
const axios = require('axios');
const { query } = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// ── GET /api/threats ───────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { type, severity, limit = 50, offset = 0 } = req.query;
  let sql = `SELECT * FROM threat_iocs WHERE org_id=$1 OR org_id IS NULL`;
  const params = [req.user.org_id];
  if (type) { sql += ` AND type=$${params.length+1}`; params.push(type); }
  if (severity) { sql += ` AND severity=$${params.length+1}`; params.push(severity); }
  sql += ` ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
  params.push(limit, offset);
  try {
    const r = await query(sql, params);
    res.json({ iocs: r.rows, total: r.rows.length });
  } catch { res.json({ iocs: [], total: 0 }); }
});

// ── POST /api/threats/ioc ──────────────────────────────────
router.post('/ioc', authenticate, authorize('admin','analyst'), async (req, res) => {
  const { value, type, severity, tags, description } = req.body;
  if (!value || !type) return res.status(400).json({ error: 'Value and type required' });
  const validTypes = ['ip','domain','url','hash','email'];
  if (!validTypes.includes(type)) return res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
  try {
    const r = await query(
      `INSERT INTO threat_iocs (org_id, value, type, severity, tags, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.org_id, value.trim(), type, severity||'medium', tags||[], description||'', req.user.id]
    );
    res.status(201).json({ ioc: r.rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'IOC already exists' });
    res.status(500).json({ error: 'Failed to create IOC' });
  }
});

// ── POST /api/threats/check ────────────────────────────────
router.post('/check', authenticate, async (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: 'Value required' });
  const v = value.trim().toLowerCase();

  // Check local IOC DB first
  try {
    const r = await query(
      `SELECT * FROM threat_iocs WHERE LOWER(value)=$1 LIMIT 1`, [v]
    );
    if (r.rows.length > 0) return res.json({ found: true, ioc: r.rows[0], source: 'local_db' });
  } catch {}

  // Check external APIs
  const vtKey = process.env.VIRUSTOTAL_API_KEY;
  const abuseKey = process.env.ABUSEIPDB_API_KEY;
  let external = { found: false, sources: [] };

  if (vtKey && vtKey !== 'your_virustotal_key') {
    try {
      const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(v);
      const isDomain = !isIP && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(v);
      const isHash = /^[a-f0-9]{32,64}$/.test(v);
      const endpoint = isIP ? `/ip_addresses/${v}` : isDomain ? `/domains/${v}` : isHash ? `/files/${v}` : null;
      if (endpoint) {
        const r = await axios.get(`https://www.virustotal.com/api/v3${endpoint}`, {
          headers: { 'x-apikey': vtKey }, timeout: 6000
        });
        const stats = r.data.data?.attributes?.last_analysis_stats || {};
        if (stats.malicious >= 1) {
          external.found = true;
          external.sources.push({ source: 'virustotal', malicious: stats.malicious, total: Object.values(stats).reduce((a,b)=>a+b,0) });
        }
      }
    } catch {}
  }

  if (abuseKey && abuseKey !== 'your_abuseipdb_key' && /^\d+\.\d+\.\d+\.\d+$/.test(v)) {
    try {
      const r = await axios.get('https://api.abuseipdb.com/api/v2/check', {
        headers: { Key: abuseKey, Accept: 'application/json' },
        params: { ipAddress: v, maxAgeInDays: 90 }, timeout: 5000
      });
      const score = r.data.data?.abuseConfidenceScore || 0;
      if (score >= 20) {
        external.found = true;
        external.sources.push({ source: 'abuseipdb', abuse_score: score });
      }
    } catch {}
  }

  res.json({ found: external.found, ioc: null, external, source: 'external_check' });
});

// ── GET /api/threats/feed ──────────────────────────────────
router.get('/feed', authenticate, async (req, res) => {
  const feedUrls = (process.env.FEED_URLS || '').split(',').filter(Boolean);
  const externalItems = [];

  await Promise.allSettled(feedUrls.slice(0, 4).map(async (url) => {
    try {
      const r = await axios.get(url.trim(), { timeout: 6000, headers: { 'User-Agent': 'ChayilSecureX/2.0' }});
      const matches = (r.data || '').matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const m of matches) {
        const title   = (m[1].match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim();
        const link    = (m[1].match(/<link>(.*?)<\/link>/) || [])[1]?.trim();
        const pubDate = (m[1].match(/<pubDate>(.*?)<\/pubDate>/) || [])[1]?.trim();
        if (title) externalItems.push({
          id: `ext-${Date.now()}-${Math.random()}`,
          title, link,
          source: new URL(url.trim()).hostname,
          severity: 'medium',
          published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          type: 'news'
        });
        if (externalItems.length >= 15) break;
      }
    } catch {}
  }));

  // Merge with local stored IOCs
  let localFeed = [];
  try {
    const r = await query('SELECT * FROM threat_iocs ORDER BY created_at DESC LIMIT 15');
    localFeed = r.rows.map(ioc => ({
      id: ioc.id,
      title: `[IOC] ${(ioc.type || 'indicator').toUpperCase()}: ${ioc.value}`,
      source: ioc.source || 'Internal DB',
      severity: ioc.severity || 'medium',
      published: ioc.created_at,
      link: null,
      type: 'ioc'
    }));
  } catch {}

  const feed = [...localFeed, ...externalItems]
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, 20);

  res.json({ feed });
});

// ── GET /api/threats/enrich/:value ────────────────────────
router.get('/enrich/:value', authenticate, authorize('admin','analyst'), async (req, res) => {
  const val = decodeURIComponent(req.params.value).trim();
  const enrichment = { value: val, timestamp: new Date().toISOString() };

  const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(val);
  const isHash = /^[a-f0-9]{32,64}$/.test(val);

  if (isIP) {
    const [abuse, vt, geo] = await Promise.allSettled([
      process.env.ABUSEIPDB_API_KEY && process.env.ABUSEIPDB_API_KEY !== 'your_abuseipdb_key'
        ? axios.get('https://api.abuseipdb.com/api/v2/check', { headers:{ Key:process.env.ABUSEIPDB_API_KEY, Accept:'application/json' }, params:{ ipAddress:val, maxAgeInDays:90 }, timeout:6000 })
        : Promise.reject('no key'),
      process.env.VIRUSTOTAL_API_KEY && process.env.VIRUSTOTAL_API_KEY !== 'your_virustotal_key'
        ? axios.get(`https://www.virustotal.com/api/v3/ip_addresses/${val}`, { headers:{ 'x-apikey':process.env.VIRUSTOTAL_API_KEY }, timeout:6000 })
        : Promise.reject('no key'),
      axios.get(`http://ip-api.com/json/${val}?fields=status,country,regionName,city,isp,as,lat,lon`, { timeout:4000 }),
    ]);
    enrichment.abuseipdb = abuse.value?.data?.data || null;
    enrichment.virustotal = vt.value?.data?.data?.attributes?.last_analysis_stats || null;
    enrichment.geo = geo.value?.data?.status === 'success' ? geo.value.data : null;
  } else if (isHash) {
    try {
      if (process.env.VIRUSTOTAL_API_KEY && process.env.VIRUSTOTAL_API_KEY !== 'your_virustotal_key') {
        const r = await axios.get(`https://www.virustotal.com/api/v3/files/${val}`, { headers:{ 'x-apikey':process.env.VIRUSTOTAL_API_KEY }, timeout:8000 });
        enrichment.virustotal = r.data.data?.attributes || null;
      }
    } catch {}
  }

  res.json({ success: true, enrichment });
});

// ── GET /api/threats/stats ─────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const r = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN severity='critical' THEN 1 END) as critical,
        COUNT(CASE WHEN severity='high' THEN 1 END) as high,
        COUNT(CASE WHEN severity='medium' THEN 1 END) as medium,
        COUNT(CASE WHEN severity='low' THEN 1 END) as low,
        COUNT(CASE WHEN type='ip' THEN 1 END) as ips,
        COUNT(CASE WHEN type='domain' THEN 1 END) as domains,
        COUNT(CASE WHEN type='hash' THEN 1 END) as hashes
      FROM threat_iocs WHERE org_id=$1 OR org_id IS NULL
    `, [req.user.org_id]);
    res.json(r.rows[0] || {});
  } catch { res.json({ total:0 }); }
});

module.exports = router;
