import React, { useState, useEffect } from 'react';
import { getMeritLists, universityColors, universityLabels } from '../services/api';
import { ListOrdered, Network, Clock, TrendingDown } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];

export default function MeritLists() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [university, setUniversity] = useState('');
  const [session, setSession] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (university) params.university = university;
        if (session) params.session = session;
        const res = await getMeritLists(params);
        setData(res.data.data || []);
        setMeta(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [university, session]);

  const getMeritColor = (score) => {
    if (score >= 90) return 'var(--nuces)';
    if (score >= 80) return 'var(--uet)';
    if (score >= 70) return 'var(--punjab)';
    return 'var(--warning)';
  };

  return (
    <>
      <div className="page-header">
        <h2>Merit Lists</h2>
        <p>Published closing merit scores — replicated public data accessible from any node</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select className="filter-select" value={university} onChange={e => setUniversity(e.target.value)}>
            <option value="">All Universities</option>
            {UNI_IDS.map(u => <option key={u} value={u}>{universityLabels[u]}</option>)}
          </select>
          <select className="filter-select" value={session} onChange={e => setSession(e.target.value)}>
            <option value="">All Sessions</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
          </select>
        </div>

        {meta.query_id && (
          <div className="query-meta">
            <span><Network size={12} /> Query ID: {meta.query_id}</span>
            <span><Clock size={12} /> {meta.execution_time_ms}ms</span>
            <span>Nodes: {meta.nodes_responded?.join(', ')}</span>
          </div>
        )}

        <div className="info-box" style={{ marginBottom: 20 }}>
          <TrendingDown size={14} />
          <span>Merit lists show closing merit percentages for each list. Higher list numbers indicate subsequent rounds after seats become available.</span>
        </div>

        {loading ? (
          <div className="loading"><ListOrdered size={18} /> Fetching merit data...</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>University</th>
                  <th>Session</th>
                  <th>List #</th>
                  <th>Closing Merit</th>
                  <th>Published</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map(m => {
                  const color = universityColors[m.university_id];
                  const meritColor = getMeritColor(m.closing_merit);
                  return (
                    <tr key={`${m.university_id}-${m.id}`}>
                      <td>
                        <span className={`badge badge-${m.university_id}`}>
                          {universityLabels[m.university_id]}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.session}</td>
                      <td>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: `${color}22`, border: `1px solid ${color}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: 12, color
                        }}>
                          {m.list_number}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 20,
                          fontWeight: 600,
                          color: meritColor
                        }}>
                          {m.closing_merit}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>%</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {m.published_at ? new Date(m.published_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span className="badge badge-active">{m.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📊</div>
            <div>No merit lists found</div>
          </div>
        )}
      </div>
    </>
  );
}
