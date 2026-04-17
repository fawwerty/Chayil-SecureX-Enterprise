require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Direct connection with longer timeout for seeding
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'chayil_securex',
  user: process.env.DB_USER || 'chayil',
  password: process.env.DB_PASS || 'chayil_secret',
  connectionTimeoutMillis: 15000,
});

async function seed() {
  console.log('Connecting to PostgreSQL...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Connected. Running seed...');
  } catch (err) {
    console.error('Cannot connect to database:', err.message);
    console.error('Make sure DB_HOST, DB_USER, DB_PASS are correct in your .env');
    process.exit(1);
  }

  try {
    // Create demo org
    const orgRes = await client.query(`
      INSERT INTO organizations (name, domain, industry, country, subscription)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, ['Chayil SecureX Demo Org', 'chayilsecurex.com', 'Cybersecurity', 'Ghana', 'enterprise']);

    let orgId = orgRes.rows[0]?.id;
    if (!orgId) {
      const existing = await client.query(`SELECT id FROM organizations LIMIT 1`);
      orgId = existing.rows[0]?.id;
      if (!orgId) { console.log('No org found, creating...'); return; }
      console.log('Using existing org:', orgId);
    } else {
      console.log('Created org:', orgId);
    }

    // Create demo users
    const users = [
      { email: 'admin@chayilsecurex.com',   password: 'Admin@2024!',   name: 'Default Admin', role: 'admin'   },
      { email: 'analyst@chayilsecurex.com', password: 'Analyst@2024!', name: 'Default Analyst', role: 'analyst' },
      { email: 'client@chayilsecurex.com',  password: 'Client@2024!',  name: 'Demo Client',    role: 'client'  },
    ];


    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 12);
      await client.query(`
        INSERT INTO users (email, password_hash, name, role, org_id)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING
      `, [u.email, hash, u.name, u.role, orgId]);
      console.log(`User ready: ${u.email}`);
    }

    // Seed assets
    const assets = [
      { name:'Web Server 01',    type:'server',      ip:'10.0.1.10',   hostname:'web01.corp.local',  os:'Ubuntu 22.04',   crit:'high'     },
      { name:'Database Server',  type:'server',      ip:'10.0.1.20',   hostname:'db01.corp.local',   os:'CentOS 8',       crit:'critical'  },
      { name:'Firewall',         type:'network',     ip:'192.168.1.1', hostname:'fw01.corp',         os:'FortiOS',        crit:'critical'  },
      { name:'Dev Workstation',  type:'workstation', ip:'10.0.2.50',   hostname:'dev-ws-01',         os:'Windows 11',     crit:'medium'    },
      { name:'AWS EC2 API GW',   type:'cloud',       ip:'13.245.67.89',hostname:'api.example.com',   os:'Amazon Linux 2', crit:'high'      },
    ];
    for (const a of assets) {
      await client.query(`
        INSERT INTO assets (org_id,name,type,ip_address,hostname,os,criticality)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING
      `, [orgId, a.name, a.type, a.ip, a.hostname, a.os, a.crit]);
    }
    console.log(`${assets.length} assets seeded`);

    // Seed IOCs
    const iocs = [
      { type:'ip',     value:'185.220.101.45',          threat_type:'TOR Exit Node',         confidence:95, severity:'high',     source:'AbuseIPDB'  },
      { type:'ip',     value:'45.155.205.233',           threat_type:'Botnet C2',             confidence:90, severity:'critical', source:'Threat Feed' },
      { type:'domain', value:'malware-distribution.ru',  threat_type:'Malware Distribution',  confidence:98, severity:'critical', source:'VirusTotal'  },
      { type:'hash',   value:'44d88612fea8a8f36de82e1278abb02f', threat_type:'EICAR Test',   confidence:100,severity:'low',      source:'Internal'    },
      { type:'url',    value:'http://phishing-ghana.tk/login',   threat_type:'Phishing',      confidence:88, severity:'high',    source:'PhishTank'   },
      { type:'ip',     value:'194.165.16.11',            threat_type:'Scanner/Bruteforce',   confidence:82, severity:'medium',   source:'AbuseIPDB'  },
    ];
    for (const ioc of iocs) {
      await client.query(`
        INSERT INTO threat_iocs (type,value,threat_type,confidence,severity,source)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (value) DO NOTHING
      `, [ioc.type, ioc.value, ioc.threat_type, ioc.confidence, ioc.severity, ioc.source]);
    }
    console.log(`${iocs.length} IOCs seeded`);

    // Seed sample incidents
    const incidents = [
      { title:'Phishing campaign targeting finance dept', severity:'high',     category:'phishing',    status:'open'          },
      { title:'Ransomware behaviour on endpoint WS-045',  severity:'critical', category:'ransomware',  status:'investigating'  },
      { title:'Unauthorised data access — HR system',     severity:'medium',   category:'data_breach', status:'contained'      },
    ];
    for (const inc of incidents) {
      await client.query(`
        INSERT INTO incidents (org_id,title,severity,category,status,detected_at)
        VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT DO NOTHING
      `, [orgId, inc.title, inc.severity, inc.category, inc.status]);
    }
    console.log(`${incidents.length} incidents seeded`);

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin:   admin@chayilsecurex.com  / Admin@2024!');
    console.log('  Analyst: analyst@chayilsecurex.com / Analyst@2024!');
    console.log('  Client:  client@chayilsecurex.com  / Client@2024!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Open: http://localhost');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
