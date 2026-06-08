import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDepartments, universityColors, universityLabels } from '../services/api';
import { Building2, Network, Clock } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];

export default function Departments() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [university, setUniversity] = useState(searchParams.get('uni') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getDepartments(university || undefined);
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
        <h2>Departments</h2>
        <p>Horizontally fragmented across university nodes — queried and merged by central router</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select
            className="filter-select"
            value={university}
            onChange={e => setUniversity(e.target.value)}
          >
            <option value="">All Universities</option>
            {UNI_IDS.map(u => <option key={u} value={u}>{universityLabels[u]}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {data.length} departments
          </span>
        </div>

        {meta.query_id && (
          <div className="query-meta">
            <span><Network size={12} /> Query ID: {meta.query_id}</span>
            <span><Clock size={12} /> {meta.execution_time_ms}ms</span>
            <span>Nodes: {meta.nodes_responded?.join(', ')}</span>
          </div>
        )}

        {loading ? (
          <div className="loading"><Building2 size={18} /> Loading from nodes...</div>
        ) : (
          <div className="grid-auto">
            {data.map(dept => (
              <div key={`${dept.university_id}-${dept.id}`} className="card">
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', marginBottom: 10
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
                      {dept.name}
                    </div>
                    <span className={`badge badge-${dept.university_id}`}>
                      {universityLabels[dept.university_id]}
                    </span>
                  </div>
                  <div className={`text-${dept.university_id}`} style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    background: 'var(--bg-card2)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: `1px solid ${universityColors[dept.university_id]}33`
                  }}>
                    {dept.code}
                  </div>
                </div>

                {dept.faculty && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    📚 {dept.faculty}
                  </div>
                )}

                {dept.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    {dept.description}
                  </p>
                )}

                <div style={{
                  marginTop: 12, paddingTop: 12,
                  borderTop: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: universityColors[dept.university_id]
                  }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Node: {dept.university_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🏛️</div>
            <div>No departments found</div>
          </div>
        )}
      </div>
    </>
  );
}
