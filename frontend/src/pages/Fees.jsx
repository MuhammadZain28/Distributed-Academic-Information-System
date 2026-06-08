import { useState, useEffect } from 'react';
import { getFees, universityColors, universityLabels } from '../services/api';
import { DollarSign, Network, Clock } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];

const fmt = (n) => n ? `PKR ${Number(n).toLocaleString()}` : '—';

export default function Fees() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [university, setUniversity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (university) params.university = university;
        const res = await getFees(params);
        setData(res.data.data || []);
        setMeta(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [university]);

  return (
    <>
      <div className="page-header">
        <h2>Fee Structures</h2>
        <p>Semester, annual, and admission fees — aggregated from all university nodes</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select className="filter-select" value={university} onChange={e => setUniversity(e.target.value)}>
            <option value="">All Universities</option>
            {UNI_IDS.map(u => <option key={u} value={u}>{universityLabels[u]}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{data.length} fee records</span>
        </div>

        {meta.query_id && (
          <div className="query-meta">
            <span><Network size={12} /> Query ID: {meta.query_id}</span>
            <span><Clock size={12} /> {meta.execution_time_ms}ms</span>
            <span>Nodes: {meta.nodes_responded?.join(', ')}</span>
          </div>
        )}

        {loading ? (
          <div className="loading"><DollarSign size={18} /> Fetching fee data...</div>
        ) : (
          <div className="grid-auto">
            {data.map(f => {
              const color = universityColors[f.university_id];
              const total = (f.semester_fee || 0) * 8 + (f.admission_fee || 0) + (f.security_deposit || 0) + (f.other_charges || 0) * 8;
              return (
                <div key={`${f.university_id}-${f.id}`} className="card" style={{ borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span className={`badge badge-${f.university_id}`}>{universityLabels[f.university_id]}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {f.session}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[
                      { label: 'Semester Fee', value: f.semester_fee },
                      { label: 'Annual Fee', value: f.annual_fee },
                      { label: 'Admission Fee', value: f.admission_fee },
                      { label: 'Security Deposit', value: f.security_deposit },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {item.label}
                        </div>
                        <div className={`text-${f.university_id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 14, marginTop: 4, fontWeight: 500 }}>
                          {fmt(item.value)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(f.other_charges > 0) && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      Other charges: <span className={`text-${f.university_id}`} style={{ fontFamily: 'var(--font-mono)' }}>{fmt(f.other_charges)}/sem</span>
                    </div>
                  )}

                  <div style={{
                    paddingTop: 12, borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Est. Total (4yr)</span>
                    <span className={`text-${f.university_id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600 }}>
                      {fmt(total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="empty">
            <div className="empty-icon">💰</div>
            <div>No fee data found</div>
          </div>
        )}
      </div>
    </>
  );
}
