import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';

export default function AdminReportsPage() {
  const [report, setReport] = useState({ totals: {}, subscriptionBreakdown: {}, drawStatistics: {}, payoutStatus: {} });

  useEffect(() => {
    apiGet('/admin/reports')
      .then(setReport)
      .catch(() => setReport({ totals: {}, subscriptionBreakdown: {}, drawStatistics: {}, payoutStatus: {} }));
  }, []);

  return (
    <div className="page-wrap">
      <h1>Reports</h1>
      <div className="summary-grid">
        <div className="summary-card"><span>Users</span><strong>{report.totals.users || 0}</strong></div>
        <div className="summary-card"><span>Active subscribers</span><strong>{report.totals.activeSubscribers || 0}</strong></div>
        <div className="summary-card"><span>Prize pool</span><strong>£{report.totals.prizePool || 0}</strong></div>
        <div className="summary-card"><span>Winners</span><strong>{report.totals.winners || 0}</strong></div>
        <div className="summary-card"><span>Paid out</span><strong>{report.totals.paidOut || 0}</strong></div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><span>Published draws</span><strong>{report.drawStatistics.published || 0}</strong></div>
        <div className="summary-card"><span>Simulated draws</span><strong>{report.drawStatistics.simulated || 0}</strong></div>
        <div className="summary-card"><span>Subscription states</span><strong>{Object.entries(report.subscriptionBreakdown).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'none'}</strong></div>
        <div className="summary-card"><span>Payout states</span><strong>{Object.entries(report.payoutStatus).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'none'}</strong></div>
      </div>
    </div>
  );
}
