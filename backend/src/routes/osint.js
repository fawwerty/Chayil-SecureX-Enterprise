/**
 * Chayil SecureX — OSINT Routes
 * Real-world integrations: AbuseIPDB, VirusTotal, Shodan, DNS, WHOIS
 */
const router = require('express').Router();
const axios = require('axios');
const dns = require('dns').promises;
const { query } = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// ── Helpers ────────────────────────────────────────────────
async function realWhois(domain) {
  try {
    // Use whois-json package if available, else fallback
    const whois = require('whois-json');
    return await whois(domain);
  } catch {
    return { registrar: 'N/A', creation_date: 'N/A', expiry_date: 'N/A', note: 'Install whois-json for live WHOIS data' };
  }
}

async function realDNS(domain) {
  const result = {};
  const types = ['A','AAAA','MX','TXT','NS','CNAME'];
  await Promise.allSettled(types.map(async t => {
    try { result[t] = await dns.resolve(domain, t); }
    catch { result[t] = []; }
  }));
  return result;
}

async function checkAbuseIPDB(ip) {
  const key = process.env.ABUSEIPDB_API_KEY;
  if (!key || key === 'your_abuseipdb_key') return null;
  try {
    const r = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      headers: { Key: key, Accept: 'application/json' },
      params: { ipAddress: ip, maxAgeInDays: 90 },
      timeout: 6000,
    });
    return r.data.data;
  } catch { return null; }
}

async function checkVirusTotal(indicator, type = 'ip') {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key || key === 'your_virustotal_key') return null;
  const endpoints = {
    ip: `https://www.virustotal.com/api/v3/ip_addresses/${indicator}`,
    domain: `https://www.virustotal.com/api/v3/domains/${indicator}`,
    hash: `https://www.virustotal.com/api/v3/files/${indicator}`,
    url: `https://www.virustotal.com/api/v3/urls/${Buffer.from(indicator).toString('base64').replace(/=/g,'')}`,
  };
  try {
    const r = await axios.get(endpoints[type] || endpoints.ip, {
      headers: { 'x-apikey': key },
      timeout: 8000,
    });
    const attrs = r.data.data?.attributes || {};
    return {
      malicious: attrs.last_analysis_stats?.malicious || 0,
      suspicious: attrs.last_analysis_stats?.suspicious || 0,
      total: (attrs.last_analysis_stats?.malicious||0) + (attrs.last_analysis_stats?.undetected||0) + (attrs.last_analysis_stats?.harmless||0),
      reputation: attrs.reputation || 0,
      country: attrs.country || null,
    };
  } catch { return null; }
}

async function checkShodan(ip) {
  const key = process.env.SHODAN_API_KEY;
  if (!key || key === 'your_shodan_key') return null;
  try {
    const r = await axios.get(`https://api.shodan.io/shodan/host/${ip}`, {
      params: { key }, timeout: 8000,
    });
    return {
      ports: r.data.ports || [],
      vulns: r.data.vulns || [],
      org: r.data.org,
      country: r.data.country_name,
      isp: r.data.isp,
      hostnames: r.data.hostnames || [],
    };
  } catch { return null; }
}

async function geoIP(ip) {
  try {
    const r = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,as,lat,lon,timezone`, { timeout: 4000 });
    if (r.data.status === 'success') return r.data;
  } catch {}
  return null;
}

// ── POST /api/osint/domain ─────────────────────────────────
router.post('/domain', authenticate, authorize('admin','analyst'), async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });
  const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, '').toLowerCase();

  const result = { domain: safeDomain, timestamp: new Date().toISOString(), source: 'live' };

  // Run all lookups in parallel
  const [whoisData, dnsData, vtData, iocCheck] = await Promise.allSettled([
    realWhois(safeDomain),
    realDNS(safeDomain),
    checkVirusTotal(safeDomain, 'domain'),
    query('SELECT * FROM threat_iocs WHERE value=$1', [safeDomain]).catch(() => ({ rows:[] })),
  ]);

  result.whois = whoisData.status === 'fulfilled' ? whoisData.value : { error: 'WHOIS unavailable' };
  result.dns = dnsData.status === 'fulfilled' ? dnsData.value : {};
  result.virustotal = vtData.status === 'fulfilled' ? vtData.value : null;
  result.ioc_match = iocCheck.status === 'fulfilled' ? (iocCheck.value.rows[0] || null) : null;

  // Derive subdomains from DNS if possible
  result.subdomains = (result.dns?.NS || []).concat(result.dns?.MX?.map(m=>m.exchange)||[]);

  // Risk assessment
  const vtMalicious = result.virustotal?.malicious || 0;
  result.risk_score = Math.min(vtMalicious * 10 + (result.ioc_match ? 50 : 0), 100);
  result.risk_level = result.risk_score >= 70 ? 'HIGH' : result.risk_score >= 30 ? 'MEDIUM' : 'LOW';

  try {
    await query(
      `INSERT INTO osint_results (org_id,user_id,query_type,target,results) VALUES ($1,$2,'domain',$3,$4)`,
      [req.user.org_id, req.user.id, safeDomain, JSON.stringify(result)]
    );
  } catch {}

  res.json({ success: true, result });
});

// ── POST /api/osint/ip ─────────────────────────────────────
router.post('/ip', authenticate, authorize('admin','analyst'), async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  const safeIp = ip.replace(/[^0-9.]/g, '');

  const [abuseData, vtData, shodanData, geoData, iocCheck] = await Promise.allSettled([
    checkAbuseIPDB(safeIp),
    checkVirusTotal(safeIp, 'ip'),
    checkShodan(safeIp),
    geoIP(safeIp),
    query('SELECT * FROM threat_iocs WHERE value=$1', [safeIp]).catch(() => ({ rows:[] })),
  ]);

  const result = {
    ip: safeIp,
    timestamp: new Date().toISOString(),
    abuseipdb: abuseData.value || { abuseConfidenceScore: 0, totalReports: 0, note: 'No API key — set ABUSEIPDB_API_KEY' },
    virustotal: vtData.value || { malicious: 0, note: 'No API key — set VIRUSTOTAL_API_KEY' },
    shodan: shodanData.value || { note: 'No API key — set SHODAN_API_KEY' },
    geo: geoData.value || {},
    ioc_match: iocCheck.value?.rows?.[0] || null,
  };

  const abuseScore = result.abuseipdb?.abuseConfidenceScore || 0;
  const vtMal = result.virustotal?.malicious || 0;
  result.risk_score = Math.min(abuseScore + vtMal * 15 + (result.ioc_match ? 40 : 0), 100);
  result.risk_level = result.risk_score >= 70 ? 'HIGH' : result.risk_score >= 30 ? 'MEDIUM' : 'LOW';

  try {
    await query(
      `INSERT INTO osint_results (org_id,user_id,query_type,target,results) VALUES ($1,$2,'ip',$3,$4)`,
      [req.user.org_id, req.user.id, safeIp, JSON.stringify(result)]
    );
  } catch {}

  res.json({ success: true, result });
});

// ── POST /api/osint/hash ───────────────────────────────────
router.post('/hash', authenticate, authorize('admin','analyst'), async (req, res) => {
  const { hash } = req.body;
  if (!hash) return res.status(400).json({ error: 'Hash required' });
  const safeHash = hash.replace(/[^a-fA-F0-9]/g, '').toLowerCase();

  const [vtData, iocCheck] = await Promise.allSettled([
    checkVirusTotal(safeHash, 'hash'),
    query('SELECT * FROM threat_iocs WHERE value=$1', [safeHash]).catch(() => ({ rows:[] })),
  ]);

  const result = {
    hash: safeHash,
    hash_type: safeHash.length === 32 ? 'MD5' : safeHash.length === 40 ? 'SHA1' : safeHash.length === 64 ? 'SHA256' : 'Unknown',
    timestamp: new Date().toISOString(),
    virustotal: vtData.value || { malicious: 0, note: 'Set VIRUSTOTAL_API_KEY for live results' },
    ioc_match: iocCheck.value?.rows?.[0] || null,
  };

  const vtMal = result.virustotal?.malicious || 0;
  result.verdict = vtMal >= 5 ? 'MALICIOUS' : vtMal >= 1 ? 'SUSPICIOUS' : 'CLEAN';

  res.json({ success: true, result });
});

// ── POST /api/osint/email ──────────────────────────────────
router.post('/email', authenticate, authorize('admin','analyst'), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const domain = email.split('@')[1];
  const dnsData = await realDNS(domain).catch(() => ({}));

  // HIBP requires paid API key — provide instructions
  const result = {
    email,
    domain,
    mx_records: dnsData.MX || [],
    timestamp: new Date().toISOString(),
    haveibeenpwned: {
      note: 'Set HIBP_API_KEY in .env for breach data',
      api_url: 'https://haveibeenpwned.com/API/v3'
    },
    domain_dns_valid: (dnsData.MX||[]).length > 0,
  };

  res.json({ success: true, result });
});

// ── GET /api/osint/history ─────────────────────────────────
router.get('/history', authenticate, async (req, res) => {
  try {
    const r = await query(
      `SELECT id, query_type, target, created_at, results->>'risk_level' as risk_level
       FROM osint_results WHERE org_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.org_id]
    );
    res.json({ results: r.rows });
  } catch { res.json({ results: [] }); }
});

module.exports = router;
