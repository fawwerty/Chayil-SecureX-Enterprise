/**
 * ExportUtils.js - High-Octane Data Portability Utility
 */

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    if (typeof window !== 'undefined') window.alert(`No ${filename} data available to export.`);
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add Headers
  csvRows.push(headers.join(','));

  // Add Data
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + val).replace(/"/g, '""'); // Escape quotes
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
