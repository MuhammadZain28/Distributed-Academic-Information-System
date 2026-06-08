import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOverview, getNodeStatus, universityColors, universityLabels } from '../services/api';
import { Building2, GraduationCap, Award, Users, Zap, Network, ArrowRight, Database } from 'lucide-react';

const UNI_ORDER = ['uet', 'punjab', 'nuces'];

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, nodeRes] = await Promise.all([getOverview(), getNodeStatus()]);
        setOverview(ovRes.data);
        setNodes(nodeRes.data.nodes || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const unis = overview?.universities || {};
  const totalDepts = UNI_ORDER.reduce((s, u) => s + (unis[u]?.departments || 0), 0);
  const totalProgs = UNI_ORDER.reduce((s, u) => s + (unis[u]?.programs || 0), 0);
  const totalSeats = UNI_ORDER.reduce((s, u) => s + (unis[u]?.total_seats || 0), 0);
  const totalScholarships = UNI_ORDER.reduce((s, u) => s + (unis[u]?.scholarships || 0), 0);

  if (loading) return (
    <div className="loading">
      <Database size={20} style={{ color: 'var(--accent)' }} />
      Querying distributed nodes...
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h2>Centralized Academic Portal</h2>
        <p>Distributed Database System — 3 University Nodes</p>
      </div>

      <div className="page-content">
        {/* Info box */}
        <div className="info-box" style={{ marginBottom: 24 }}>
          <Network size={15} />
          <span>
            Data is distributed across <strong>UET Lahore</strong>, <strong>University of the Punjab</strong>, and <strong>NUCES (FAST)</strong>.
            Each university maintains local autonomy with horizontal fragmentation. Public data is replicated for fault tolerance.
            {overview && (
              <> Query executed in <strong style={{ fontFamily: 'var(--font-mono)' }}>{overview.query_execution_ms}ms</strong> across {overview.nodes_queried?.length} nodes.</>
            )}
          </span>
        </div>

        {/* Global Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Universities', value: 3, icon: Database, color: 'var(--accent)' },
            { label: 'Departments', value: totalDepts, icon: Building2, color: 'var(--uet)' },
            { label: 'Programs', value: totalProgs, icon: GraduationCap, color: 'var(--punjab)' },
            { label: 'Scholarships', value: totalScholarships, icon: Award, color: 'var(--nuces)' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div className="stat-card" key={i}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Per-University cards */}
        <div className="section-title"><Building2 size={16} /> University Nodes</div>
        <div className="grid-3" style={{ marginBottom: 28 }}>
          {UNI_ORDER.map(uid => {
            const u = unis[uid] || {};
            const meta = u;
            const node = nodes.find(n => n.university_id === uid);

            return (
              <div key={uid} className="card" style={{ borderTop: `3px solid ${universityColors[uid]}` }}>
                <div className="card-header">
                  <div>
                    <div className="card-title">{meta.short || universityLabels[uid]}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Est. {meta.established} · {meta.type}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                    color: node?.connected ? 'var(--success)' : 'var(--danger)'
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: node?.connected ? 'var(--success)' : 'var(--danger)'
                    }} />
                    {node?.connected ? `${node.latency_ms}ms` : 'offline'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Departments', value: u.departments || 0 },
                    { label: 'Programs', value: u.programs || 0 },
                    { label: 'Total Seats', value: u.total_seats || 0 },
                    { label: 'Scholarships', value: u.scholarships || 0 },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px' }}>
                      <div className={`text-${uid}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Link to={`/departments?uni=${uid}`} className="btn btn-ghost btn-sm">Departments</Link>
                  <Link to={`/programs?uni=${uid}`} className="btn btn-ghost btn-sm">Programs</Link>
                  <Link to={`/scholarships?uni=${uid}`} className="btn btn-ghost btn-sm">Scholarships</Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick links */}
        <div className="section-title"><Zap size={16} /> Quick Actions</div>
        <div className="grid-3">
          {[
            { to: '/compare', label: 'Compare Programs Across Universities', icon: '⚖️', desc: 'Side-by-side program and fee comparison' },
            { to: '/admissions?status=open', label: 'Open Admissions', icon: '📋', desc: 'View currently open admission windows' },
            { to: '/merit-lists', label: 'Latest Merit Lists', icon: '📊', desc: 'Published merit lists and closing scores' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 24 }}>{item.icon}</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 12, marginTop: 4 }}>
                  Explore <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
