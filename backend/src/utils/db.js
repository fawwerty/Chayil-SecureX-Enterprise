const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'chayil_securex',
  user: process.env.DB_USER || 'chayil',
  password: process.env.DB_PASS || 'chayil_secret',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 30000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function connectDB() {
  let attempts = 0;
  const maxAttempts = 10;
  while (attempts < maxAttempts) {
    try {
      await pool.query('SELECT NOW()');
      logger.info('✅ PostgreSQL connected');
      await runMigrations();
      return;
    } catch (err) {
      attempts++;
      logger.warn(`⚠️  PostgreSQL attempt ${attempts}/${maxAttempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        logger.warn('⚠️  Running in demo mode (no database)');
        return;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'client',
        org_id UUID,
        mfa_secret VARCHAR(255),
        mfa_enabled BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255),
        industry VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Ghana',
        subscription VARCHAR(50) DEFAULT 'professional',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        ip_address INET,
        hostname VARCHAR(255),
        os VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        criticality VARCHAR(20) DEFAULT 'medium',
        location VARCHAR(100),
        tags JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        tool VARCHAR(50) NOT NULL,
        target VARCHAR(500) NOT NULL,
        target_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'queued',
        options JSONB DEFAULT '{}',
        result_raw TEXT,
        result_json JSONB,
        risk_score INTEGER,
        findings_count INTEGER DEFAULT 0,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        authorized BOOLEAN DEFAULT false,
        job_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vulnerabilities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_id UUID REFERENCES scans(id),
        org_id UUID REFERENCES organizations(id),
        asset_id UUID REFERENCES assets(id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        severity VARCHAR(20),
        cvss_score DECIMAL(3,1),
        cve_id VARCHAR(50),
        port INTEGER,
        protocol VARCHAR(10),
        solution TEXT,
        status VARCHAR(50) DEFAULT 'open',
        assigned_to UUID REFERENCES users(id),
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        severity VARCHAR(20),
        status VARCHAR(50) DEFAULT 'open',
        category VARCHAR(100),
        source VARCHAR(100),
        affected_assets JSONB DEFAULT '[]',
        timeline JSONB DEFAULT '[]',
        assigned_to UUID REFERENCES users(id),
        reported_by UUID REFERENCES users(id),
        detected_at TIMESTAMPTZ,
        contained_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS threat_iocs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50),
        value VARCHAR(500) NOT NULL UNIQUE,
        threat_type VARCHAR(100),
        confidence INTEGER DEFAULT 50,
        severity VARCHAR(20),
        source VARCHAR(100),
        first_seen TIMESTAMPTZ DEFAULT NOW(),
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        tags JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS compliance_controls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        framework VARCHAR(50),
        control_id VARCHAR(50),
        title VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'not_assessed',
        evidence TEXT,
        owner VARCHAR(100),
        last_assessed DATE,
        next_review DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tracking_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id UUID REFERENCES assets(id),
        event_type VARCHAR(100),
        old_value JSONB,
        new_value JSONB,
        detected_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        org_id UUID REFERENCES organizations(id),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id UUID,
        ip_address INET,
        user_agent TEXT,
        status VARCHAR(20),
        details JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS playbooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        name VARCHAR(255) NOT NULL,
        trigger_type VARCHAR(100),
        category VARCHAR(100),
        steps JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        title VARCHAR(255),
        type VARCHAR(100),
        generated_by UUID REFERENCES users(id),
        data JSONB DEFAULT '{}',
        file_path VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS osint_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        query_type VARCHAR(100),
        target VARCHAR(500),
        results JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        base_price DECIMAL(12,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS engagements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        service_id UUID REFERENCES services(id),
        title VARCHAR(255),
        status VARCHAR(50) DEFAULT 'requested',
        progress INTEGER DEFAULT 0,
        assigned_analyst UUID REFERENCES users(id),
        start_date DATE,
        end_date DATE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        engagement_id UUID REFERENCES engagements(id),
        title VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        category VARCHAR(50) DEFAULT 'evidence',
        uploaded_by UUID REFERENCES users(id),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS consultations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        subject VARCHAR(255),
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        scheduled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        participant_a UUID REFERENCES users(id),
        participant_b UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id),
        sender_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        engagement_id UUID REFERENCES engagements(id),
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'GHS',
        status VARCHAR(50) DEFAULT 'unpaid',
        paystack_ref VARCHAR(255),
        due_date DATE,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        service VARCHAR(255),
        message TEXT,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scan_pipelines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        user_id UUID REFERENCES users(id),
        name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'running',
        steps JSONB DEFAULT '[]', -- [{stage: 'recon', status: 'completed', tool: 'nmap'}, ...]
        current_stage VARCHAR(50) DEFAULT 'recon',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exploit_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        requester_id UUID REFERENCES users(id),
        approver_id UUID REFERENCES users(id),
        tool VARCHAR(50) NOT NULL,
        target VARCHAR(500) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        decision_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS compliance_mapping (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vulnerability_id UUID REFERENCES vulnerabilities(id),
        control_id UUID REFERENCES compliance_controls(id),
        framework VARCHAR(50), -- ISO27001, NIST, GDPR
        compliance_check_id VARCHAR(100), -- specific requirement tag
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS risks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        impact INTEGER DEFAULT 1, -- 1-5
        likelihood INTEGER DEFAULT 1, -- 1-5
        score INTEGER DEFAULT 1, -- impact * likelihood
        status VARCHAR(50) DEFAULT 'identified',
        owner VARCHAR(100),
        treatment_plan TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        audit_type VARCHAR(100) DEFAULT 'internal',
        scope TEXT,
        findings_count INTEGER DEFAULT 0,
        report_url VARCHAR(500),
        scheduled_at DATE,
        completed_at DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assurance_measures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        target_value DECIMAL(10,2),
        actual_value DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'in_place',
        last_verified TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );


      CREATE INDEX IF NOT EXISTS idx_engagements_org ON engagements(org_id);
      CREATE INDEX IF NOT EXISTS idx_docs_engagement ON documents(engagement_id);
      CREATE INDEX IF NOT EXISTS idx_msgs_conv ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_scans_org ON scans(org_id);
      CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
      CREATE INDEX IF NOT EXISTS idx_vulns_severity ON vulnerabilities(severity);
      CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents(org_id);
      CREATE INDEX IF NOT EXISTS idx_iocs_value ON threat_iocs(value);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_pipelines_org ON scan_pipelines(org_id);
    `);
    logger.info('✅ Database migrations complete');
  } catch (err) {
    logger.error('Migration error:', err.message);
  } finally {
    client.release();
  }
}

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { pool, query, getClient, connectDB };
