// ═══════════════════════════════════════════════════════════════════════
// CHAYIL SECUREX — MOBILE UI COMPONENTS v4.0
// Inter · GitHub/Fly.io style · Chayil Cyan palette
// ═══════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, FontSize, Shadows } from '../theme';

// ── PrimaryButton ─────────────────────────────────────────
export function PrimaryButton({ label, onPress, loading, style, icon, variant = 'cyan' }) {
  const gradients = {
    cyan:  [Colors.cyan, Colors.cyanDim],
    gold:  [Colors.gold, Colors.goldDim],
    red:   ['#f85149', '#b91c1c'],
    ghost: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)'],
  };
  const textColor = variant === 'ghost' ? Colors.fgDefault : '#0a0e10';
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.8} style={style}>
      <LinearGradient colors={gradients[variant] || gradients.cyan} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.btnGrad}>
        {loading
          ? <ActivityIndicator color={textColor} size="small"/>
          : <>
              {icon && <Text style={{ fontSize:14, marginRight:4, color:textColor }}>{icon}</Text>}
              <Text style={[styles.btnText, { color:textColor }]}>{label}</Text>
            </>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── OutlineButton ─────────────────────────────────────────
export function OutlineButton({ label, onPress, color = Colors.cyan, style, icon }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[styles.outlineBtn, { borderColor: color + '40' }, style]}>
      {icon && <Text style={{ fontSize:14, marginRight:4, color }}>{icon}</Text>}
      <Text style={[styles.outlineBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── StatCard ──────────────────────────────────────────────
export function StatCard({ label, value, icon, change, changeUp, accentColor, style }) {
  return (
    <View style={[styles.statCard, style]}>
      <View style={[styles.statTopBar, { backgroundColor: accentColor || Colors.cyan }]}/>
      <View style={styles.statHeader}>
        {icon && <Text style={styles.statIcon}>{icon}</Text>}
        {change && (
          <Text style={[styles.statChange, { color: changeUp ? Colors.success : Colors.danger }]}>
            {changeUp ? '↑' : '↓'} {change}
          </Text>
        )}
      </View>
      <Text style={[styles.statValue, accentColor && { color: accentColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── SeverityBadge ─────────────────────────────────────────
export function SeverityBadge({ level }) {
  const cfg = {
    critical: { bg:'rgba(248,81,73,0.12)',  color:'#f85149', border:'rgba(248,81,73,0.25)' },
    high:     { bg:'rgba(210,153,34,0.12)', color:'#d29922', border:'rgba(210,153,34,0.25)' },
    medium:   { bg:'rgba(212,168,67,0.12)', color:Colors.goldLight, border:Colors.goldBorder },
    low:      { bg:'rgba(63,185,80,0.12)',  color:'#3fb950', border:'rgba(63,185,80,0.25)' },
    info:     { bg:Colors.cyanSubtle,       color:Colors.cyan, border:Colors.cyanBorder },
  }[level?.toLowerCase()] || { bg:Colors.bgSubtle, color:Colors.fgMuted, border:Colors.borderDefault };
  return (
    <View style={[styles.badge, { backgroundColor:cfg.bg, borderColor:cfg.border }]}>
      <Text style={[styles.badgeText, { color:cfg.color }]}>{level?.toUpperCase()}</Text>
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={onPress ? 0.8 : 1}
      style={[styles.card, style]}>
      {children}
    </Wrapper>
  );
}

// ── SectionHeader ─────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── LiveIndicator ─────────────────────────────────────────
export function LiveIndicator({ label = 'LIVE' }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue:0.3, duration:700, useNativeDriver:true }),
      Animated.timing(pulse, { toValue:1,   duration:700, useNativeDriver:true }),
    ])).start();
  }, []);
  return (
    <View style={styles.liveChip}>
      <Animated.View style={[styles.liveDot, { opacity:pulse }]}/>
      <Text style={styles.liveText}>{label}</Text>
    </View>
  );
}

// ── ProgressBar ───────────────────────────────────────────
export function ProgressBar({ value, color = Colors.cyan, style }) {
  return (
    <View style={[styles.progressTrack, style]}>
      <LinearGradient colors={[color, color+'80']} start={{x:0,y:0}} end={{x:1,y:0}}
        style={[styles.progressFill, { width:`${Math.min(value,100)}%` }]}/>
    </View>
  );
}

// ── AlertItem ─────────────────────────────────────────────
export function AlertItem({ title, subtitle, severity, time, onPress }) {
  const dotColors = { critical:Colors.danger, high:Colors.warning, medium:Colors.gold, low:Colors.success, info:Colors.cyan };
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.alertItem}>
      <View style={[styles.alertDot, { backgroundColor: dotColors[severity?.toLowerCase()] || Colors.cyan }]}/>
      <View style={{ flex:1 }}>
        <Text style={styles.alertTitle} numberOfLines={2}>{title}</Text>
        {subtitle && <Text style={styles.alertSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={{ alignItems:'flex-end', gap:4 }}>
        <SeverityBadge level={severity}/>
        {time && <Text style={styles.alertTime}>{time}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ── EmptyState ────────────────────────────────────────────
export function EmptyState({ icon='🔍', title, subtitle }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

// ── LoadingState ──────────────────────────────────────────
export function LoadingState({ label='Loading…' }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={Colors.cyan} size="large"/>
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

// ── ConsoleOutput ─────────────────────────────────────────
export function ConsoleOutput({ lines = [] }) {
  return (
    <View style={styles.console}>
      <View style={styles.consoleHeader}>
        {['#f85149','#d29922','#3fb950'].map((c,i) => <View key={i} style={[styles.consoleDot, { backgroundColor:c }]}/>)}
        <Text style={styles.consoleTitle}>kali@securex ~</Text>
      </View>
      <View style={styles.consoleBody}>
        {lines.map((line,i) => (
          <Text key={i} style={[styles.consoleLine,
            line.type==='cmd'     && { color:Colors.cyan },
            line.type==='warn'    && { color:Colors.warning },
            line.type==='err'     && { color:Colors.danger },
            line.type==='success' && { color:Colors.success },
          ]}>{line.text}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btnGrad: { flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:12, paddingHorizontal:20, borderRadius:Radii.md, minHeight:44 },
  btnText: { fontSize:FontSize.lg, fontWeight:'600' },
  outlineBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:11, paddingHorizontal:18, borderRadius:Radii.md, borderWidth:1, minHeight:44 },
  outlineBtnText: { fontSize:FontSize.lg, fontWeight:'500' },
  statCard: { backgroundColor:Colors.bgOverlay, borderRadius:Radii.md, padding:Spacing.lg, borderWidth:1, borderColor:Colors.borderDefault, overflow:'hidden', ...Shadows.card },
  statTopBar: { position:'absolute', top:0, left:0, right:0, height:2 },
  statHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  statIcon: { fontSize:18 },
  statChange: { fontSize:FontSize.sm, fontWeight:'500' },
  statValue: { fontSize:FontSize['5xl'], fontWeight:'700', color:Colors.fgDefault, letterSpacing:-1 },
  statLabel: { fontSize:FontSize.sm, color:Colors.fgMuted, marginTop:4, textTransform:'uppercase', letterSpacing:0.8, fontWeight:'500' },
  badge: { paddingHorizontal:7, paddingVertical:2, borderRadius:100, borderWidth:1 },
  badgeText: { fontSize:FontSize.xs, fontWeight:'700', letterSpacing:0.4 },
  card: { backgroundColor:Colors.bgOverlay, borderRadius:Radii.md, borderWidth:1, borderColor:Colors.borderDefault, ...Shadows.card },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', paddingHorizontal:Spacing.lg, paddingTop:Spacing.xl, paddingBottom:Spacing.sm },
  sectionTitle: { fontSize:FontSize.lg, fontWeight:'600', color:Colors.fgDefault, letterSpacing:-0.2 },
  sectionSub: { fontSize:FontSize.base, color:Colors.fgMuted, marginTop:2 },
  sectionAction: { fontSize:FontSize.md, color:Colors.cyan, fontWeight:'500' },
  liveChip: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:9, paddingVertical:4, backgroundColor:'rgba(63,185,80,0.1)', borderRadius:100, borderWidth:1, borderColor:'rgba(63,185,80,0.25)' },
  liveDot: { width:5, height:5, borderRadius:3, backgroundColor:Colors.success },
  liveText: { fontSize:FontSize.xs, fontWeight:'700', color:Colors.success, letterSpacing:0.8 },
  progressTrack: { height:4, backgroundColor:Colors.bgSubtle, borderRadius:2, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:2 },
  alertItem: { flexDirection:'row', alignItems:'center', gap:10, padding:Spacing.md, backgroundColor:Colors.bgOverlay, borderRadius:Radii.md, borderWidth:1, borderColor:Colors.borderDefault },
  alertDot: { width:8, height:8, borderRadius:4, flexShrink:0 },
  alertTitle: { fontSize:FontSize.md, fontWeight:'500', color:Colors.fgDefault, lineHeight:20 },
  alertSub: { fontSize:FontSize.base, color:Colors.fgMuted, marginTop:2 },
  alertTime: { fontSize:FontSize.xs, color:Colors.fgSubtle },
  empty: { alignItems:'center', paddingVertical:48, paddingHorizontal:24 },
  emptyIcon: { fontSize:36, marginBottom:14 },
  emptyTitle: { fontSize:FontSize.xl, fontWeight:'600', color:Colors.fgDefault, textAlign:'center' },
  emptySub: { fontSize:FontSize.md, color:Colors.fgMuted, marginTop:8, textAlign:'center', lineHeight:20 },
  loading: { flex:1, alignItems:'center', justifyContent:'center', gap:16 },
  loadingText: { fontSize:FontSize.md, color:Colors.fgMuted },
  console: { backgroundColor:'#010409', borderRadius:Radii.md, borderWidth:1, borderColor:Colors.borderDefault, overflow:'hidden' },
  consoleHeader: { flexDirection:'row', alignItems:'center', gap:6, padding:10, backgroundColor:Colors.bgSubtle, borderBottomWidth:1, borderBottomColor:Colors.borderDefault },
  consoleDot: { width:9, height:9, borderRadius:5 },
  consoleTitle: { fontSize:FontSize.base, color:Colors.fgMuted, fontFamily:'Courier', marginLeft:6 },
  consoleBody: { padding:14, minHeight:120 },
  consoleLine: { fontSize:FontSize.base, color:'#7ee787', lineHeight:20, fontFamily:'Courier' },
});
