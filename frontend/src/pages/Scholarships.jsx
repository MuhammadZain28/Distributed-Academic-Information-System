import { useState, useEffect } from 'react';
import { getScholarships, universityLabels } from '../services/api';
import { Award, Network, Clock } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];

export default function Scholarships() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [university, setUniversity] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { status: 'active' };
        if (university) params.university = university;
        if (type) params.type = type;
        const res = await getScholarships(params);
        setData(res.data.data || []);
        setMeta(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [university, type]);

  const typeBadge = (t) => {
    const map = { 'merit': 'badge-merit', 'need-based': 'badge-need-based', 'industry': 'badge-industry' };
    return <span className={`badge ${map[t] || 'badge-default'}`}>{t || 'general'}</span>;
  };

  return (
    <>
      <div className="page-header">
        <h2>Scholarships</h2>
        <p>Merit, need-based, and industry scholarships — public data replicated across nodes</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select className="filter-select" value={university} onChange={e => setUniversity(e.target.value)}>
            <option value="">All Universities</option>
            {UNI_IDS.map(u => <option key={u} value={u}>{universityLabels[u]}</option>)}
          </select>
          <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="merit">Merit</option>
            <option value="need-based">Need-Based</option>
            <option value="sports">Sports</option>
            <option value="industry">Industry</option>
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{data.length} scholarships</span>
        </div>

        {meta.query_id && (
          <div className="query-meta">
            <span><Network size={12} /> Query ID: {meta.query_id}</span>
            <span><Clock size={12} /> {meta.execution_time_ms}ms</span>
            <span>Nodes: {meta.nodes_responded?.join(', ')}</span>
          </div>
        )}

        {loading ? (
          <div className="loading"><Award size={18} /> Loading scholarships...</div>
        ) : (
          <div className="grid-auto">
            {data.map(s => {
              return (
                <div key={`${s.university_id}-${s.id}`} className="card">
                  <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${s.university_id}`}>{universityLabels[s.university_id]}</span>
                    {typeBadge(s.type)}
                    <span className="badge badge-active">{s.status}</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>
                    {s.name}
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage</div>
                      <div className={`text-${s.university_id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 24, marginTop: 4, fontWeight: 600 }}>
                        {s.coverage_percentage}%
                      </div>
                    </div>
                    {s.seats_available && (
                      <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seats</div>
                        <div className={`text-${s.university_id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 24, marginTop: 4, fontWeight: 600 }}>
                          {s.seats_available}
                        </div>
                      </div>
                    )}
                  </div>

                  {s.eligibility_criteria && (
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                      📌 {s.eligibility_criteria}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🏆</div>
            <div>No scholarships found</div>
          </div>
        )}
      </div>
    </>
  );
}
