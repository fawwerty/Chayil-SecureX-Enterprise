// ═══════════════════════════════════════════════════════════════════════
// CHAYIL SECUREX — HOME SCREEN
// Animated hero landing + glass auth bottom sheet
// Apple · Stripe · Linear quality — $10K standard
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radii, Shadows } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

// ── Floating particle dot ────────────────────────────────
function Particle({ x, y, size, color, delay }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.9, duration: 2000, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity, transform: [{ translateY }],
    }} />
  );
}

// ── Pulsing shield icon ──────────────────────────────────
function ShieldHero() {
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.08, duration: 2200, useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 1, duration: 2200, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0, duration: 2200, useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 0, duration: 2200, useNativeDriver: false }),
        ]),
      ])
    ).start();
  }, []);
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });
  return (
    <View style={styles.shieldContainer}>
      <Animated.View style={[styles.shieldGlowOuter, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.shieldWrap, { transform: [{ scale }] }]}>
        <LinearGradient colors={[Colors.teal + '30', Colors.gold + '20']} style={styles.shieldGradOuter}>
          <LinearGradient colors={['#21262d', '#161b22']} style={styles.shieldGradInner}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ── Animated stat counter ────────────────────────────────
function StatPill({ value, label, delay }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slide   = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, delay, useNativeDriver: true }),
      Animated.timing(slide,   { toValue: 0, duration: 700, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.statPill, { opacity, transform: [{ translateY: slide }] }]}>
      <Text style={styles.statPillVal}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Demo credential button ───────────────────────────────
function DemoBtn({ role, label, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.demoBtn, { borderColor: color + '40' }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.demoAvatar, { backgroundColor: color + '15' }]}>
        <Text style={[styles.demoAvatarText, { color }]}>{label[0]}</Text>
      </View>
      <View>
        <Text style={[styles.demoBtnTitle, { color }]}>{label}</Text>
        <Text style={styles.demoBtnSub}>{role}@chayilsecurex.com</Text>
      </View>
      <Text style={[styles.demoBtnArrow, { color }]}>→</Text>
    </TouchableOpacity>
  );
}

// ── Main Component ───────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { login, error: authError, clearError } = useAuth();

  const [tab,         setTab]         = useState('signin');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [org,         setOrg]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [sheetOpen,   setSheetOpen]   = useState(false);

  const sheetY   = useRef(new Animated.Value(H)).current;
  const heroOp   = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOp,    { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 800, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const openSheet = (t = 'signin') => {
    setTab(t); clearError();
    setSheetOpen(true);
    Animated.spring(sheetY, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeSheet = () => {
    Animated.timing(sheetY, { toValue: H, duration: 300, useNativeDriver: true }).start(() => setSheetOpen(false));
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const user = await login(email.trim().toLowerCase(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/dashboard');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setSubmitting(false); }
  };

  const handleSignup = async () => {
    if (!firstName || !email || !password) return;
    setSubmitting(true);
    try {
      // Try login with provided creds (real signup via admin provisioning)
      const user = await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/dashboard');
    } catch {
      // Show registration pending message
      setTab('signin');
      setEmail(email);
    }
    setSubmitting(false);
  };

  const fillDemo = (role) => {
    const creds = {
      admin:   { e: 'admin@chayilsecurex.com',   p: 'Admin@2024!' },
      analyst: { e: 'analyst@chayilsecurex.com', p: 'Analyst@2024!' },
      client:  { e: 'client@chayilsecurex.com',  p: 'Client@2024!' },
    };
    setEmail(creds[role].e);
    setPassword(creds[role].p);
    setTab('signin');
    Haptics.selectionAsync();
  };

  const particles = [
    { x: W*0.08, y: H*0.18, size:5, color: Colors.teal+'99', delay:0 },
    { x: W*0.82, y: H*0.13, size:7, color: Colors.gold+'77', delay:400 },
    { x: W*0.60, y: H*0.30, size:4, color: Colors.teal+'88', delay:900 },
    { x: W*0.18, y: H*0.38, size:6, color: Colors.gold+'99', delay:1300 },
    { x: W*0.90, y: H*0.44, size:3, color: Colors.teal+'66', delay:700 },
    { x: W*0.42, y: H*0.08, size:8, color: Colors.gold+'55', delay:200 },
    { x: W*0.72, y: H*0.52, size:4, color: Colors.teal+'88', delay:1100 },
    { x: W*0.12, y: H*0.58, size:5, color: Colors.gold+'77', delay:600 },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={'#0d1117'} />

      {/* Background */}
      <LinearGradient colors={['#0d1117', '#010409', '#161b22']} style={StyleSheet.absoluteFill} />
      <View style={styles.orbTeal} />
      <View style={styles.orbGold} />

      {/* Grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { left: (W / 9) * i }]} />
        ))}
      </View>

      {/* Particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── Hero Content ── */}
      <Animated.View style={[styles.heroContent, { opacity: heroOp, transform: [{ translateY: heroSlide }] }]}>

        {/* Badge */}
        <View style={styles.heroBadge}>
          <View style={styles.heroBadgeDot} />
          <Text style={styles.heroBadgeText}>AFRICA'S PREMIER CYBERSECURITY PLATFORM</Text>
        </View>

        {/* Animated shield */}
        <ShieldHero />

        {/* Headline */}
        <Text style={styles.headline}>
          Securing Africa's{'\n'}
          <Text style={{ color: Colors.gold }}>Digital </Text>
          <Text style={{ color: Colors.teal }}>Future</Text>
        </Text>

        {/* Subheadline */}
        <Text style={styles.subheadline}>
          Chayil SecureX provides integrated risk management and resilience — specialising in Cyber Assurance, IT Auditing, and GRC automation for Africa's leading organisations.
        </Text>

        {/* Feature chips */}
        <View style={styles.chipRow}>
          {[
            { e:'🔍', l:'OSINT' },
            { e:'⚡', l:'SOC' },
            { e:'🐉', l:'Kali Tools' },
            { e:'📋', l:'GRC' },
            { e:'🤖', l:'AI Assist' },
          ].map((c, i) => (
            <View key={i} style={styles.featureChip}>
              <Text style={{ fontSize: 11 }}>{c.e}</Text>
              <Text style={styles.featureChipText}>{c.l}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <StatPill value="200+" label="Audits"  delay={500} />
          <View style={styles.statDiv} />
          <StatPill value="50+"  label="Clients" delay={650} />
          <View style={styles.statDiv} />
          <StatPill value="10+"  label="Years"   delay={800} />
          <View style={styles.statDiv} />
          <StatPill value="24/7" label="SOC"     delay={950} />
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.ctaPrimary} onPress={() => openSheet('signin')} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.gold, Colors.goldDim]} style={styles.ctaPrimaryGrad}>
              <Text style={styles.ctaPrimaryText}>Get Started →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaOutline} onPress={() => openSheet('signup')} activeOpacity={0.8}>
            <Text style={styles.ctaOutlineText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Sheet backdrop ── */}
      {sheetOpen && (
        <TouchableOpacity style={styles.backdrop} onPress={closeSheet} activeOpacity={1} />
      )}

      {/* ── Auth Bottom Sheet ── */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
        pointerEvents={sheetOpen ? 'auto' : 'none'}>
        <View style={styles.sheetHandle} />

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {[['signin','Sign In'], ['signup','Sign Up']].map(([t, l]) => (
            <TouchableOpacity key={t} style={[styles.tab, tab===t && styles.tabActive]}
              onPress={() => { setTab(t); clearError(); }}>
              <Text style={[styles.tabText, tab===t && styles.tabTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Error */}
            {authError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {authError}</Text>
              </View>
            )}

            {tab === 'signin' ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail}
                    placeholder="you@organisation.com" placeholderTextColor={'#6e7681'}
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput style={styles.input} value={password} onChangeText={setPassword}
                    placeholder="••••••••••" placeholderTextColor={'#6e7681'}
                    secureTextEntry returnKeyType="done" onSubmitEditing={handleLogin} />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={submitting} activeOpacity={0.85}>
                  <LinearGradient colors={submitting ? ['#6e7681', '#6e7681'] : [Colors.gold, Colors.goldDim]} style={styles.submitBtnGrad}>
                    <Text style={styles.submitBtnText}>{submitting ? 'Signing in…' : 'Sign In to Portal'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Demo access */}
                <View style={styles.demoSection}>
                  <View style={styles.demoDivRow}>
                    <View style={styles.demoDivLine} />
                    <Text style={styles.demoDivText}>Quick Demo Access</Text>
                    <View style={styles.demoDivLine} />
                  </View>
                  <DemoBtn role="admin"   label="Admin"   color={Colors.gold}     onPress={() => fillDemo('admin')} />
                  <DemoBtn role="analyst" label="Analyst" color={Colors.teal}     onPress={() => fillDemo('analyst')} />
                  <DemoBtn role="client"  label="Client"  color={'#848d97'} onPress={() => fillDemo('client')} />
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex:1 }]}>
                    <Text style={styles.inputLabel}>FIRST NAME</Text>
                    <TextInput style={styles.input} value={firstName} onChangeText={setFirstName}
                      placeholder="Charles" placeholderTextColor={'#6e7681'} />
                  </View>
                  <View style={[styles.inputGroup, { flex:1 }]}>
                    <Text style={styles.inputLabel}>LAST NAME</Text>
                    <TextInput style={styles.input} value={lastName} onChangeText={setLastName}
                      placeholder="Hagan" placeholderTextColor={'#6e7681'} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>WORK EMAIL</Text>
                  <TextInput style={styles.input} value={email} onChangeText={setEmail}
                    placeholder="kwame@company.com" placeholderTextColor={'#6e7681'}
                    keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ORGANISATION</Text>
                  <TextInput style={styles.input} value={org} onChangeText={setOrg}
                    placeholder="Company Ltd" placeholderTextColor={'#6e7681'} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput style={styles.input} value={password} onChangeText={setPassword}
                    placeholder="Min 8 characters" placeholderTextColor={'#6e7681'} secureTextEntry />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSignup} disabled={submitting} activeOpacity={0.85}>
                  <LinearGradient colors={submitting ? ['#6e7681', '#6e7681'] : [Colors.teal, Colors.cyanDim]} style={styles.submitBtnGrad}>
                    <Text style={styles.submitBtnText}>{submitting ? 'Creating account…' : 'Create Account'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  By signing up you agree to our Terms of Service and Privacy Policy
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Bottom CTA (when sheet closed) */}
      {!sheetOpen && (
        <View style={styles.bottomCta}>
          <TouchableOpacity onPress={() => openSheet('signin')} activeOpacity={0.85}>
            <LinearGradient colors={['#21262d', '#161b22']} style={styles.bottomCtaBtn}>
              <Text style={styles.bottomCtaText}>Sign In or Create Account</Text>
              <Text style={styles.bottomCtaArrow}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },

  orbTeal: { position:'absolute', width:380, height:380, borderRadius:190, backgroundColor: Colors.teal+'0A', top:-60, right:-80 },
  orbGold: { position:'absolute', width:300, height:300, borderRadius:150, backgroundColor: Colors.gold+'08', bottom: H*0.28, left:-70 },
  gridLine: { position:'absolute', top:0, bottom:0, width:1, backgroundColor:'rgba(0,212,212,0.03)' },

  heroContent: {
    flex: 1, paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingBottom: 120, alignItems: 'center',
  },

  heroBadge: {
    flexDirection:'row', alignItems:'center', gap:8,
    paddingHorizontal:14, paddingVertical:7,
    backgroundColor:'rgba(0,212,212,0.08)',
    borderRadius: Radii.full, borderWidth:1, borderColor:'rgba(0,212,212,0.22)',
    marginBottom: Spacing.xl,
  },
  heroBadgeDot: { width:6, height:6, borderRadius:3, backgroundColor: Colors.teal },
  heroBadgeText: { fontSize:9, fontWeight:'700', color: Colors.teal, letterSpacing:1.5 },

  shieldContainer: { alignItems:'center', justifyContent:'center', marginBottom: Spacing.xl },
  shieldGlowOuter: {
    position:'absolute', width:130, height:130, borderRadius:65,
    backgroundColor: Colors.teal, filter: undefined,
  },
  shieldWrap: {},
  shieldGradOuter: { width:100, height:100, borderRadius:26, alignItems:'center', justifyContent:'center' },
  shieldGradInner: { width:86, height:86, borderRadius:22, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: 'rgba(240,246,252,0.10)' },
  shieldEmoji: { fontSize:40 },

  headline: {
    fontSize: 36, fontWeight:'900', color: Colors.white,
    textAlign:'center', lineHeight:44, letterSpacing:-1.2,
    marginBottom: Spacing.md,
  },
  subheadline: {
    fontSize:14, color: '#848d97', textAlign:'center',
    lineHeight:22, maxWidth: W*0.85, marginBottom: Spacing.xl,
  },

  chipRow: { flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:8, marginBottom: Spacing.xl },
  featureChip: {
    flexDirection:'row', alignItems:'center', gap:5,
    paddingHorizontal:10, paddingVertical:5,
    backgroundColor:'rgba(255,255,255,0.04)',
    borderRadius: Radii.full, borderWidth:1, borderColor: 'rgba(240,246,252,0.10)',
  },
  featureChipText: { fontSize:11, color: '#848d97', fontWeight:'600' },

  statsBar: {
    flexDirection:'row', alignItems:'center',
    backgroundColor:'rgba(4,13,20,0.75)',
    borderRadius: Radii.lg, borderWidth:1, borderColor: 'rgba(240,246,252,0.10)',
    marginBottom: Spacing.xl, overflow:'hidden',
  },
  statPill: { flex:1, alignItems:'center', paddingVertical:14 },
  statPillVal: { fontSize:FontSize['3xl'], fontWeight:'900', color: Colors.white, letterSpacing:-0.8 },
  statPillLabel: { fontSize:9, color: '#6e7681', marginTop:2, letterSpacing:0.5 },
  statDiv: { width:1, height:32, backgroundColor: 'rgba(240,246,252,0.10)' },

  ctaRow: { flexDirection:'row', gap:12, width:'100%' },
  ctaPrimary: { flex:1, borderRadius: Radii.full, overflow:'hidden', ...Shadows.goldGlow },
  ctaPrimaryGrad: { paddingVertical:15, alignItems:'center', justifyContent:'center' },
  ctaPrimaryText: { fontSize:14, fontWeight:'800', color: '#010409', letterSpacing:0.3 },
  ctaOutline: {
    flex:1, paddingVertical:14, alignItems:'center', justifyContent:'center',
    borderRadius: Radii.full, borderWidth:1.5, borderColor: Colors.teal+'60',
  },
  ctaOutlineText: { fontSize:14, fontWeight:'700', color: Colors.teal },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.65)', zIndex:10 },

  sheet: {
    position:'absolute', left:0, right:0, bottom:0, zIndex:20,
    backgroundColor: '#161b22',
    borderTopLeftRadius:28, borderTopRightRadius:28,
    borderTopWidth:1, borderTopColor: 'rgba(240,246,252,0.10)',
    maxHeight: H * 0.88,
    paddingBottom: Platform.OS==='ios' ? 34 : 20,
  },
  sheetHandle: { width:40, height:4, backgroundColor: 'rgba(240,246,252,0.10)', borderRadius:2, alignSelf:'center', marginVertical:12 },

  tabRow: {
    flexDirection:'row', gap:4,
    backgroundColor: '#21262d', borderRadius: Radii.sm,
    padding:4, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  tab: { flex:1, paddingVertical:10, borderRadius: Radii.xs, alignItems:'center' },
  tabActive: { backgroundColor: '#0d1117' },
  tabText: { fontSize:14, fontWeight:'600', color: '#848d97' },
  tabTextActive: { color: '#e6edf3', fontWeight:'700' },

  errorBox: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    padding: Spacing.md, backgroundColor:'rgba(240,82,82,0.10)',
    borderRadius: Radii.sm, borderWidth:1, borderColor:'rgba(240,82,82,0.28)',
  },
  errorText: { fontSize:13, color: Colors.danger },

  form: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  inputRow: { flexDirection:'row', gap:12 },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize:10, fontWeight:'700', color: '#848d97', letterSpacing:1, marginBottom:6, textTransform:'uppercase' },
  input: {
    backgroundColor: '#21262d', borderWidth:1, borderColor: 'rgba(240,246,252,0.10)',
    borderRadius: Radii.sm, padding:13, color: Colors.text, fontSize:15,
  },

  submitBtn: { borderRadius: Radii.md, overflow:'hidden', marginBottom: Spacing.lg },
  submitBtnGrad: { paddingVertical:15, alignItems:'center', justifyContent:'center' },
  submitBtnText: { fontSize:14, fontWeight:'800', color: '#010409', letterSpacing:0.3 },

  demoSection: { marginTop:4 },
  demoDivRow: { flexDirection:'row', alignItems:'center', gap:10, marginBottom: Spacing.md },
  demoDivLine: { flex:1, height:1, backgroundColor: 'rgba(240,246,252,0.10)' },
  demoDivText: { fontSize:11, color: '#6e7681' },

  demoBtn: {
    flexDirection:'row', alignItems:'center', gap:12,
    padding:12, marginBottom:8, borderRadius: Radii.md,
    borderWidth:1, backgroundColor:'rgba(255,255,255,0.02)',
  },
  demoAvatar: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },
  demoAvatarText: { fontSize:16, fontWeight:'900' },
  demoBtnTitle: { fontSize:13, fontWeight:'700' },
  demoBtnSub: { fontSize:10, color: '#6e7681', marginTop:1 },
  demoBtnArrow: { marginLeft:'auto', fontSize:16 },

  termsText: { fontSize:11, color: '#6e7681', textAlign:'center', lineHeight:16 },

  bottomCta: {
    position:'absolute', bottom: Platform.OS==='ios' ? 34 : 20,
    left: Spacing.lg, right: Spacing.lg,
  },
  bottomCtaBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center',
    paddingVertical:16, gap:8, borderRadius: Radii.lg,
    borderWidth:1, borderColor: 'rgba(240,246,252,0.10)',
  },
  bottomCtaText: { fontSize:15, fontWeight:'700', color: '#e6edf3' },
  bottomCtaArrow: { fontSize:18, color: Colors.teal },
});
