// ═══════════════════════════════════════════════════════════════════════
// INCIDENTS SCREEN — Triage · Manage · Resolve
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiIncidents, apiIncidentUpdate } from '../services/api';
import { Colors, Spacing, Radii, Shadows } from '../theme';

const { height: H } = Dimensions.get('window');

const DEMO = [
  { id:'INC-001', title:'Brute force attack detected on VPN gateway', severity:'critical', status:'Open',
    assignee:'Silas A.', category:'Intrusion', updated_at: new Date(Date.now()-120000).toISOString(),
    description:'Multiple failed SSH/VPN login attempts from 185.220.101.42 (Tor exit node). 847 attempts in 10 minutes. Geo: Netherlands.' },
  { id:'INC-002', title:'Ransomware behaviour on endpoint WS-045', severity:'critical', status:'In Progress',
    assignee:'Charles H.', category:'Ransomware', updated_at: new Date(Date.now()-480000).toISOString(),
    description:'Endpoint WS-045 (Finance dept) showing mass file encryption. Isolated from network. Crypto-locker variant identified. Investigating backup viability.' },
  { id:'INC-003', title:'Suspicious C2 outbound — 203.0.113.195', severity:'high', status:'Open',
    assignee:'Ebenezer O.', category:'C2 Comms', updated_at: new Date(Date.now()-900000).toISOString(),
    description:'Internal host 192.168.1.55 making periodic HTTPS connections to known C2 IP. Beacon interval ~5 min. Possible Cobalt Strike.' },
  { id:'INC-004', title:'Admin login from Lagos — unexpected geography', severity:'high', status:'In Progress',
    assignee:'Silas A.', category:'Account Compromise', updated_at: new Date(Date.now()-3600000).toISOString(),
    description:'Admin account login from 41.206.0.0/18 (Lagos, NG). Normal location is Accra, GH. MFA appears to have been bypassed. Checking for session hijack.' },
  { id:'INC-005', title:'SSL certificate expiring — api.company.com', severity:'medium', status:'Open',
    assignee:'Charles H.', category:'Availability', updated_at: new Date(Date.now()-7200000).toISOString(),
    description:'Production API certificate expires in 12 days. Auto-renewal failed due to DNS propagation issue. Manual renewal required.' },
  { id:'INC-006', title:'TLS 1.0 still enabled on legacy payment API', severity:'low', status:'Closed',
    assignee:'Ebenezer O.', category:'Configuration', updated_at: new Date(Date.now()-86400000).toISOString(),
    description:'Resolved: disabled TLS 1.0/1.1 on legacy payment processor API. Now enforcing TLS 1.2+ minimum.' },
];

const SEV = { critical: Colors.danger, high: Colors.warning, medium: Colors.gold, low: Colors.success };
const STA = { 'Open': Colors.danger, 'In Progress': Colors.warning, 'Closed': Colors.success };

function timeAgo(iso) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}

function Badge({ label, color, bg }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg || color + '15', borderColor: color + '40' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState(DEMO);
  const [filter, setFilter]       = useState('All');
  const [selected, setSelected]   = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await apiIncidents();
      if (r.data.incidents?.length) setIncidents(r.data.incidents);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All' ? incidents : incidents.filter(i => i.status === filter);
  const counts = {
    Open: incidents.filter(i => i.status === 'Open').length,
    'In Progress': incidents.filter(i => i.status === 'In Progress').length,
    Closed: incidents.filter(i => i.status === 'Closed').length,
  };

  const open = (inc) => { setSelected(inc); setModalOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const updateStatus = async (id, status) => {
    setIncidents(p => p.map(i => i.id === id ? { ...i, status } : i));
    if (selected?.id === id) setSelected(p => ({ ...p, status }));
    try { await apiIncidentUpdate(id, { status }); } catch {}
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (status === 'Closed') setTimeout(() => setModalOpen(false), 600);
  };

  return (
    <View style={{ flex:1, backgroundColor: Colors.bgCanvas }}>
      <ScrollView
        contentContainerStyle={{ flexGrow:1, paddingBottom:100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.teal} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.bgInset, Colors.bgCanvas]} style={styles.header}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
            <View>
              <Text style={styles.pageTitle}>Incident Response</Text>
              <Text style={styles.pageSub}>TRIAGE · MANAGE · RESOLVE</Text>
            </View>
            {counts.Open > 0 && (
              <View style={styles.critBadge}>
                <Text style={styles.critBadgeText}>{counts.Open} OPEN</Text>
              </View>
            )}
          </View>
          {/* Status counts */}
          <View style={styles.statRow}>
            {[
              { label:'Open',        val: counts.Open,            c: Colors.danger },
              { label:'In Progress', val: counts['In Progress'],  c: Colors.warning },
              { label:'Closed',      val: counts.Closed,          c: Colors.success },
              { label:'Total',       val: incidents.length,       c: Colors.teal },
            ].map((s,i) => (
              <View key={i} style={[styles.statChip, { borderColor: s.c + '40' }]}>
                <Text style={[styles.statChipVal, { color: s.c }]}>{s.val}</Text>
                <Text style={styles.statChipLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['All','Open','In Progress','Closed'].map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              {f !== 'All' && counts[f] > 0 && (
                <View style={[styles.filterCount, { backgroundColor: STA[f] + '30' }]}>
                  <Text style={[styles.filterCountText, { color: STA[f] }]}>{counts[f]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        <View style={styles.listWrap}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>No incidents found</Text>
              <Text style={styles.emptySub}>No {filter.toLowerCase()} incidents in this org.</Text>
            </View>
          ) : filtered.map(inc => (
            <TouchableOpacity key={inc.id} onPress={() => open(inc)} activeOpacity={0.82}>
              <View style={styles.incCard}>
                <View style={[styles.incSevBar, { backgroundColor: SEV[inc.severity] || Colors.teal }]} />
                <View style={styles.incContent}>
                  <View style={styles.incHeader}>
                    <Text style={styles.incId}>{inc.id}</Text>
                    <Badge label={inc.severity?.toUpperCase()} color={SEV[inc.severity] || Colors.teal} />
                    <Badge label={inc.status} color={STA[inc.status] || Colors.teal} />
                  </View>
                  <Text style={styles.incTitle} numberOfLines={2}>{inc.title}</Text>
                  <View style={styles.incFooter}>
                    <Text style={styles.incAssignee}>👤 {inc.assignee}</Text>
                    <Text style={styles.incTime}>{timeAgo(inc.updated_at)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        {selected && (
          <View style={styles.modal}>
            <LinearGradient colors={[Colors.bgInset, Colors.bgCanvas]} style={{ flex:1 }}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <View style={{ flex:1 }}>
                  <Text style={styles.modalId}>{selected.id}</Text>
                  <Text style={styles.modalTitle} numberOfLines={3}>{selected.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                  <Text style={{ color: Colors.fgMuted, fontSize:18 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}>
                {/* Badges */}
                <View style={{ flexDirection:'row', gap:8, marginBottom: Spacing.lg }}>
                  <Badge label={selected.severity?.toUpperCase()} color={SEV[selected.severity] || Colors.teal} />
                  <Badge label={selected.status} color={STA[selected.status] || Colors.teal} />
                  <Badge label={selected.category || 'General'} color={Colors.fgMuted} />
                </View>

                {/* Description */}
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>DESCRIPTION</Text>
                  <Text style={styles.detailText}>{selected.description || 'No description provided.'}</Text>
                </View>

                {/* Meta */}
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>DETAILS</Text>
                  {[
                    { k:'Assignee',     v: selected.assignee },
                    { k:'Category',     v: selected.category },
                    { k:'Last Updated', v: timeAgo(selected.updated_at) },
                    { k:'Status',       v: selected.status },
                  ].map((d,i) => (
                    <View key={i} style={[styles.kvRow, i > 0 && { borderTopWidth:1, borderTopColor: Colors.borderDefault }]}>
                      <Text style={styles.kvLabel}>{d.k}</Text>
                      <Text style={styles.kvValue}>{d.v || '—'}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                {selected.status !== 'Closed' && (
                  <View style={styles.actionsWrap}>
                    <Text style={styles.detailLabel}>UPDATE STATUS</Text>
                    {selected.status === 'Open' && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(selected.id, 'In Progress')}>
                        <LinearGradient colors={[Colors.teal, Colors.cyanDim]} style={styles.actionBtnGrad}>
                          <Text style={styles.actionBtnText}>▶ Mark In Progress</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, { marginTop:10 }]} onPress={() => updateStatus(selected.id, 'Closed')}>
                      <LinearGradient colors={[Colors.success + 'CC', Colors.success + '88']} style={styles.actionBtnGrad}>
                        <Text style={styles.actionBtnText}>✓ Resolve & Close</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
                {selected.status === 'Closed' && (
                  <View style={styles.resolvedBanner}>
                    <Text style={styles.resolvedText}>✓ Incident Resolved</Text>
                  </View>
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.lg, paddingTop:0 },
  pageTitle: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.fgDefault, letterSpacing:-0.5 },
  pageSub: { fontSize:10, color: Colors.fgMuted, marginTop:3, letterSpacing:1 },
  critBadge: { paddingHorizontal:10, paddingVertical:5, backgroundColor:'rgba(240,82,82,0.15)', borderRadius: Radii.full, borderWidth:1, borderColor:'rgba(240,82,82,0.4)' },
  critBadgeText: { fontSize:10, fontWeight:'800', color: Colors.danger, letterSpacing:0.5 },
  statRow: { flexDirection:'row', gap:8, marginTop: Spacing.md },
  statChip: { flex:1, alignItems:'center', paddingVertical:10, backgroundColor: Colors.bgSubtle, borderRadius: Radii.sm, borderWidth:1 },
  statChipVal: { fontSize:18, fontWeight:'900' },
  statChipLabel: { fontSize:9, color: Colors.fgSubtle, marginTop:2 },
  filterRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap:8 },
  filterChip: { paddingHorizontal:14, paddingVertical:7, backgroundColor: Colors.bgSubtle, borderRadius: Radii.full, borderWidth:1, borderColor: Colors.borderDefault, flexDirection:'row', alignItems:'center', gap:6 },
  filterChipActive: { backgroundColor: Colors.teal + '18', borderColor: Colors.teal },
  filterText: { fontSize:12, fontWeight:'600', color: Colors.fgMuted },
  filterTextActive: { color: Colors.teal },
  filterCount: { paddingHorizontal:6, paddingVertical:2, borderRadius: Radii.full },
  filterCountText: { fontSize:10, fontWeight:'800' },
  listWrap: { paddingHorizontal: Spacing.lg, gap:10 },
  incCard: { backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, flexDirection:'row', overflow:'hidden', ...Shadows.card },
  incSevBar: { width:4 },
  incContent: { flex:1, padding: Spacing.md },
  incHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' },
  incId: { fontSize:10, fontWeight:'700', color: Colors.fgMuted, fontFamily:'monospace', marginRight:2 },
  incTitle: { fontSize:14, fontWeight:'600', color: Colors.text, lineHeight:20 },
  incFooter: { flexDirection:'row', justifyContent:'space-between', marginTop:8 },
  incAssignee: { fontSize:11, color: Colors.fgMuted },
  incTime: { fontSize:11, color: Colors.fgSubtle },
  badge: { paddingHorizontal:8, paddingVertical:3, borderRadius: Radii.full, borderWidth:1 },
  badgeText: { fontSize:9, fontWeight:'800', letterSpacing:0.3 },
  empty: { alignItems:'center', paddingVertical:48 },
  emptyIcon: { fontSize:40, marginBottom:14 },
  emptyTitle: { fontSize:16, fontWeight:'700', color: Colors.fgDefault },
  emptySub: { fontSize:13, color: Colors.fgMuted, marginTop:6 },
  // Modal
  modal: { flex:1 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', padding: Spacing.lg, paddingTop: Spacing.xxl + 4, borderBottomWidth:1, borderBottomColor: Colors.borderDefault, gap:12 },
  modalId: { fontSize:11, color: Colors.teal, fontWeight:'700', marginBottom:4, fontFamily:'monospace' },
  modalTitle: { fontSize:19, fontWeight:'900', color: Colors.fgDefault, lineHeight:26, letterSpacing:-0.4 },
  closeBtn: { width:32, height:32, borderRadius:16, backgroundColor: Colors.bgSubtle, borderWidth:1, borderColor: Colors.borderDefault, alignItems:'center', justifyContent:'center' },
  detailCard: { backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, padding: Spacing.md, marginBottom: Spacing.md },
  detailLabel: { fontSize:10, fontWeight:'700', color: Colors.fgMuted, textTransform:'uppercase', letterSpacing:1.2, marginBottom: Spacing.sm },
  detailText: { fontSize:14, color: Colors.text, lineHeight:22 },
  kvRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:10 },
  kvLabel: { fontSize:12, color: Colors.fgMuted },
  kvValue: { fontSize:12, color: Colors.fgDefault, fontWeight:'600' },
  actionsWrap: { marginTop: Spacing.sm },
  actionBtn: { borderRadius: Radii.md, overflow:'hidden' },
  actionBtnGrad: { paddingVertical:14, alignItems:'center', justifyContent:'center' },
  actionBtnText: { fontSize:14, fontWeight:'800', color: Colors.bgInset },
  resolvedBanner: { backgroundColor:'rgba(16,185,129,0.12)', borderRadius: Radii.md, borderWidth:1, borderColor:'rgba(16,185,129,0.3)', padding: Spacing.md, alignItems:'center' },
  resolvedText: { fontSize:14, fontWeight:'700', color: Colors.success },
});
