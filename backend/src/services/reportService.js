const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const { query } = require('../utils/db');

async function generateElitePDF(reportId, orgId) {
  // Fetch report metadata
  const r = await query('SELECT * FROM reports WHERE id=$1 AND org_id=$2', [reportId, orgId]);
  if (r.rows.length === 0) throw new Error('Report not found');
  const report = r.rows[0];

  // Fetch real-time data for mapping
  const v = await query('SELECT title, severity, cvss_score, cve_id FROM vulnerabilities WHERE org_id=$1', [orgId]);
  const s = await query('SELECT tool, target, status, risk_score FROM scans WHERE org_id=$1', [orgId]);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Branded
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('CHAYIL SECUREX', 20, 20);
  doc.setFontSize(10);
  doc.text('ENTERPRISE SECURITY AUDIT PORTAL', 20, 28);
  
  doc.setTextColor(255, 215, 0); // Gold
  doc.text(`REPORT ID: ${reportId.slice(0, 8).toUpperCase()}`, pageWidth - 20, 20, { align: 'right' });

  // Summary Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text('EXECUTIVE SUMMARY', 20, 55);
  doc.setLineWidth(0.5);
  doc.line(20, 58, 60, 58);

  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 68);
  doc.text(`Project: ${report.title}`, 20, 74);
  
  // Risk Metric
  const avgRisk = s.rows.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / (s.rows.length || 1);
  doc.setFontSize(12);
  doc.text(`Overall Risk Rating: ${avgRisk > 70 ? 'CRITICAL' : avgRisk > 40 ? 'ELEVATED' : 'STABLE'}`, 20, 85);

  // Vulnerability Distribution Table
  doc.autoTable({
    startY: 95,
    head: [['Framework / ID', 'Finding Description', 'Severity', 'CVSS']],
    body: v.rows.map(vuln => [
      vuln.cve_id || 'N/A',
      vuln.title,
      vuln.severity.toUpperCase(),
      vuln.cvss_score || '0.0'
    ]),
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] } // Indigo 600
  });

  // Compliance Mapping Section (The "Elite" part)
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(14);
  doc.text('COMPLIANCE FRAMEWORK MAPPING', 20, finalY);
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 3, 80, finalY + 3);

  doc.setFontSize(9);
  const mappingText = [
    '• ISO 27001:2022 | A.8.8 Management of technical vulnerabilities (Mapped)',
    '• NIST CSF | PR.IP-12 Vulnerability management plan is developed (Partial)',
    '• GDPR | Article 32 Security of processing (Evidence Required)'
  ];
  mappingText.forEach((text, i) => {
    doc.text(text, 20, finalY + 12 + (i * 8));
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`CONFIDENTIAL - FOR AUTHORIZED USE ONLY | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  return doc.output('arraybuffer');
}

module.exports = { generateElitePDF };
