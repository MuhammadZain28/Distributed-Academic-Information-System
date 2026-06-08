import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPrograms, universityColors, universityLabels } from '../services/api';
import { GraduationCap, Users, Clock, Network } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];
const DEGREE_TYPES = ['BS', 'MS', 'PhD', 'BBA', 'LLB'];

export default function Programs() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [university, setUniversity] = useState(searchParams.get('uni') || '');
  const [degreeType, setDegreeType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (university) params.university = university;
        if (degreeType) params.degree_type = degreeType;
        const res = await getPrograms(params);
        setData(res.data.data || []);
        setMeta(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [university, degreeType]);

  const availabilityColor = (avail, total) => {
    if (!total) return 'var(--text-muted)';
    const pct = avail / total;
    if (pct > 0.3) return 'var(--success)';
    if (pct > 0.1) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <>
      <div className="page-header">
        <h2>Programs</h2>
        <p>Distributed query across all university nodes with optional node-level filtering</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <select className="filter-select" value={university} onChange={e => setUniversity(e.target.value)}>
            <option value="">All Universities</option>
            {UNI_IDS.map(u => <option key={u} value={u}>{universityLabels[u]}</option>)}
          </select>
          <select className="filter-select" value={degreeType} onChange={e => setDegreeType(e.target.value)}>
            <option value="">All Degrees</option>
            {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {data.length} programs
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
          <div className="loading"><GraduationCap size={18} /> Fetching from nodes...</div>
        ) : (
          <div className="table-wrap">
            <div className="card" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>University</th>
                    <th>Degree</th>
                    <th>Duration</th>
                    <th>Seats</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(p => (
                    <tr key={`${p.university_id}-${p.id}`}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {p.description.slice(0, 60)}...
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${p.university_id}`}>
                          {universityLabels[p.university_id]}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-default">{p.degree_type}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {p.duration_years}y
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {p.total_seats}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: availabilityColor(p.available_seats, p.total_seats)
                          }} />
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            color: availabilityColor(p.available_seats, p.total_seats)
                          }}>
                            {p.available_seats}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🎓</div>
            <div>No programs found for the selected filters</div>
          </div>
        )}
      </div>
    </>
  );
}
