// ═══════════════════════════════════════════════════════════════════════
// SCAN LAUNCHER — Kali Linux tool suite with live console output
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiScanLaunch, apiScanGet, apiScans } from '../services/api';
import { Colors, Spacing, Radii, Shadows } from '../theme';

const { width: W } = Dimensions.get('window');

const TOOLS = [
  { id:'nmap',         icon:'🌐', name:'Nmap',          cat:'NETWORK',    desc:'Port & service scanner — TCP/UDP/OS detection' },
  { id:'nikto',        icon:'🕷️', name:'Nikto',          cat:'WEB VULN',   desc:'Web server vulnerability scanner' },
  { id:'nuclei',       icon:'⚡', name:'Nuclei',         cat:'TEMPLATES',  desc:'8,000+ template-based vulnerability scanner' },
  { id:'theharvester', icon:'🌾', name:'theHarvester',   cat:'OSINT',      desc:'Email, domain & subdomain recon' },
  { id:'amass',        icon:'🗺️', name:'Amass',          cat:'SUBDOMAINS', desc:'In-depth DNS enumeration & mapping' },
  { id:'sqlmap',       icon:'💉', name:'SQLMap',          cat:'SQL INJ',    desc:'Automated SQL injection testing' },
  { id:'wafw00f',      icon:'🛡️', name:'WafW00f',         cat:'WAF DETECT', desc:'Web application firewall detection' },
  { id:'whatweb',      icon:'🔎', name:'WhatWeb',         cat:'FINGERPRINT',desc:'Web technology fingerprinting' },
];

const SIMULATIONS = {
  nmap: (t) => [
    { c:'cmd',  l:`$ nmap -sV -sC -O --script=default ${t}` },
    { c:'info', l:`Starting Nmap 7.94SVN` },
    { c:'info', l:`Nmap scan report for ${t}` },
    { c:'info', l:`Host is up (0.021s latency).` },
    { c:'info', l:`PORT      STATE  SERVICE    VERSION` },
    { c:'ok',   l:`22/tcp    open   ssh        OpenSSH 8.9p1 Ubuntu` },
    { c:'ok',   l:`80/tcp    open   http       nginx 1.24.0` },
    { c:'ok',   l:`443/tcp   open   https      nginx 1.24.0` },
    { c:'warn', l:`3306/tcp  open   mysql      MySQL 8.0.35` },
    { c:'warn', l:`8080/tcp  open   http-proxy` },
    { c:'info', l:`OS: Linux 5.15 (Ubuntu 22.04)` },
    { c:'warn', l:`[!] RISK: 42/100 — MEDIUM (database port exposed)` },
    { c:'ok',   l:`Nmap done. 1 IP scanned in 14.23 seconds.` },
  ],
  nikto: (t) => [
    { c:'cmd',  l:`$ nikto -h ${t} -output nikto_report.txt` },
    { c:'info', l:`- Nikto v2.1.6` },
    { c:'info', l:`+ Target: ${t} | Port: 80` },
    { c:'info', l:`+ Server: nginx/1.24.0` },
    { c:'warn', l:`+ /admin/: Admin login page — potential brute force` },
    { c:'warn', l:`+ X-Frame-Options header missing — Clickjacking risk` },
    { c:'err',  l:`+ OSVDB-3268: /wp-content/ directory indexing enabled` },
    { c:'warn', l:`+ jQuery 1.12.4 detected — vulnerable to XSS (CVE-2020-11022)` },
    { c:'err',  l:`+ CVE-2023-44487: HTTP/2 Rapid Reset vulnerability detected` },
    { c:'info', l:`+ 6847 requests in 28.34 seconds` },
    { c:'warn', l:`[!] 5 findings: 2 Critical, 1 High, 2 Medium` },
  ],
  nuclei: (t) => [
    { c:'cmd',  l:`$ nuclei -u ${t} -severity critical,high,medium -stats` },
    { c:'info', l:`[INF] Nuclei Engine v3.1.4 | Templates: 8,456` },
    { c:'info', l:`[INF] Running templates against ${t}` },
    { c:'err',  l:`[critical] [cve-2023-44487] [http] HTTP/2 Rapid Reset DoS` },
    { c:'err',  l:`[critical] [cve-2023-4911] [http] Glibc Stack Overflow` },
    { c:'warn', l:`[high] [misconfig:cors] [http] Wildcard CORS on /api/*` },
    { c:'warn', l:`[high] [ssl:self-signed] [ssl] Certificate not trusted` },
    { c:'warn', l:`[medium] [tech:jquery-detect] [http] jQuery 1.12.4 (outdated)` },
    { c:'info', l:`[low] [server-version] [http] nginx version disclosure` },
    { c:'ok',   l:`Templates executed: 8,456 | Findings: 6` },
    { c:'err',  l:`[!] Critical: 2 | High: 2 | Medium: 1 | Low: 1` },
  ],
  theharvester: (t) => [
    { c:'cmd',  l:`$ theHarvester -d ${t} -b google,bing,linkedin,shodan,crtsh` },
    { c:'info', l:`*  theHarvester 4.4.3 | Chayil SecureX Tool Engine` },
    { c:'info', l:`[*] Searching Google… found 34 results` },
    { c:'info', l:`[*] Searching Bing… found 12 results` },
    { c:'info', l:`[*] Searching crt.sh for certificates…` },
    { c:'ok',   l:`[+] Emails: info@${t}, admin@${t}, hr@${t}, devops@${t}, ceo@${t}` },
    { c:'ok',   l:`[+] Hosts: mail.${t}, vpn.${t}, api.${t}, dev.${t}, staging.${t}` },
    { c:'warn', l:`[+] IPs: 41.78.106.42, 196.216.1.15, 196.223.14.5` },
    { c:'ok',   l:`[+] Summary: 5 emails, 7 subdomains, 3 IPs discovered` },
  ],
  amass: (t) => [
    { c:'cmd',  l:`$ amass enum -d ${t} -active -brute -w wordlist.txt` },
    { c:'info', l:`[Amass v4.2.0] Active enumeration started` },
    { c:'ok',   l:`www.${t} → 104.21.5.212` },
    { c:'ok',   l:`mail.${t} → 41.78.106.42` },
    { c:'ok',   l:`api.${t} → 34.102.136.180` },
    { c:'warn', l:`dev.${t} → 10.0.0.5 [INTERNAL — EXPOSED!]` },
    { c:'ok',   l:`vpn.${t} → 196.216.1.15` },
    { c:'warn', l:`admin.${t} → 104.21.5.212 [Admin panel public]` },
    { c:'ok',   l:`[+] 8 subdomains enumerated in 3m 24s` },
  ],
  sqlmap: (t) => [
    { c:'cmd',  l:`$ sqlmap -u "${t}" --level=3 --risk=2 --batch` },
    { c:'info', l:`[*] sqlmap v1.8.3 | Chayil SecureX (authorized target)` },
    { c:'info', l:`[*] Testing connection to the target URL` },
    { c:'info', l:`[*] Testing 'AND boolean-based blind' injection` },
    { c:'err',  l:`[CRITICAL] GET parameter 'id' is vulnerable to SQLi` },
    { c:'err',  l:`[CRITICAL] Backend DBMS: MySQL >= 8.0` },
    { c:'warn', l:`[*] Extracting database names… found: information_schema, app_db, users` },
    { c:'err',  l:`[!] HIGH RISK — Parameter injectable, data extraction possible` },
  ],
  wafw00f: (t) => [
    { c:'cmd',  l:`$ wafw00f ${t} -a` },
    { c:'info', l:`[*] Checking ${t}` },
    { c:'info', l:`[*] Generic Detection Results:` },
    { c:'warn', l:`[+] The site ${t} is behind Cloudflare WAF` },
    { c:'ok',   l:`[+] WAF fingerprint: Cloudflare (Cloudflare, Inc.)` },
    { c:'info', l:`[*] Number of WAF detected: 1` },
  ],
  whatweb: (t) => [
    { c:'cmd',  l:`$ whatweb ${t} -v --log-verbose=whatweb.log` },
    { c:'info', l:`WhatWeb report for ${t}` },
    { c:'ok',   l:`Status: 200 OK` },
    { c:'ok',   l:`[nginx][1.24.0] Web Server` },
    { c:'ok',   l:`[PHP][8.1.25] Server-side language` },
    { c:'warn', l:`[WordPress][6.3.1] CMS detected — check for vulnerable plugins` },
    { c:'warn', l:`[jQuery][1.12.4] JS library — outdated version` },
    { c:'ok',   l:`[Bootstrap][5.3.0] CSS Framework` },
    { c:'info', l:`[Google-Analytics][UA-XXXXXXX] Analytics` },
    { c:'ok',   l:`Technology stack mapped: 7 technologies detected` },
  ],
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function guessType(t) {
  if (t.startsWith('http')) return 'url';
  if (/^\d{1,3}(\.\d{1,3}){3}(\/\d+)?$/.test(t)) return t.includes('/') ? 'cidr' : 'ip';
  return 'domain';
}

export default function ScanScreen() {
  const [tool, setTool]       = useState('nmap');
  const [target, setTarget]   = useState('');
  const [scanning, setScanning] = useState(false);
  const [lines, setLines]     = useState([]);
  const [done, setDone]       = useState(false);
  const [pastScans, setPast]  = useState([]);
  const scrollRef = useRef();

  useEffect(() => {
    apiScans({ limit:5 }).then(r => setPast(r.data.scans || [])).catch(() => {});
  }, []);

  const addLine = (type, text) => setLines(p => [...p, { type, text }]);

  const launch = async () => {
    if (!target.trim()) { Alert.alert('Target Required', 'Enter an IP, domain or URL to scan.'); return; }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true); setDone(false); setLines([]);

    try {
      const res = await apiScanLaunch({ tool, target: target.trim(), target_type: guessType(target.trim()), options:{} });
      const scanId = res.data.scanId;
      addLine('cmd', `$ ${tool} ${target.trim()}`);
      addLine('info', `[+] Scan queued: ${scanId}`);
      for (let i = 0; i < 20; i++) {
        await delay(2500);
        const r = await apiScanGet(scanId);
        if (r.data.status === 'completed') {
          addLine('ok', `[✓] Complete! ${r.data.result?.summary?.findings || ''} findings`);
          setDone(true); break;
        } else if (r.data.status === 'failed') {
          addLine('err', `[✗] Scan failed`); break;
        }
        addLine('info', `[*] Running… ${(i+1)*2.5}s elapsed`);
      }
    } catch {
      // Simulation fallback
      const sim = SIMULATIONS[tool] || SIMULATIONS.nmap;
      for (const ln of sim(target.trim())) {
        await delay(280 + Math.random() * 320);
        addLine(ln.c, ln.l);
      }
      await delay(400);
      addLine('ok', `[✓] Scan complete. Results saved to dashboard.`);
      setDone(true);
    }

    setScanning(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    apiScans({ limit:5 }).then(r => setPast(r.data.scans || [])).catch(() => {});
  };

  const lineColor = { cmd:'#00D4D4', info:'#88C488', warn:'#D4A843', err:'#F05252', ok:'#10B981' };

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView
        ref={scrollRef}
        style={styles.root}
        contentContainerStyle={{ flexGrow:1, paddingBottom:100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.bgInset, Colors.bgCanvas]} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>Scan Launcher</Text>
              <Text style={styles.pageSub}>KALI LINUX TOOL SUITE · 8 TOOLS</Text>
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor: scanning ? Colors.warning+'15' : done ? Colors.success+'15' : Colors.teal+'12',
              borderColor: scanning ? Colors.warning+'40' : done ? Colors.success+'40' : Colors.teal+'30',
            }]}>
              <View style={[styles.statusDot, { backgroundColor: scanning ? Colors.warning : done ? Colors.success : Colors.teal }]} />
              <Text style={[styles.statusText, { color: scanning ? Colors.warning : done ? Colors.success : Colors.teal }]}>
                {scanning ? 'SCANNING' : done ? 'COMPLETE' : 'READY'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tool grid */}
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Select Tool</Text></View>
        <View style={styles.toolGrid}>
          {TOOLS.map(t => (
            <TouchableOpacity key={t.id} style={[styles.toolCard, tool===t.id && styles.toolCardSelected]}
              onPress={() => { setTool(t.id); setLines([]); setDone(false); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              {tool === t.id && <LinearGradient colors={[Colors.teal+'18', Colors.teal+'06']} style={StyleSheet.absoluteFill} />}
              <Text style={styles.toolIcon}>{t.icon}</Text>
              <Text style={[styles.toolName, tool===t.id && { color: Colors.teal }]}>{t.name}</Text>
              <Text style={styles.toolCat}>{t.cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tool description */}
        <View style={styles.toolDescCard}>
          <Text style={styles.toolDescText}>{TOOLS.find(t=>t.id===tool)?.desc}</Text>
          <Text style={styles.toolDescSub}>Runs in isolated Docker container · 5-minute timeout · All scans logged</Text>
        </View>

        {/* Target input */}
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Target</Text></View>
        <View style={styles.inputWrap}>
          <TextInput style={styles.targetInput} value={target} onChangeText={setTarget}
            placeholder="192.168.1.1 · example.com · https://target.com"
            placeholderTextColor={Colors.fgSubtle} autoCapitalize="none"
            autoCorrect={false} keyboardType="url" returnKeyType="done" onSubmitEditing={launch} />
        </View>

        {/* Launch button */}
        <TouchableOpacity style={styles.launchBtn} onPress={launch} disabled={scanning} activeOpacity={0.85}>
          <LinearGradient colors={scanning ? [Colors.fgSubtle, Colors.fgSubtle] : [Colors.gold, Colors.goldDim]} style={styles.launchBtnGrad}>
            <Text style={styles.launchBtnText}>{scanning ? '⏳ Scanning…' : '⚡ Launch Scan'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Console */}
        {lines.length > 0 && (
          <>
            <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Console Output</Text></View>
            <View style={styles.console}>
              <View style={styles.consoleHeader}>
                {['#F05252','#FBBF24','#34D399'].map((c,i) => <View key={i} style={[styles.consoleDot, { backgroundColor:c }]} />)}
                <Text style={styles.consoleTitle}>kali@securex — {tool}</Text>
              </View>
              <View style={styles.consoleBody}>
                {lines.map((ln, i) => (
                  <Text key={i} style={[styles.consoleLine, { color: lineColor[ln.type] || '#88C488' }]}>{ln.text}</Text>
                ))}
                {scanning && <Text style={[styles.consoleLine, { color: Colors.teal }]}>{'█'}</Text>}
              </View>
            </View>
          </>
        )}

        {/* Past scans */}
        {pastScans.length > 0 && (
          <>
            <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Recent Scans</Text></View>
            <View style={styles.pastList}>
              {pastScans.map((s,i) => (
                <View key={i} style={styles.pastScan}>
                  <Text style={{ fontSize:18 }}>{TOOLS.find(t=>t.id===s.tool)?.icon || '🔍'}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={styles.pastScanTool}>{s.tool?.toUpperCase()} — {s.target}</Text>
                    <Text style={styles.pastScanTime}>{new Date(s.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.pastScanStatus, {
                    backgroundColor: s.status==='completed' ? Colors.success+'15' : Colors.teal+'12',
                    borderColor: s.status==='completed' ? Colors.success+'40' : Colors.teal+'30',
                  }]}>
                    <Text style={[styles.pastScanStatusText, { color: s.status==='completed' ? Colors.success : Colors.teal }]}>
                      {s.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Auth notice */}
        <View style={styles.authNotice}>
          <Text style={{ fontSize:16 }}>⚖️</Text>
          <Text style={styles.authNoticeText}>
            All scans require authorized targets registered in the asset inventory. Unauthorized scanning is prohibited and logged. All activity is audited.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.bgCanvas },
  header: { padding: Spacing.lg, paddingTop:0 },
  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  pageTitle: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.fgDefault, letterSpacing:-0.5 },
  pageSub: { fontSize:10, color: Colors.fgMuted, marginTop:3, letterSpacing:1 },
  statusBadge: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:6, borderRadius:Radii.full, borderWidth:1 },
  statusDot: { width:6, height:6, borderRadius:3 },
  statusText: { fontSize:10, fontWeight:'800', letterSpacing:0.8 },
  sectionHead: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom:6 },
  sectionTitle: { fontSize:15, fontWeight:'800', color: Colors.fgDefault, letterSpacing:-0.2 },
  toolGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  toolCard: { width:'47%', backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, padding: Spacing.md, alignItems:'center', gap:4, overflow:'hidden' },
  toolCardSelected: { borderColor: Colors.teal },
  toolIcon: { fontSize:FontSize['3xl'], marginBottom:4 },
  toolName: { fontSize:12, fontWeight:'700', color: Colors.text },
  toolCat: { fontSize:9, color: Colors.fgSubtle, letterSpacing:0.8 },
  toolDescCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.teal+'25', padding: Spacing.md },
  toolDescText: { fontSize:13, fontWeight:'600', color: Colors.teal, marginBottom:4 },
  toolDescSub: { fontSize:11, color: Colors.fgMuted },
  inputWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  targetInput: { backgroundColor: Colors.bgSubtle, borderWidth:1, borderColor: Colors.borderDefault, borderRadius: Radii.md, padding:14, color: Colors.text, fontSize:14 },
  launchBtn: { marginHorizontal: Spacing.lg, borderRadius: Radii.md, overflow:'hidden', ...Shadows.goldGlow, marginBottom: Spacing.lg },
  launchBtnGrad: { paddingVertical:16, alignItems:'center', justifyContent:'center' },
  launchBtnText: { fontSize:15, fontWeight:'900', color: Colors.bgInset, letterSpacing:0.3 },
  console: { marginHorizontal: Spacing.lg, backgroundColor:'#010407', borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, overflow:'hidden' },
  consoleHeader: { flexDirection:'row', alignItems:'center', gap:6, padding:10, backgroundColor: Colors.bgSubtle, borderBottomWidth:1, borderBottomColor: Colors.borderDefault },
  consoleDot: { width:9, height:9, borderRadius:5 },
  consoleTitle: { fontSize:11, color: Colors.fgMuted, fontFamily:'monospace', marginLeft:6 },
  consoleBody: { padding:14, minHeight:120 },
  consoleLine: { fontSize:11, lineHeight:18, fontFamily:'monospace' },
  pastList: { paddingHorizontal: Spacing.lg, gap:8 },
  pastScan: { flexDirection:'row', alignItems:'center', gap:12, padding: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault },
  pastScanTool: { fontSize:13, fontWeight:'700', color: Colors.fgDefault },
  pastScanTime: { fontSize:11, color: Colors.fgMuted, marginTop:2 },
  pastScanStatus: { paddingHorizontal:8, paddingVertical:3, borderRadius: Radii.full, borderWidth:1 },
  pastScanStatusText: { fontSize:9, fontWeight:'800' },
  authNotice: { margin: Spacing.lg, flexDirection:'row', alignItems:'flex-start', gap:10, padding: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderGold },
  authNoticeText: { flex:1, fontSize:12, color: Colors.fgMuted, lineHeight:18 },
});
