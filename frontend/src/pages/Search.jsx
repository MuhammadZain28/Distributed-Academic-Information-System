import React, { useState, useRef } from 'react';
import { search as apiSearch, universityColors, universityLabels } from '../services/api';
import { Search as SearchIcon, Network, Clock, Database } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const runSearch = async (q) => {
    if (q.length < 2) { setResult(null); return; }
    setLoading(true);
    try {
      const res = await apiSearch(q);
      setResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 400);
  };

  const entityIcon = (type) => ({ department: '🏛️', program: '🎓', scholarship: '🏆' }[type] || '📄');

  const grouped = {};
  (result?.data || []).forEach(item => {
    const uni = item.university_id;
    if (!grouped[uni]) grouped[uni] = [];
    grouped[uni].push(item);
  });

  return (
    <>
      <div className="page-header">
        <h2>Global Distributed Search</h2>
        <p>Search across all university nodes simultaneously — demonstrates distributed query broadcasting</p>
      </div>

      <div className="page-content">
        {/* Search box */}
        <div style={{ marginBottom: 24, maxWidth: 600 }}>
          <div style={{ position: 'relative' }}>
            <SearchIcon size={16} style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search departments, programs, scholarships..."
              value={query}
              onChange={handleChange}
              style={{ paddingLeft: 42, fontSize: 15, padding: '12px 14px 12px 42px' }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="info-box" style={{ marginBottom: 20, maxWidth: 600 }}>
          <Database size={14} />
          <span>
            Each keystroke broadcasts the query to all 3 university database nodes in parallel.
            Results are merged by the central query router and ranked by relevance.
          </span>
        </div>

        {loading && (
          <div className="loading">
            <Network size={18} style={{ color: 'var(--accent)' }} />
            Broadcasting to all nodes...
          </div>
        )}

        {result && !loading && (
          <>
            <div className="query-meta">
              <span><Network size={12} /> Query: "{result.keyword}"</span>
              <span><Clock size={12} /> {result.execution_time_ms}ms</span>
              <span>Results: {result.total_results}</span>
              <span>Nodes: {result.nodes_responded?.join(', ')}</span>
            </div>

            {result.total_results === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔍</div>
                <div>No results found for "{query}"</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(grouped).map(([uni, items]) => {
                  const color = universityColors[uni];
                  return (
                    <div key={uni}>
                      <div className="section-title">
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                        {universityLabels[uni]}
                        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {items.length} results
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {items.map((item, i) => (
                          <div key={i} className="card" style={{
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                            borderLeft: `3px solid ${color}`
                          }}>
                            <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
                              {entityIcon(item.entity_type)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                                  {item.name}
                                </span>
                                <span className="badge badge-default">{item.entity_type}</span>
                                {item.subtitle && (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {item.subtitle}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                                  {item.description?.slice(0, 120)}{item.description?.length > 120 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!result && !loading && query.length < 2 && (
          <div style={{ padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {['Computer Science', 'Merit Scholarship', 'Engineering', 'ECAT', 'MBA'].map(s => (
                <button
                  key={s}
                  className="btn btn-outline"
                  onClick={() => { setQuery(s); runSearch(s); }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>Try a sample search above</div>
          </div>
        )}
      </div>
    </>
  );
}
