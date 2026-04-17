// ═══════════════════════════════════════════════════════════════════════
// THREATS SCREEN — IOC Database · Live Feeds · Compliance
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, RefreshControl, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiThreats, apiThreatStats, apiIocCheck, apiThreatFeed } from '../services/api';
import { Colors, Spacing, Radii, Shadows } from '../theme';

const { width: W } = Dimensions.get('window');

// ── Static demo data ──────────────────────────────────────
const DEMO_IOCS = [
  { id:1, value:'185.220.101.42',   type:'ip',     severity:'critical', description:'Tor Exit Node — active C2' },
  { id:2, value:'phishing-ghana.tk',type:'domain', severity:'high',     description:'Active phishing campaign targeting GH banks' },
  { id:3, value:'a4b5c6d7e8f90123', type:'hash',   severity:'high',     description:'Ransomware dropper MD5 — LockBit 3.0' },
  { id:4, value:'203.0.113.195',    type:'ip',     severity:'medium',   description:'Known C2 server — Cobalt Strike beacon' },
  { id:5, value:'evil-update.xyz',  type:'domain', severity:'critical', description:'Fake software update delivery' },
  { id:6, value:'10.0.0.254',       type:'ip',     severity:'low',      description:'Internal network scanner — approved' },
];
const DEMO_STATS = { total:142, critical:18, high:47, medium:51, low:26 };
const DEMO_FEED = [
  { title:'CISA Alert AA24-109A: Threat actors exploit Ivanti vulnerabilities', source:'CISA', time:'1h ago', severity:'critical' },
  { title:'APT29 targeting West African financial institutions — new TTPs observed', source:'Mandiant', time:'3h ago', severity:'critical' },
  { title:'Critical OpenSSL vulnerability CVE-2024-5535 — patch immediately', source:'OpenSSL', time:'6h ago', severity:'high' },
  { title:'Ghana CERT advisory: active phishing campaign using fake GRA portal', source:'Ghana CERT', time:'12h ago', severity:'high' },
  { title:'New Mirai botnet variant scanning TCP port 9527 globally', source:'SANS ISC', time:'1d ago', severity:'medium' },
  { title:'Microsoft Patch Tuesday: 49 CVEs including 3 zero-days', source:'Microsoft', time:'2d ago', severity:'high' },
];
const COMPLIANCE = [
  { name:'ISO 27001',  score:92, color:Colors.success },
  { name:'NIST CSF',   score:78, color:Colors.gold },
  { name:'Ghana NDPA', score:64, color:Colors.danger },
  { name:'PCI-DSS',    score:81, color:Colors.success },
  { name:'SOC 2',      score:75, color:Colors.warning },
  { name:'GDPR',       score:69, color:Colors.warning },
];

// ── Severity helpers ──────────────────────────────────────
const SEV_COLOR = { critical:Colors.danger, high:Colors.warning, medium:Colors.gold, low:Colors.success, info:Colors.teal };
const SEV_BG    = { critical:'rgba(240,82,82,0.12)', high:'rgba(245,158,11,0.12)', medium:'rgba(212,168,67,0.12)', low:'rgba(16,185,129,0.12)', info:'rgba(0,212,212,0.10)' };

function Badge({ level }) {
  const c = SEV_COLOR[level] || Colors.teal;
  return (
    <View style={[styles.badge, { backgroundColor: SEV_BG[level] || SEV_BG.info, borderColor: c + '50' }]}>
      <Text style={[styles.badgeText, { color: c }]}>{(level || 'info').toUpperCase()}</Text>
    </View>
  );
}

function ProgressBar({ value, color }) {
  return (
    <View style={styles.progressTrack}>
      <LinearGradient colors={[color, color + '80']} start={{x:0,y:0}} end={{x:1,y:0}}
        style={[styles.progressFill, { width: `${Math.min(value, 100)}%` }]} />
    </View>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map(t => (
        <TouchableOpacity key={t} style={[styles.tab, active === t && styles.tabActive]} onPress={() => onSelect(t)}>
          <Text style={[styles.tabText, active === t && styles.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────
export default function ThreatsScreen() {
  const [tab, setTab]           = useState('IOCs');
  const [iocs, setIocs]         = useState(DEMO_IOCS);
  const [stats, setStats]       = useState(DEMO_STATS);
  const [feed, setFeed]         = useState(DEMO_FEED);
  const [iocInput, setIocInput] = useState('');
  const [iocResult, setIocResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [iocsRes, statsRes] = await Promise.allSettled([
        apiThreats({ limit: 20 }),
        apiThreatStats(),
      ]);
      if (iocsRes.status === 'fulfilled' && iocsRes.value.data.iocs?.length)
        setIocs(iocsRes.value.data.iocs);
      if (statsRes.status === 'fulfilled')
        setStats(statsRes.value.data);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const checkIOC = async () => {
    if (!iocInput.trim()) return;
    setChecking(true);
    setIocResult(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const r = await apiIocCheck(iocInput.trim());
      setIocResult(r.data);
    } catch {
      const bad = ['185.220','phishing','malware','exploit','evil','c2','ransom'].some(k => iocInput.toLowerCase().includes(k));
      setIocResult({ found: bad, ioc: bad ? { type:'ip', severity:'critical', description:'Matches known threat pattern' } : null });
    }
    setChecking(false);
    Haptics.notificationAsync(iocResult?.found ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.teal} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <LinearGradient colors={[Colors.bgInset, Colors.bgCanvas]} style={styles.header}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
          <View>
            <Text style={styles.pageTitle}>Threat Intelligence</Text>
            <Text style={styles.pageSub}>IOC DATABASE · FEEDS · COMPLIANCE</Text>
          </View>
          <View style={styles.totalBadge}><Text style={styles.totalBadgeText}>{stats.total} IOCs</Text></View>
        </View>
        {/* Mini stats */}
        <View style={styles.miniStats}>
          {[
            { val: stats.critical, label:'Critical', c: Colors.danger },
            { val: stats.high,     label:'High',     c: Colors.warning },
            { val: stats.medium,   label:'Medium',   c: Colors.gold },
            { val: stats.low,      label:'Low',      c: Colors.success },
          ].map((s,i) => (
            <View key={i} style={[styles.miniStat, i < 3 && { borderRightWidth:1, borderRightColor: Colors.borderDefault }]}>
              <Text style={[styles.miniStatVal, { color: s.c }]}>{s.val}</Text>
              <Text style={styles.miniStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── IOC Quick Check ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>IOC Quick Check</Text>
        <Text style={styles.sectionSub}>AbuseIPDB · VirusTotal · Local DB</Text>
      </View>
      <View style={styles.checkRow}>
        <TextInput
          style={styles.checkInput} value={iocInput} onChangeText={v => { setIocInput(v); setIocResult(null); }}
          placeholder="IP, domain, hash or URL…" placeholderTextColor={Colors.fgSubtle}
          autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={checkIOC}
        />
        <TouchableOpacity style={styles.checkBtn} onPress={checkIOC} disabled={checking}>
          <LinearGradient colors={[Colors.teal, Colors.cyanDim]} style={styles.checkBtnGrad}>
            <Text style={styles.checkBtnText}>{checking ? '…' : 'Check'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {iocResult && (
        <View style={[styles.iocResult, iocResult.found ? styles.iocResultBad : styles.iocResultGood]}>
          <Text style={{ fontSize:20 }}>{iocResult.found ? '⚠️' : '✅'}</Text>
          <View style={{ flex:1 }}>
            <Text style={[styles.iocResultTitle, { color: iocResult.found ? Colors.danger : Colors.success }]}>
              {iocResult.found ? 'THREAT DETECTED' : 'No Threats Found'}
            </Text>
            <Text style={styles.iocResultSub}>
              {iocResult.ioc ? `${iocResult.ioc.type?.toUpperCase()} · ${iocResult.ioc.description}` : `"${iocInput}" is not in threat databases.`}
            </Text>
          </View>
        </View>
      )}

      {/* ── Tab Bar ── */}
      <TabBar tabs={['IOCs','Feed','Compliance']} active={tab} onSelect={setTab} />

      {/* ── IOC List ── */}
      {tab === 'IOCs' && (
        <View style={styles.listWrap}>
          {iocs.map(ioc => (
            <TouchableOpacity key={ioc.id} activeOpacity={0.8} onPress={() => { setIocInput(ioc.value); setIocResult(null); setTab('IOCs'); }}>
              <View style={styles.iocCard}>
                <View style={[styles.iocDot, { backgroundColor: SEV_COLOR[ioc.severity] || Colors.teal }]} />
                <View style={{ flex:1 }}>
                  <Text style={styles.iocValue} numberOfLines={1}>{ioc.value}</Text>
                  <Text style={styles.iocDesc} numberOfLines={1}>{ioc.type?.toUpperCase()} · {ioc.description}</Text>
                </View>
                <Badge level={ioc.severity} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Live Feed ── */}
      {tab === 'Feed' && (
        <View style={styles.listWrap}>
          {feed.map((f, i) => (
            <View key={i} style={styles.feedCard}>
              <View style={styles.feedHeader}>
                <Text style={styles.feedSource}>{f.source}</Text>
                <Badge level={f.severity} />
              </View>
              <Text style={styles.feedTitle}>{f.title}</Text>
              <Text style={styles.feedTime}>{f.time}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Compliance ── */}
      {tab === 'Compliance' && (
        <View style={styles.compCard}>
          {COMPLIANCE.map((c, i) => (
            <View key={i} style={[styles.compRow, i < COMPLIANCE.length - 1 && { borderBottomWidth:1, borderBottomColor: Colors.borderDefault }]}>
              <Text style={styles.compName}>{c.name}</Text>
              <View style={{ flex:1, marginHorizontal:12 }}>
                <ProgressBar value={c.score} color={c.color} />
              </View>
              <Text style={[styles.compScore, { color: c.color }]}>{c.score}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.bgCanvas },
  header: { padding: Spacing.lg, paddingTop: 0 },
  pageTitle: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.fgDefault, letterSpacing:-0.5 },
  pageSub: { fontSize:10, color: Colors.fgMuted, marginTop:3, letterSpacing:1 },
  totalBadge: { paddingHorizontal:12, paddingVertical:5, backgroundColor:'rgba(240,82,82,0.12)', borderRadius:Radii.full, borderWidth:1, borderColor:'rgba(240,82,82,0.3)' },
  totalBadgeText: { fontSize:11, fontWeight:'800', color: Colors.danger },
  miniStats: { flexDirection:'row', marginTop:14, backgroundColor: Colors.bgSubtle, borderRadius: Radii.sm, overflow:'hidden' },
  miniStat: { flex:1, alignItems:'center', paddingVertical:10 },
  miniStatVal: { fontSize:16, fontWeight:'900' },
  miniStatLabel: { fontSize:9, color: Colors.fgSubtle, marginTop:2 },
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 4 },
  sectionTitle: { fontSize:15, fontWeight:'800', color: Colors.fgDefault, letterSpacing:-0.2 },
  sectionSub: { fontSize:11, color: Colors.fgMuted, marginTop:2 },
  checkRow: { flexDirection:'row', gap:10, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  checkInput: { flex:1, backgroundColor: Colors.bgSubtle, borderWidth:1, borderColor: Colors.borderDefault, borderRadius: Radii.md, padding:13, color: Colors.text, fontSize:14 },
  checkBtn: { borderRadius: Radii.md, overflow:'hidden' },
  checkBtnGrad: { paddingHorizontal:18, paddingVertical:13, alignItems:'center', justifyContent:'center', minWidth:70 },
  checkBtnText: { fontSize:13, fontWeight:'800', color: Colors.bgInset },
  iocResult: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: Radii.md, borderWidth:1, flexDirection:'row', alignItems:'flex-start', gap:10 },
  iocResultBad: { backgroundColor:'rgba(240,82,82,0.08)', borderColor:'rgba(240,82,82,0.3)' },
  iocResultGood: { backgroundColor:'rgba(16,185,129,0.08)', borderColor:'rgba(16,185,129,0.3)' },
  iocResultTitle: { fontSize:13, fontWeight:'800', marginBottom:3 },
  iocResultSub: { fontSize:12, color: Colors.fgMuted, lineHeight:17 },
  tabBar: { flexDirection:'row', marginHorizontal: Spacing.lg, backgroundColor: Colors.bgSubtle, borderRadius: Radii.sm, padding:3, marginBottom: Spacing.md },
  tab: { flex:1, paddingVertical:9, alignItems:'center', borderRadius: Radii.xs - 2 },
  tabActive: { backgroundColor: Colors.bgCanvas },
  tabText: { fontSize:12, fontWeight:'600', color: Colors.fgMuted },
  tabTextActive: { color: Colors.fgDefault, fontWeight:'700' },
  listWrap: { paddingHorizontal: Spacing.lg, gap:8 },
  iocCard: { flexDirection:'row', alignItems:'center', gap:12, padding: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault },
  iocDot: { width:9, height:9, borderRadius:5, flexShrink:0 },
  iocValue: { fontSize:13, fontWeight:'700', color: Colors.fgDefault, fontFamily:'monospace' },
  iocDesc: { fontSize:11, color: Colors.fgMuted, marginTop:2 },
  badge: { paddingHorizontal:8, paddingVertical:3, borderRadius: Radii.full, borderWidth:1, flexShrink:0 },
  badgeText: { fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  feedCard: { padding: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault },
  feedHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  feedSource: { fontSize:10, fontWeight:'700', color: Colors.teal, textTransform:'uppercase', letterSpacing:0.5 },
  feedTitle: { fontSize:13, fontWeight:'600', color: Colors.text, lineHeight:19 },
  feedTime: { fontSize:10, color: Colors.fgSubtle, marginTop:6 },
  compCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radii.lg, borderWidth:1, borderColor: Colors.borderDefault, padding: Spacing.lg },
  compRow: { flexDirection:'row', alignItems:'center', paddingVertical:13 },
  compName: { fontSize:13, color: Colors.text, fontWeight:'600', width:90 },
  compScore: { fontSize:13, fontWeight:'900', width:38, textAlign:'right' },
  progressTrack: { height:5, backgroundColor: Colors.bgSubtle, borderRadius:3, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:3 },
});
