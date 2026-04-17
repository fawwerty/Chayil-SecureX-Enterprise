// ═══════════════════════════════════════════════════════════════════════
// PROFILE SCREEN — Account · Settings · Logout
// ═══════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radii, Shadows } from '../theme';

function SettingRow({ icon, label, subtitle, value, onToggle, onPress, valueText, danger }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.75} style={styles.settingRow}>
      <View style={[styles.settingIconBox, danger && { backgroundColor: Colors.danger + '15', borderColor: Colors.danger + '30' }]}>
        <Text style={{ fontSize:15 }}>{icon}</Text>
      </View>
      <View style={{ flex:1 }}>
        <Text style={[styles.settingLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onToggle
        ? <Switch value={value} onValueChange={v => { onToggle(v); Haptics.selectionAsync(); }}
            trackColor={{ false: Colors.bgSubtle, true: Colors.teal + '80' }}
            thumbColor={value ? Colors.teal : Colors.fgMuted} />
        : valueText
          ? <Text style={styles.settingValueText}>{valueText}</Text>
          : onPress
            ? <Text style={{ color: Colors.fgSubtle, fontSize:18 }}>›</Text>
            : null
      }
    </Wrapper>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notif,  setNotif]  = useState(true);
  const [biometric, setBio] = useState(false);
  const [critOnly, setCrit] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Chayil SecureX?', [
      { text:'Cancel', style:'cancel' },
      { text:'Sign Out', style:'destructive', onPress: async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await logout();
        router.replace('/');
      }},
    ]);
  };

  const roleColors = {
    admin:   { bg: Colors.gold + '15', border: Colors.gold + '40', text: Colors.gold },
    analyst: { bg: Colors.teal + '15', border: Colors.teal + '40', text: Colors.teal },
    client:  { bg: Colors.fgMuted + '20', border: Colors.borderDefault, text: Colors.fgMuted },
  };
  const rc = roleColors[user?.role] || roleColors.analyst;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ flexGrow:1, paddingBottom:100 }} showsVerticalScrollIndicator={false}>

      {/* Hero header */}
      <LinearGradient colors={[Colors.bgInset, Colors.bgOverlay, Colors.bgCanvas]} style={styles.heroHeader}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <LinearGradient colors={[Colors.gold, Colors.teal]} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.userName}>{user?.name || user?.email || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={[styles.roleBadge, { backgroundColor: rc.bg, borderColor: rc.border }]}>
          <Text style={[styles.roleText, { color: rc.text }]}>{(user?.role || 'analyst').toUpperCase()}</Text>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Organisation', val: user?.org_name || 'Chayil SecureX' },
            { label: 'Status',       val: 'Active ●' },
            { label: 'Access',       val: '24/7' },
          ].map((s,i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.statsDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statVal} numberOfLines={1}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      {/* Certifications */}
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Team Certifications</Text></View>
      <View style={styles.certRow}>
        {['CISA','CISSP','CISM','CRISC','ISO 27001 LA','CEH','CDPSE'].map(c => (
          <View key={c} style={styles.certChip}><Text style={styles.certText}>{c}</Text></View>
        ))}
      </View>

      {/* Notification settings */}
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Notifications</Text></View>
      <View style={styles.settingsCard}>
        <SettingRow icon="🔔" label="Push Alerts" subtitle="Threat and scan notifications" value={notif} onToggle={setNotif} />
        <View style={styles.divider} />
        <SettingRow icon="🔴" label="Critical Alerts Only" subtitle="Suppress low/medium severity" value={critOnly} onToggle={setCrit} />
        <View style={styles.divider} />
        <SettingRow icon="🛡️" label="Biometric Login" subtitle="Face ID / Fingerprint" value={biometric} onToggle={setBio} />
      </View>

      {/* Security */}
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Security & Access</Text></View>
      <View style={styles.settingsCard}>
        <SettingRow icon="🔑" label="Change Password" subtitle="Last changed 30 days ago" onPress={() => Alert.alert('Change Password','Use the web portal at chayilsecurex.com to change your password.')} />
        <View style={styles.divider} />
        <SettingRow icon="📋" label="Audit Log" subtitle="Your recent activity" onPress={() => Alert.alert('Audit Log','Full audit trail available in the web portal under Settings → Audit.')} />
        <View style={styles.divider} />
        <SettingRow icon="🔗" label="API Token" subtitle="For API integrations" valueText="••••abcd" onPress={() => Alert.alert('API Token','Manage API tokens in the web portal under IAM → API Keys.')} />
        <View style={styles.divider} />
        <SettingRow icon="📱" label="Active Sessions" subtitle="2 sessions" onPress={() => Alert.alert('Sessions','Manage sessions in the web portal.')} />
      </View>

      {/* Platform */}
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Platform</Text></View>
      <View style={styles.settingsCard}>
        <SettingRow icon="🌐" label="Web Portal" subtitle="chayilsecurex.com" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingRow icon="📞" label="Support" subtitle="chayilsecurex@gmail.com" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingRow icon="📄" label="Privacy Policy" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingRow icon="⚖️" label="Terms of Service" onPress={() => {}} />
      </View>

      {/* Logout */}
      <View style={styles.logoutWrap}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={['rgba(240,82,82,0.15)','rgba(240,82,82,0.08)']} style={styles.logoutBtnInner}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>CHAYIL <Text style={{ color: Colors.gold }}>SECUREX</Text></Text>
        <Text style={styles.footerVersion}>Mobile v2.0.0  ·  Platform v2.0.0</Text>
        <Text style={styles.footerTagline}>Africa's Premier Cybersecurity Platform</Text>
        <Text style={styles.footerLocation}>📍 Accra, Ghana</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.bgCanvas },

  heroHeader: { alignItems:'center', padding: Spacing.xl, paddingBottom: Spacing.xxl },
  avatarWrap: { position:'relative', marginBottom: Spacing.md },
  avatar: { width:80, height:80, borderRadius:40, alignItems:'center', justifyContent:'center', ...Shadows.goldGlow },
  avatarText: { fontSize:32, fontWeight:'900', color: Colors.bgInset },
  onlineDot: { position:'absolute', bottom:2, right:2, width:16, height:16, borderRadius:8, backgroundColor: Colors.success, borderWidth:2, borderColor: Colors.bgInset },
  userName: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.fgDefault, letterSpacing:-0.5 },
  userEmail: { fontSize:13, color: Colors.fgMuted, marginTop:4, marginBottom:12 },
  roleBadge: { paddingHorizontal:16, paddingVertical:5, borderRadius: Radii.full, borderWidth:1, marginBottom: Spacing.lg },
  roleText: { fontSize:11, fontWeight:'800', letterSpacing:1.5 },
  statsRow: { flexDirection:'row', backgroundColor: Colors.bgSubtle, borderRadius: Radii.md, borderWidth:1, borderColor: Colors.borderDefault, overflow:'hidden', width:'100%' },
  statItem: { flex:1, alignItems:'center', paddingVertical:14 },
  statsDivider: { width:1, backgroundColor: Colors.borderDefault, marginVertical:10 },
  statVal: { fontSize:12, fontWeight:'700', color: Colors.fgDefault, maxWidth:90 },
  statLabel: { fontSize:9, color: Colors.fgSubtle, marginTop:2 },

  sectionHead: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom:6 },
  sectionTitle: { fontSize:13, fontWeight:'700', color: Colors.fgMuted, textTransform:'uppercase', letterSpacing:1 },

  certRow: { flexDirection:'row', flexWrap:'wrap', gap:8, paddingHorizontal: Spacing.lg, marginBottom:4 },
  certChip: { paddingHorizontal:12, paddingVertical:6, backgroundColor: Colors.teal + '12', borderRadius: Radii.full, borderWidth:1, borderColor: Colors.teal + '30' },
  certText: { fontSize:11, fontWeight:'700', color: Colors.teal },

  settingsCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radii.lg, borderWidth:1, borderColor: Colors.borderDefault, overflow:'hidden' },
  settingRow: { flexDirection:'row', alignItems:'center', padding: Spacing.md, gap:12 },
  settingIconBox: { width:36, height:36, borderRadius: Radii.sm, backgroundColor: Colors.bgSubtle, borderWidth:1, borderColor: Colors.borderDefault, alignItems:'center', justifyContent:'center' },
  settingLabel: { fontSize:14, fontWeight:'600', color: Colors.text },
  settingSubtitle: { fontSize:11, color: Colors.fgMuted, marginTop:2 },
  settingValueText: { fontSize:12, color: Colors.fgMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  divider: { height:1, backgroundColor: Colors.borderDefault, marginLeft:60 },

  logoutWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  logoutBtn: { borderRadius: Radii.md, overflow:'hidden', borderWidth:1, borderColor:'rgba(240,82,82,0.3)' },
  logoutBtnInner: { paddingVertical:16, alignItems:'center', justifyContent:'center' },
  logoutText: { fontSize:14, fontWeight:'800', color: Colors.danger },

  footer: { alignItems:'center', paddingVertical: Spacing.xxl, paddingBottom:40 },
  footerBrand: { fontSize:14, fontWeight:'900', color: Colors.fgDefault, letterSpacing:1, marginBottom:6 },
  footerVersion: { fontSize:11, color: Colors.fgSubtle, marginBottom:4 },
  footerTagline: { fontSize:11, color: Colors.fgSubtle, marginBottom:4 },
  footerLocation: { fontSize:11, color: Colors.fgSubtle },
});
