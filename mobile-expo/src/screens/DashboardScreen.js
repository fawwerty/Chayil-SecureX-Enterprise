// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD SCREEN — Real-time SOC overview
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { apiDashboard, apiIncidents, apiScans } from '../services/api';
import { Colors, Spacing, Radii, Shadows } from '../theme';

const { width: W } = Dimensions.get('window');
const SEV = { critical: Colors.danger, high: Colors.warning, medium: Colors.gold, low: Colors.success };

const DEMO_STATS = { open_incidents:7, critical_vulns:4, compliance_score:87, assets_monitored:247, scans_today:12 };
const DEMO_INCIDENTS = [
  { id:'INC-001', title:'Brute force on VPN gateway',         severity:'critical', status:'Open',        updated_at: new Date(Date.now()-120000).toISOString() },
  { id:'INC-002', title:'Ransomware detected — WS-045',       severity:'critical', status:'In Progress',  updated_at: new Date(Date.now()-480000).toISOString() },
  { id:'INC-003', title:'Suspicious C2 outbound connection',  severity:'high',     status:'Open',        updated_at: new Date(Date.now()-900000).toISOString() },
  { id:'INC-004', title:'Admin login from Lagos, NG',          severity:'high',     status:'In Progress', updated_at: new Date(Date.now()-3600000).toISOString() },
];
const RISK_DOMAINS = [
  { label:'Network Security',    score:72, color: Colors.warning },
  { label:'Application Security',score:58, color: Colors.danger },
  { label:'Identity & Access',   score:91, color: Colors.success },
  { label:'Data Protection',     score:84, color: Colors.success },
  { label:'Cloud Security',      score:66, color: Colors.warning },
];

function timeAgo(iso) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d/60000)+'m ago';
  if (d < 86400000) return Math.floor(d/3600000)+'h ago';
  return Math.floor(d/86400000)+'d ago';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats]         = useState(DEMO_STATS);
  const [incidents, setIncidents] = useState(DEMO_INCIDENTS);
  const [refreshing, setRefreshing] = useState(false);

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const load = useCallback(async () => {
    try {
      const [sR, iR] = await Promise.allSettled([apiDashboard(), apiIncidents()]);
      if (sR.status==='fulfilled') setStats(sR.value.data.stats || DEMO_STATS);
      if (iR.status==='fulfilled' && iR.value.data.incidents?.length)
        setIncidents(iR.value.data.incidents.slice(0,4));
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ flexGrow:1, paddingBottom:100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.teal} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <LinearGradient colors={[Colors.bgInset, Colors.bgCanvas]} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greet()}, {user?.name?.split(' ')[0] || 'Analyst'} 👋</Text>
            <Text style={styles.subGreeting}>CHAYIL SECUREX · SECURITY OPERATIONS</Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* User card */}
        <LinearGradient colors={['rgba(212,168,67,0.10)','rgba(0,212,212,0.06)']}
          style={styles.userCard}>
          <LinearGradient colors={[Colors.gold+'30', Colors.teal+'20']} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name||'U')[0].toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex:1 }}>
            <Text style={styles.userName}>{user?.name || user?.email || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{(user?.role||'analyst').toUpperCase()}</Text>
            </View>
          </View>
          <View style={{ alignItems:'center' }}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineLabel}>Online</Text>
          </View>
        </LinearGradient>

        {/* Card stats */}
        <View style={styles.cardStats}>
          {[
            { val: stats.assets_monitored,         label:'Assets' },
            { val: stats.open_incidents, danger:true, label:'Incidents' },
            { val: `${stats.compliance_score}%`,   label:'Score' },
          ].map((s,i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.cardStat}>
                <Text style={[styles.cardStatVal, s.danger && { color: Colors.danger }]}>{s.val}</Text>
                <Text style={styles.cardStatLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      {/* ── Stat Grid ── */}
      <View style={styles.statsGrid}>
        {[
          { label:'Open Incidents',   value: stats.open_incidents,         icon:'⚡', change:'2 today',   up:false, accent: Colors.danger },
          { label:'Critical Vulns',   value: stats.critical_vulns,         icon:'⚠️', change:'4 total',   up:false, accent: Colors.warning },
          { label:'Scans Today',      value: stats.scans_today,            icon:'🔍', change:'running',   up:true,  accent: Colors.teal },
          { label:'Compliance Score', value:`${stats.compliance_score}%`,  icon:'✅', change:'ISO 27001', up:true,  accent: Colors.success },
        ].map((s,i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statTopBar, { backgroundColor: s.accent }]} />
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statChange, { color: s.up ? Colors.success : Colors.danger }]}>{s.up?'↑':'↓'} {s.change}</Text>
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.quickActions}>
        {[
          { label:'Scan',     icon:'🔍', route:'/(tabs)/scan',     color: Colors.teal },
          { label:'IOC',      icon:'⚡', route:'/(tabs)/threats',  color: Colors.danger },
          { label:'OSINT',    icon:'🌐', route:'/(tabs)/osint',    color: Colors.gold },
          { label:'Reports',  icon:'📋', route:'/(tabs)/reports',  color: '#8B5CF6' },
        ].map(a => (
          <TouchableOpacity key={a.label} style={styles.qa} onPress={() => router.push(a.route)} activeOpacity={0.75}>
            <LinearGradient colors={[a.color+'20', a.color+'08']} style={styles.qaGrad}>
              <Text style={styles.qaIcon}>{a.icon}</Text>
              <Text style={[styles.qaLabel, { color: a.color }]}>{a.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Live Alerts ── */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Live Alerts</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/incidents')}>
          <Text style={styles.sectionLink}>View All →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listWrap}>
        {incidents.map(inc => (
          <TouchableOpacity key={inc.id} style={styles.alertItem} onPress={() => router.push('/(tabs)/incidents')} activeOpacity={0.8}>
            <View style={[styles.alertDot, { backgroundColor: SEV[inc.severity] || Colors.teal }]} />
            <View style={{ flex:1 }}>
              <Text style={styles.alertTitle} numberOfLines={2}>{inc.title}</Text>
              <Text style={styles.alertSub}>{inc.id} · {inc.status}</Text>
            </View>
            <View style={{ alignItems:'flex-end', gap:4 }}>
              <View style={[styles.sevBadge, { backgroundColor: SEV[inc.severity]+'15', borderColor: SEV[inc.severity]+'40' }]}>
                <Text style={[styles.sevBadgeText, { color: SEV[inc.severity] }]}>{inc.severity?.toUpperCase()}</Text>
              </View>
              <Text style={styles.alertTime}>{timeAgo(inc.updated_at)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Risk Domains ── */}
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Risk Domains</Text></View>
      <View style={styles.riskCard}>
        {RISK_DOMAINS.map((d,i) => (
          <View key={i} style={[styles.riskRow, i < RISK_DOMAINS.length-1 && { borderBottomWidth:1, borderBottomColor: Colors.borderDefault }]}>
            <Text style={styles.riskLabel}>{d.label}</Text>
            <View style={styles.progressTrack}>
              <LinearGradient colors={[d.color, d.color+'80']} start={{x:0,y:0}} end={{x:1,y:0}}
                style={[styles.progressFill, { width:`${d.score}%` }]} />
            </View>
            <Text style={[styles.riskScore, { color: d.color }]}>{d.score}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.bgCanvas },
  header: { padding: Spacing.lg, paddingTop:0 },
  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.lg },
  greeting: { fontSize:FontSize['3xl'], fontWeight:'800', color: Colors.fgDefault, letterSpacing:-0.3 },
  subGreeting: { fontSize:10, color: Colors.fgMuted, marginTop:3, letterSpacing:1 },
  liveChip: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, backgroundColor:'rgba(240,82,82,0.12)', borderRadius:Radii.full, borderWidth:1, borderColor:'rgba(240,82,82,0.3)' },
  liveDot: { width:6, height:6, borderRadius:3, backgroundColor: Colors.danger },
  liveText: { fontSize:9, fontWeight:'800', color:'#F87171', letterSpacing:1 },
  userCard: { borderRadius: Radii.lg, borderWidth:1, borderColor: Colors.borderGold, padding: Spacing.md, flexDirection:'row', alignItems:'center', gap:12 },
  avatar: { width:46, height:46, borderRadius:23, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor: Colors.gold+'60' },
  avatarText: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.gold },
  userName: { fontSize:15, fontWeight:'700', color: Colors.fgDefault },
  roleBadge: { marginTop:4, alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:2, backgroundColor: Colors.gold+'15', borderRadius:Radii.full, borderWidth:1, borderColor: Colors.gold+'30' },
  roleText: { fontSize:9, fontWeight:'800', color: Colors.gold, letterSpacing:1 },
  onlineDot: { width:8, height:8, borderRadius:4, backgroundColor: Colors.success, alignSelf:'center', marginBottom:3 },
  onlineLabel: { fontSize:9, color: Colors.success, fontWeight:'600' },
  cardStats: { flexDirection:'row', backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, marginTop: Spacing.sm, overflow:'hidden' },
  cardStat: { flex:1, alignItems:'center', paddingVertical:14 },
  divider: { width:1, backgroundColor: Colors.borderDefault, marginVertical:10 },
  cardStatVal: { fontSize:18, fontWeight:'900', color: Colors.fgDefault },
  cardStatLabel: { fontSize:9, color: Colors.fgSubtle, marginTop:2 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, padding: Spacing.lg },
  statCard: { width:(W - Spacing.lg*2 - 10)/2, backgroundColor: Colors.bgCard, borderRadius: Radii.md, padding: Spacing.lg, borderWidth:1, borderColor: Colors.borderDefault, overflow:'hidden', ...Shadows.card },
  statTopBar: { position:'absolute', top:0, left:0, right:0, height:2 },
  statRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  statIcon: { fontSize:20 },
  statChange: { fontSize:10, fontWeight:'600' },
  statValue: { fontSize:FontSize['5xl'], fontWeight:'900', color: Colors.fgDefault, letterSpacing:-1 },
  statLabel: { fontSize:10, color: Colors.fgMuted, marginTop:4, textTransform:'uppercase', letterSpacing:0.8, fontWeight:'600' },
  sectionHead: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom:6 },
  sectionTitle: { fontSize:15, fontWeight:'800', color: Colors.fgDefault, letterSpacing:-0.2 },
  sectionLink: { fontSize:12, color: Colors.teal, fontWeight:'600' },
  quickActions: { flexDirection:'row', gap:10, paddingHorizontal: Spacing.lg, marginBottom:4 },
  qa: { flex:1, borderRadius: Radii.md, overflow:'hidden', borderWidth:1, borderColor: Colors.borderDefault },
  qaGrad: { alignItems:'center', paddingVertical:14, gap:5 },
  qaIcon: { fontSize:18 },
  qaLabel: { fontSize:10, fontWeight:'800', letterSpacing:0.3 },
  listWrap: { paddingHorizontal: Spacing.lg, gap:8 },
  alertItem: { flexDirection:'row', alignItems:'center', gap:10, padding: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault },
  alertDot: { width:9, height:9, borderRadius:5, flexShrink:0 },
  alertTitle: { fontSize:13, fontWeight:'600', color: Colors.text, lineHeight:18 },
  alertSub: { fontSize:11, color: Colors.fgMuted, marginTop:2 },
  alertTime: { fontSize:10, color: Colors.fgSubtle },
  sevBadge: { paddingHorizontal:7, paddingVertical:3, borderRadius:Radii.full, borderWidth:1 },
  sevBadgeText: { fontSize:8, fontWeight:'800', letterSpacing:0.3 },
  riskCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radii.lg, borderWidth:1, borderColor: Colors.borderDefault, padding: Spacing.lg },
  riskRow: { flexDirection:'row', alignItems:'center', paddingVertical:12, gap:10 },
  riskLabel: { fontSize:12, color: Colors.text, width:130 },
  progressTrack: { flex:1, height:4, backgroundColor: Colors.bgSubtle, borderRadius:2, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:2 },
  riskScore: { fontSize:13, fontWeight:'900', width:36, textAlign:'right' },
});
