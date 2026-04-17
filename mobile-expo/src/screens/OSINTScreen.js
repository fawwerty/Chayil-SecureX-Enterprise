// ═══════════════════════════════════════════════════════════════════════
// OSINT SCREEN — Domain · IP · Email · Hash Intelligence
// ═══════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiOsintDomain, apiOsintIP, apiOsintEmail, apiOsintHash } from '../services/api';
import { Colors, Spacing, Radii, Shadows } from '../theme';

const TYPES = [
  { id:'domain', icon:'🌐', label:'Domain', placeholder:'example.com' },
  { id:'ip',     icon:'📡', label:'IP Addr', placeholder:'1.2.3.4' },
  { id:'email',  icon:'📧', label:'Email',  placeholder:'user@company.com' },
  { id:'hash',   icon:'#️⃣', label:'Hash',   placeholder:'md5 / sha1 / sha256' },
];

const RISK_COLOR = { HIGH: Colors.danger, MEDIUM: Colors.warning, LOW: Colors.success };

function KVRow({ label, value, accent }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvValue, accent && { color: accent }]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}
function ResultCard({ title, children }) {
  return (
    <View style={styles.resultBlock}>
      <Text style={styles.resultBlockTitle}>{title}</Text>
      <View style={styles.resultCard}>{children}</View>
    </View>
  );
}
function ProgressBar({ value, color }) {
  return (
    <View style={styles.progressTrack}>
      <LinearGradient colors={[color, color+'80']} start={{x:0,y:0}} end={{x:1,y:0}}
        style={[styles.progressFill, { width:`${Math.min(value,100)}%` }]} />
    </View>
  );
}

// Demo fallback data
function demoResult(type, q) {
  const score = Math.floor(Math.random() * 60) + 5;
  return {
    [type]: q, timestamp: new Date().toISOString(),
    risk_score: score, risk_level: score > 50 ? 'MEDIUM' : 'LOW',
    dns: { A:['104.21.5.212'], MX:['mail.' + q], NS:['ns1.cloudflare.com', 'ns2.cloudflare.com'] },
    whois: { registrar:'Cloudflare, Inc.', creation_date:'2019-06-12', expiry_date:'2027-06-12' },
    virustotal: { malicious: score > 50 ? 2 : 0, total:72 },
    abuseipdb: { abuseConfidenceScore: score > 50 ? score : 0, totalReports: score > 50 ? 3 : 0 },
    geo: { country:'United States', city:'San Francisco', isp:'Cloudflare Inc.', lat:'37.77', lon:'-122.41' },
    shodan: { ports:[80,443], org:'Cloudflare' },
    ioc_match: null,
  };
}

export default function OSINTScreen() {
  const [type, setType]       = useState('domain');
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const lookup = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const fns = { domain: apiOsintDomain, ip: apiOsintIP, email: apiOsintEmail, hash: apiOsintHash };
      const r = await fns[type](query.trim());
      setResult(r.data.result);
    } catch { setResult(demoResult(type, query.trim())); }
    setLoading(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const rc = RISK_COLOR[result?.risk_level] || Colors.teal;

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.root} contentContainerStyle={{ flexGrow:1, paddingBottom:100 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.bgInset, Colors.bgCanvas]} style={styles.header}>
          <Text style={styles.pageTitle}>OSINT Intelligence</Text>
          <Text style={styles.pageSub}>DOMAIN · IP · EMAIL · HASH ENRICHMENT</Text>
        </LinearGradient>

        {/* Type selector */}
        <View style={styles.typeGrid}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeCard, type === t.id && styles.typeCardActive]}
              onPress={() => { setType(t.id); setQuery(''); setResult(null); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, type === t.id && { color: Colors.teal }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.queryInput} value={query} onChangeText={setQuery}
            placeholder={TYPES.find(t => t.id === type)?.placeholder}
            placeholderTextColor={Colors.fgSubtle}
            autoCapitalize="none" autoCorrect={false}
            keyboardType={type === 'email' ? 'email-address' : 'url'}
            returnKeyType="search" onSubmitEditing={lookup}
          />
          <TouchableOpacity style={styles.lookupBtn} onPress={lookup} disabled={loading}>
            <LinearGradient colors={[Colors.teal, Colors.cyanDim]} style={styles.lookupBtnGrad}>
              <Text style={styles.lookupBtnText}>{loading ? '…' : 'Lookup →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Loading pulse */}
        {loading && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Querying {type} intelligence…</Text>
            <View style={styles.loadingDots}>
              {[0,1,2].map(i => <View key={i} style={[styles.loadingDot, { opacity: 0.3 + i * 0.3 }]} />)}
            </View>
          </View>
        )}

        {/* Results */}
        {result && !loading && (
          <View style={{ paddingHorizontal: Spacing.lg }}>

            {/* Risk banner */}
            <View style={[styles.riskBanner, { borderColor: rc + '40' }]}>
              <LinearGradient colors={[rc + '18', 'transparent']} style={styles.riskBannerGrad}>
                <View>
                  <Text style={styles.riskBannerLabel}>RISK ASSESSMENT</Text>
                  <Text style={[styles.riskBannerValue, { color: rc }]}>{result.risk_level || 'UNKNOWN'}</Text>
                </View>
                <View style={[styles.riskCircle, { borderColor: rc + '60' }]}>
                  <Text style={[styles.riskScore, { color: rc }]}>{result.risk_score || 0}</Text>
                  <Text style={styles.riskMax}>/100</Text>
                </View>
              </LinearGradient>
            </View>

            {/* DNS */}
            {type === 'domain' && result.dns && (
              <ResultCard title="DNS Records">
                {result.dns.A?.length > 0    && <KVRow label="A Records"    value={(result.dns.A  || []).join(', ')} />}
                {result.dns.MX?.length > 0   && <KVRow label="MX Records"   value={(result.dns.MX || []).join(', ')} />}
                {result.dns.NS?.length > 0   && <KVRow label="Nameservers"  value={(result.dns.NS || []).join(', ')} />}
                {result.dns.TXT?.length > 0  && <KVRow label="TXT Records"  value={(result.dns.TXT|| []).slice(0,2).join(' ')} />}
              </ResultCard>
            )}

            {/* WHOIS */}
            {type === 'domain' && result.whois && (
              <ResultCard title="WHOIS">
                <KVRow label="Registrar"  value={result.whois.registrar} />
                <KVRow label="Created"    value={result.whois.creation_date} />
                <KVRow label="Expires"    value={result.whois.expiry_date} />
              </ResultCard>
            )}

            {/* Geolocation */}
            {type === 'ip' && result.geo && Object.keys(result.geo).length > 0 && (
              <ResultCard title="Geolocation">
                <KVRow label="Country"  value={result.geo.country} />
                <KVRow label="City"     value={result.geo.city} />
                <KVRow label="ISP"      value={result.geo.isp} />
                <KVRow label="AS"       value={result.geo.as} />
              </ResultCard>
            )}

            {/* Shodan */}
            {type === 'ip' && result.shodan?.ports && (
              <ResultCard title="Shodan">
                <KVRow label="Open Ports" value={(result.shodan.ports || []).join(', ') || '—'} />
                <KVRow label="Org"        value={result.shodan.org} />
                {result.shodan.vulns?.length > 0 && (
                  <KVRow label="Vulns" value={result.shodan.vulns.slice(0,3).join(', ')} accent={Colors.danger} />
                )}
              </ResultCard>
            )}

            {/* AbuseIPDB */}
            {result.abuseipdb && (
              <ResultCard title="AbuseIPDB">
                <KVRow label="Abuse Score"   value={`${result.abuseipdb.abuseConfidenceScore || 0}%`}
                  accent={(result.abuseipdb.abuseConfidenceScore || 0) > 30 ? Colors.danger : Colors.success} />
                <KVRow label="Total Reports" value={String(result.abuseipdb.totalReports || 0)} />
                {result.abuseipdb.note && <KVRow label="Note" value={result.abuseipdb.note} />}
              </ResultCard>
            )}

            {/* VirusTotal */}
            {result.virustotal && (
              <ResultCard title="VirusTotal">
                <KVRow label="Detections"
                  value={`${result.virustotal.malicious || 0} / ${result.virustotal.total || 72} engines`}
                  accent={(result.virustotal.malicious || 0) > 0 ? Colors.danger : Colors.success} />
              </ResultCard>
            )}

            {/* Email DNS */}
            {type === 'email' && result.mx_records && (
              <ResultCard title="Mail Servers">
                <KVRow label="MX Records" value={(result.mx_records || []).join(', ')} />
                <KVRow label="Valid Domain" value={result.domain_dns_valid ? 'Yes ✓' : 'Unresolvable'} accent={result.domain_dns_valid ? Colors.success : Colors.danger} />
              </ResultCard>
            )}

            {/* IOC match */}
            {result.ioc_match && (
              <View style={styles.iocMatchCard}>
                <Text style={{ fontSize:20 }}>⚠️</Text>
                <View>
                  <Text style={styles.iocMatchTitle}>Found in Local IOC Database</Text>
                  <Text style={styles.iocMatchSub}>{result.ioc_match.description}</Text>
                </View>
              </View>
            )}

            <Text style={styles.queryTime}>
              Queried at {new Date(result.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.bgCanvas },
  header: { padding: Spacing.lg, paddingTop:0 },
  pageTitle: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.fgDefault, letterSpacing:-0.5 },
  pageSub: { fontSize:10, color: Colors.fgMuted, marginTop:3, letterSpacing:1 },
  typeGrid: { flexDirection:'row', gap:8, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  typeCard: { flex:1, backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, padding:10, alignItems:'center', gap:4 },
  typeCardActive: { borderColor: Colors.teal, backgroundColor: Colors.teal + '12' },
  typeIcon: { fontSize:20 },
  typeLabel: { fontSize:10, fontWeight:'700', color: Colors.fgMuted },
  inputWrap: { paddingHorizontal: Spacing.lg, gap:10, marginBottom: Spacing.lg },
  queryInput: { backgroundColor: Colors.bgSubtle, borderWidth:1, borderColor: Colors.borderDefault, borderRadius: Radii.md, padding:14, color: Colors.text, fontSize:14 },
  lookupBtn: { borderRadius: Radii.md, overflow:'hidden' },
  lookupBtnGrad: { paddingVertical:14, alignItems:'center', justifyContent:'center' },
  lookupBtnText: { fontSize:14, fontWeight:'800', color: Colors.bgInset },
  loadingWrap: { alignItems:'center', paddingVertical: Spacing.xxl },
  loadingText: { fontSize:13, color: Colors.fgMuted, marginBottom:12 },
  loadingDots: { flexDirection:'row', gap:8 },
  loadingDot: { width:8, height:8, borderRadius:4, backgroundColor: Colors.teal },
  riskBanner: { borderRadius: Radii.lg, borderWidth:1, marginBottom: Spacing.md, overflow:'hidden', ...Shadows.card },
  riskBannerGrad: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: Spacing.lg },
  riskBannerLabel: { fontSize:10, color: Colors.fgMuted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 },
  riskBannerValue: { fontSize:FontSize['3xl'], fontWeight:'900', letterSpacing:-0.5 },
  riskCircle: { width:60, height:60, borderRadius:30, backgroundColor: Colors.bgSubtle, borderWidth:1, alignItems:'center', justifyContent:'center' },
  riskScore: { fontSize:FontSize['3xl'], fontWeight:'900' },
  riskMax: { fontSize:9, color: Colors.fgSubtle },
  resultBlock: { marginBottom: Spacing.md },
  resultBlockTitle: { fontSize:10, fontWeight:'700', color: Colors.fgMuted, textTransform:'uppercase', letterSpacing:1.2, marginBottom:6 },
  resultCard: { backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, padding: Spacing.md },
  kvRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:9, borderBottomWidth:1, borderBottomColor: Colors.borderDefault },
  kvLabel: { fontSize:12, color: Colors.fgMuted, flex:1 },
  kvValue: { fontSize:12, color: Colors.fgDefault, fontWeight:'600', flex:2, textAlign:'right' },
  iocMatchCard: { flexDirection:'row', gap:10, padding: Spacing.md, backgroundColor:'rgba(240,82,82,0.08)', borderRadius: Radii.md, borderWidth:1, borderColor:'rgba(240,82,82,0.3)', marginBottom: Spacing.md },
  iocMatchTitle: { fontSize:13, fontWeight:'800', color: Colors.danger, marginBottom:3 },
  iocMatchSub: { fontSize:11, color: Colors.fgMuted },
  queryTime: { fontSize:10, color: Colors.fgSubtle, textAlign:'center', paddingVertical: Spacing.lg },
  progressTrack: { height:4, backgroundColor: Colors.bgSubtle, borderRadius:2, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:2 },
});
