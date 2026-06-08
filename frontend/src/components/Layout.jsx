import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Building2, GraduationCap, ClipboardList,
  DollarSign, Award, ListOrdered, GitCompare, Search,
  Server, Activity
} from 'lucide-react';
import { getNodeStatus } from '../services/api';

const navItems = [
  { section: 'Overview' },
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/search', label: 'Global Search', icon: Search },
  { section: 'Academic Data' },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/programs', label: 'Programs', icon: GraduationCap },
  { to: '/admissions', label: 'Admissions', icon: ClipboardList },
  { to: '/fees', label: 'Fee Structures', icon: DollarSign },
  { to: '/scholarships', label: 'Scholarships', icon: Award },
  { to: '/merit-lists', label: 'Merit Lists', icon: ListOrdered },
  { section: 'Tools' },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/system', label: 'System Status', icon: Server },
];

export default function Layout() {
  const [nodeStatus, setNodeStatus] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getNodeStatus();
        setNodeStatus(res.data.nodes || []);
      } catch {
        setNodeStatus([]);
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const connectedCount = nodeStatus.filter(n => n.connected).length;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>UniPortal</h1>
          <p>Distributed DB System</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.section) return (
              <div key={i} className="nav-section">{item.section}</div>
            );
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={15} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Activity size={12} style={{ color: connectedCount > 0 ? 'var(--success)' : 'var(--danger)' }} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {connectedCount}/{nodeStatus.length || 3} nodes online
            </span>
          </div>
          {nodeStatus.map(n => (
            <div key={n.university_id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: n.connected ? 'var(--success)' : 'var(--danger)'
              }} />
              <span style={{ fontSize: 11 }}>{n.university_name}</span>
              {n.latency_ms && (
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  {n.latency_ms}ms
                </span>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
