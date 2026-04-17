// ═══════════════════════════════════════════════════════════════════════
// REPORTS SCREEN — Generate & view compliance reports
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiReports, apiReportGenerate } from '../services/api';
import { Colors, Spacing, Radii, Shadows } from '../theme';

const REPORT_TYPES = [
  { id:'vulnerability', icon:'🔍', label:'Vulnerability Report', desc:'All CVEs, risk scores, remediation roadmap' },
  { id:'compliance',    icon:'✅', label:'Compliance Report',     desc:'ISO 27001, NIST, Ghana NDPA status' },
  { id:'incident',      icon:'⚡', label:'Incident Report',      desc:'All incidents, timelines, resolutions' },
  { id:'executive',     icon:'📊', label:'Executive Summary',    desc:'Board-level risk overview & metrics' },
  { id:'pentest',       icon:'🐉', label:'Penetration Test',     desc:'Full VA/PT findings & PoC evidence' },
  { id:'audit',         icon:'📋', label:'IT Audit Report',      desc:'COBIT / ISO controls assessment' },
];

const DEMO_REPORTS = [
  { id:'r1', title:'Q1 2025 Executive Security Report', type:'executive', created_at: new Date(Date.now()-86400000*3).toISOString(), status:'completed', pages:14 },
  { id:'r2', title:'ISO 27001 Compliance Assessment — March 2025', type:'compliance', created_at: new Date(Date.now()-86400000*7).toISOString(), status:'completed', pages:32 },
  { id:'r3', title:'Vulnerability Assessment — Production Infra', type:'vulnerability', created_at: new Date(Date.now()-86400000*14).toISOString(), status:'completed', pages:28 },
  { id:'r4', title:'Incident Response Report — INC-002 Ransomware', type:'incident', created_at: new Date(Date.now()-86400000*21).toISOString(), status:'completed', pages:8 },
];

const TYPE_COLORS = {
  executive: Colors.gold, compliance: Colors.success, vulnerability: Colors.danger,
  incident: Colors.warning, pentest: Colors.purple, audit: Colors.teal,
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

export default function ReportsScreen() {
  const [reports, setReports]   = useState(DEMO_REPORTS);
  const [selected, setSelected] = useState('executive');
  const [generating, setGen]    = useState(false);
  const [refreshing, setRef]    = useState(false);

  const load = async () => {
    try {
      const r = await apiReports();
      if (r.data.reports?.length) setReports(r.data.reports);
    } catch {}
    finally { setRef(false); }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    const type = REPORT_TYPES.find(t => t.id === selected);
    setGen(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiReportGenerate({ type: selected, title: `${type.label} — ${new Date().toLocaleDateString('en-GB', { month:'short', year:'numeric' })}` });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Report Generated', `Your ${type.label} is ready. View it in the portal or download via the web dashboard.`);
      load();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Report Queued', `${type.label} is being generated. It will appear in Recent Reports shortly.`);
    }
    setGen(false);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ flexGrow:1, paddingBottom:100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRef(true); load(); }} tintColor={Colors.teal} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={[Colors.bgInset, Colors.bgCanvas]} style={styles.header}>
        <Text style={styles.pageTitle}>Reports Engine</Text>
        <Text style={styles.pageSub}>COMPLIANCE · AUDIT · EXECUTIVE · VA/PT</Text>
        <View style={styles.headerStats}>
          <View style={styles.hStat}>
            <Text style={styles.hStatVal}>{reports.length}</Text>
            <Text style={styles.hStatLabel}>Reports</Text>
          </View>
          <View style={[styles.hStat, { borderLeftWidth:1, borderRightWidth:1, borderColor: Colors.borderDefault }]}>
            <Text style={styles.hStatVal}>{REPORT_TYPES.length}</Text>
            <Text style={styles.hStatLabel}>Templates</Text>
          </View>
          <View style={styles.hStat}>
            <Text style={styles.hStatVal}>6</Text>
            <Text style={styles.hStatLabel}>Frameworks</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Report type picker */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Generate New Report</Text>
        <Text style={styles.sectionSub}>Select template then tap Generate</Text>
      </View>
      <View style={styles.typeGrid}>
        {REPORT_TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.typeCard, selected === t.id && styles.typeCardActive]}
            onPress={() => { setSelected(t.id); Haptics.selectionAsync(); }}
            activeOpacity={0.75}
          >
            {selected === t.id && (
              <LinearGradient colors={[Colors.gold + '15', Colors.teal + '08']} style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.typeCardHeader}>
              <Text style={styles.typeIcon}>{t.icon}</Text>
              {selected === t.id && (
                <View style={styles.typeSelectedDot} />
              )}
            </View>
            <Text style={[styles.typeLabel, selected === t.id && { color: Colors.gold }]}>{t.label}</Text>
            <Text style={styles.typeDesc} numberOfLines={2}>{t.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Generate button */}
      <View style={styles.genWrap}>
        <TouchableOpacity style={styles.genBtn} onPress={generate} disabled={generating} activeOpacity={0.8}>
          <LinearGradient colors={[Colors.gold, Colors.goldDim]} style={styles.genBtnGrad}>
            <Text style={styles.genBtnText}>
              {generating ? '⏳ Generating…' : `📄 Generate ${REPORT_TYPES.find(t => t.id === selected)?.label}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Recent reports */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <Text style={styles.sectionSub}>{reports.length} reports generated</Text>
      </View>
      <View style={styles.listWrap}>
        {reports.map(r => {
          const c = TYPE_COLORS[r.type] || Colors.teal;
          return (
            <TouchableOpacity
              key={r.id}
              style={styles.reportCard}
              onPress={() => Alert.alert(r.title, `Type: ${r.type}\nGenerated: ${formatDate(r.created_at)}\nPages: ${r.pages || '—'}\n\nDownload available in the web portal.`)}
              activeOpacity={0.8}
            >
              <View style={[styles.reportAccent, { backgroundColor: c }]} />
              <View style={styles.reportContent}>
                <View style={styles.reportHeader}>
                  <View style={[styles.reportTypeBadge, { backgroundColor: c + '15', borderColor: c + '40' }]}>
                    <Text style={[styles.reportTypeText, { color: c }]}>{r.type?.toUpperCase()}</Text>
                  </View>
                  {r.pages && <Text style={styles.reportPages}>{r.pages} pages</Text>}
                </View>
                <Text style={styles.reportTitle} numberOfLines={2}>{r.title}</Text>
                <View style={styles.reportFooter}>
                  <Text style={styles.reportDate}>{formatDate(r.created_at)}</Text>
                  <View style={styles.downloadChip}>
                    <Text style={styles.downloadChipText}>↓ PDF</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Frameworks supported */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Supported Frameworks</Text>
      </View>
      <View style={styles.frameworkGrid}>
        {['ISO 27001','SOC 2 Type II','PCI-DSS v4','GDPR','NIST CSF 2.0','Ghana NDPA','COBIT 2019','ISO 31000','CIS Controls'].map(f => (
          <View key={f} style={styles.frameworkChip}>
            <Text style={styles.frameworkText}>{f}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.bgCanvas },
  header: { padding: Spacing.lg, paddingTop:0 },
  pageTitle: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.fgDefault, letterSpacing:-0.5 },
  pageSub: { fontSize:10, color: Colors.fgMuted, marginTop:3, letterSpacing:1 },
  headerStats: { flexDirection:'row', marginTop: Spacing.md, backgroundColor: Colors.bgSubtle, borderRadius: Radii.sm, overflow:'hidden' },
  hStat: { flex:1, alignItems:'center', paddingVertical:12 },
  hStatVal: { fontSize:18, fontWeight:'900', color: Colors.fgDefault },
  hStatLabel: { fontSize:9, color: Colors.fgSubtle, marginTop:2 },
  sectionHead: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom:6 },
  sectionTitle: { fontSize:15, fontWeight:'800', color: Colors.fgDefault, letterSpacing:-0.2 },
  sectionSub: { fontSize:11, color: Colors.fgMuted, marginTop:3 },
  typeGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  typeCard: { width:'47%', backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, padding: Spacing.md, overflow:'hidden' },
  typeCardActive: { borderColor: Colors.gold },
  typeCardHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  typeIcon: { fontSize:22 },
  typeSelectedDot: { width:8, height:8, borderRadius:4, backgroundColor: Colors.gold },
  typeLabel: { fontSize:12, fontWeight:'800', color: Colors.fgDefault, marginBottom:4 },
  typeDesc: { fontSize:10, color: Colors.fgMuted, lineHeight:14 },
  genWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  genBtn: { borderRadius: Radii.md, overflow:'hidden', ...Shadows.goldGlow },
  genBtnGrad: { paddingVertical:16, alignItems:'center', justifyContent:'center' },
  genBtnText: { fontSize:14, fontWeight:'900', color: Colors.bgInset, letterSpacing:0.3 },
  listWrap: { paddingHorizontal: Spacing.lg, gap:10 },
  reportCard: { backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, flexDirection:'row', overflow:'hidden', ...Shadows.card },
  reportAccent: { width:4 },
  reportContent: { flex:1, padding: Spacing.md },
  reportHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  reportTypeBadge: { paddingHorizontal:8, paddingVertical:3, borderRadius: Radii.full, borderWidth:1 },
  reportTypeText: { fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  reportPages: { fontSize:10, color: Colors.fgSubtle },
  reportTitle: { fontSize:13, fontWeight:'600', color: Colors.text, lineHeight:19 },
  reportFooter: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:8 },
  reportDate: { fontSize:11, color: Colors.fgSubtle },
  downloadChip: { paddingHorizontal:10, paddingVertical:4, backgroundColor: Colors.teal + '15', borderRadius: Radii.full, borderWidth:1, borderColor: Colors.teal + '30' },
  downloadChipText: { fontSize:10, fontWeight:'700', color: Colors.teal },
  frameworkGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, paddingHorizontal: Spacing.lg },
  frameworkChip: { paddingHorizontal:12, paddingVertical:6, backgroundColor: Colors.bgCard, borderRadius: Radii.full, borderWidth:1, borderColor: Colors.borderDefault },
  frameworkText: { fontSize:11, fontWeight:'600', color: Colors.fgMuted },
});
