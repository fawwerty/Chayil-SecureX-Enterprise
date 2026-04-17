import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import CyberAssurance from './pages/admin/CyberAssurance';
import ITAuditing from './pages/admin/ITAuditing';
import RiskManagement from './pages/admin/RiskManagement';
import Compliance from './pages/admin/Compliance';
import VulnerabilityAssessment from './pages/admin/VulnerabilityAssessment';
import {
  CISOAdvisory, ThreatIntelligence, IncidentResponse,
  AssetDiscovery, NetworkMonitoring, CloudSecurity,
  CyberScoreAfrica, AIAssistant, IAMModule, ReportsEngine, ConsultationManager, GovernanceControl
} from './pages/admin/adminPages';
import {
  AnalystLayout, AnalystDashboard, ThreatWorkspace,
  SOCVisibility, LogAnalysis, IncidentTriage, Playbooks, AssignedClients
} from './pages/analyst/analystPages';
import {
  ClientLayout, ClientDashboard, ClientEngagements,
  ServiceHub, DocumentVault, ConsultationCenter, BillingCenter
} from './pages/client/clientPages';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';
import Security from './pages/legal/Security';

function LoadingScreen() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16,background:'#030305'}}>
      <div style={{width:32,height:32,border:'1.5px solid rgba(255,255,255,0.06)',borderTopColor:'rgba(255,255,255,0.8)',borderRadius:'50%',animation:'spin 0.75s linear infinite'}} />
      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'10px',color:'rgba(255,255,255,0.25)',letterSpacing:'0.2em',textTransform:'uppercase'}}>Chayil SecureX</div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && role !== 'any' && user.role !== role && user.role !== 'admin') {
    if (user.role === 'analyst') return <Navigate to="/analyst" replace />;
    if (user.role === 'client') return <Navigate to="/client" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'analyst') return <Navigate to="/analyst" replace />;
  return <Navigate to="/client" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/security" element={<Security />} />
        <Route path="/portal" element={<RoleRedirect />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="cyber-assurance" element={<CyberAssurance />} />
          <Route path="it-auditing" element={<ITAuditing />} />
          <Route path="risk-management" element={<RiskManagement />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="vulnerability" element={<VulnerabilityAssessment />} />
          <Route path="ciso-advisory" element={<CISOAdvisory />} />
          <Route path="threat-intelligence" element={<ThreatIntelligence />} />
          <Route path="incidents" element={<IncidentResponse />} />
          <Route path="assets" element={<AssetDiscovery />} />
          <Route path="network" element={<NetworkMonitoring />} />
          <Route path="cloud" element={<CloudSecurity />} />
          <Route path="cyberscore" element={<CyberScoreAfrica />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="iam" element={<IAMModule />} />
          <Route path="consultations" element={<ConsultationManager />} />
          <Route path="reports" element={<ReportsEngine />} />
          <Route path="governance" element={<GovernanceControl />} />
        </Route>
        <Route path="/analyst" element={<ProtectedRoute role="any"><AnalystLayout /></ProtectedRoute>}>
          <Route index element={<AnalystDashboard />} />
          <Route path="clients" element={<AssignedClients />} />
          <Route path="threats" element={<ThreatWorkspace />} />
          <Route path="soc" element={<SOCVisibility />} />
          <Route path="logs" element={<LogAnalysis />} />
          <Route path="incidents" element={<IncidentTriage />} />
          <Route path="playbooks" element={<Playbooks />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="services" element={<ServiceHub />} />
          <Route path="documents" element={<DocumentVault />} />
          <Route path="consultations" element={<ConsultationCenter />} />
          <Route path="governance" element={<GovernanceControl />} />
        </Route>

        <Route path="/client" element={<ProtectedRoute role="any"><ClientLayout /></ProtectedRoute>}>
          <Route index element={<ClientDashboard />} />
          <Route path="engagements" element={<ClientEngagements />} />
          <Route path="requests" element={<ServiceHub />} />
          <Route path="documents" element={<DocumentVault />} />
          <Route path="consultations" element={<ConsultationCenter />} />
          <Route path="billing" element={<BillingCenter />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
