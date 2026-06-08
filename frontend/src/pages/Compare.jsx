import { useState } from 'react';
import { comparePrograms, universityColors, universityLabels } from '../services/api';
import { GitCompare, Check, Loader } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];
const DEGREE_TYPES = ['', 'BS', 'MS', 'PhD', 'BBA', 'LLB'];

const fmt = (n) => n ? `PKR ${Number(n).toLocaleString()}` : '—';

export default function Compare() {
  const [selected, setSelected] = useState(['uet', 'nuces']);
  const [degreeType, setDegreeType] = useState('BS');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleUni = (uid) => {
    setSelected(prev =>
      prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]
    );
  };

  const runComparison = async () => {
    if (selected.length < 1) return;
    setLoading(true);
    try {
      const res = await comparePrograms(selected, degreeType || undefined);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Compare Universities</h2>
        <p>Side-by-side program and fee comparison using distributed semi-join processing</p>
      </div>

      <div className="page-content">
        {/* Controls */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Configure Comparison</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Select Universities</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {UNI_IDS.map(uid => {
                const active = selected.includes(uid);
                const color = universityColors[uid];
                return (
                  <button
                    key={uid}
                    onClick={() => toggleUni(uid)}
                    className="btn btn-ghost"
                    style={{
                      borderColor: active ? color : 'var(--border)',
                      color: active ? color : 'var(--text-dim)',
                      background: active ? `${color}11` : 'transparent',
                      border: `1px solid ${active ? color : 'var(--border)'}`
                    }}
                  >
                    {active && <Check size={12} />}
                    {universityLabels[uid]}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Degree Type</div>
              <select className="filter-select" value={degreeType} onChange={e => setDegreeType(e.target.value)}>
                <option value="">All</option>
                {['BS', 'MS', 'PhD', 'BBA', 'LLB'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={runComparison} disabled={loading || selected.length === 0}>
                {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <GitCompare size={14} />}
                Run Comparison
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {data && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selected.length}, 1fr)`, gap: 16 }}>
              {selected.map(uid => {
                const programs = (data.comparison?.[uid] || []);
                const color = universityColors[uid];
                const meta = data.university_meta?.[uid] || {};

                return (
                  <div key={uid}>
                    <div style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${color}44`,
                      borderTop: `3px solid ${color}`,
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden'
                    }}>
                      {/* Header */}
                      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color }}>
                          {meta.short || universityLabels[uid]}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                          Est. {meta.established} · {meta.type}
                        </div>
                        <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                          {programs.length} programs found
                        </div>
                      </div>

                      {/* Programs */}
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {programs.map((p, i) => (
                          <div key={i} style={{
                            background: 'var(--bg-card2)',
                            borderRadius: 8,
                            padding: '12px 14px',
                            border: '1px solid var(--border)'
                          }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                              {p.name}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                              <span className="badge badge-default">{p.degree_type}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.duration_years}yr</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              {[
                                { label: 'Semester', value: p.semester_fee },
                                { label: 'Admission', value: p.admission_fee },
                              ].map((f, j) => (
                                <div key={j}>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.label}</div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color }}>
                                    {f.value ? `${Number(f.value).toLocaleString()}` : '—'}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {p.total_seats > 0 && (
                              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                                Seats: <span style={{ color: 'var(--text)' }}>{p.available_seats}/{p.total_seats}</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {programs.length === 0 && (
                          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            No programs found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="empty">
            <div className="empty-icon"><GitCompare size={40} style={{ opacity: 0.3 }} /></div>
            <div>Select universities and run comparison to see results</div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
