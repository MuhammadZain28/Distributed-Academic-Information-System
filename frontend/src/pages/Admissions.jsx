import { useState, useEffect } from 'react';
import { getAdmissions, universityColors, universityLabels } from '../services/api';
import { ClipboardList, Network, Clock, Calendar } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];

export default function Admissions() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [university, setUniversity] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (university) params.university = university;
        if (status) params.status = status;
        const res = await getAdmissions(params);
        setData(res.data.data || []);
        setMeta(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [university, status]);

  const statusBadge = (s) => {
    const cls = s === 'open' ? 'badge-open' : s === 'closed' ? 'badge-closed' : 'badge-default';
    return <span className={`badge ${cls}`}>{s}</span>;
  };

  return (
    <>
      <div className="page-header">
        <h2>Admission Criteria</h2>
        <p>Entry test requirements, merit formulas, and deadlines — distributed across university nodes</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select className="filter-select" value={university} onChange={e => setUniversity(e.target.value)}>
            <option value="">All Universities</option>
            {UNI_IDS.map(u => <option key={u} value={u}>{universityLabels[u]}</option>)}
          </select>
          <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {meta.query_id && (
          <div className="query-meta">
            <span><Network size={12} /> Query ID: {meta.query_id}</span>
            <span><Clock size={12} /> {meta.execution_time_ms}ms</span>
            <span>Nodes: {meta.nodes_responded?.join(', ')}</span>
          </div>
        )}

        {loading ? (
          <div className="loading"><ClipboardList size={18} /> Fetching admission data...</div>
        ) : (
          <div className="grid-auto">
            {data.map(a => (
              <div key={`${a.university_id}-${a.id}`} className="card" style={{
                borderLeft: `3px solid ${universityColors[a.university_id]}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className={`badge badge-${a.university_id}`}>{universityLabels[a.university_id]}</span>
                  {statusBadge(a.status)}
                </div>

                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>
                  {a.session}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min FSc %</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text)', marginTop: 3 }}>
                      {a.min_fsc_percentage || '—'}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entry Test</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', marginTop: 3 }}>
                      {a.entry_test_required ? (a.entry_test_name || 'Required') : 'Not Required'}
                    </div>
                  </div>
                </div>

                {a.entry_test_required && a.min_entry_test_score && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Min Score: <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {a.min_entry_test_score}
                    </span>
                  </div>
                )}

                {a.merit_formula && (
                  <div style={{
                    background: 'var(--bg-card2)', borderRadius: 8, padding: '8px 12px',
                    fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                    marginBottom: 8
                  }}>
                    {a.merit_formula}
                  </div>
                )}

                {a.deadline && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <Calendar size={11} />
                    Deadline: <span style={{ color: 'var(--text)' }}>{a.deadline}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div>No admission data found</div>
          </div>
        )}
      </div>
    </>
  );
}
