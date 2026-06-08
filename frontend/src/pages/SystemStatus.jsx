import { useState, useEffect } from 'react';
import { getNodeStatus, getReplicationLogs, simulateReplication, universityColors, universityLabels } from '../services/api';
import { Server, Wifi, WifiOff, RefreshCw, Database, Network, GitFork } from 'lucide-react';

const UNI_IDS = ['uet', 'punjab', 'nuces'];

export default function SystemStatus() {
  const [nodes, setNodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [nodeRes, logRes] = await Promise.all([getNodeStatus(), getReplicationLogs()]);
      setNodes(nodeRes.data.nodes || []);
      setLogs((logRes.data.data || []).slice(0, 20));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (loading) load(); }, [loading]);

  const simulate = async () => {
    setSimulating(true);
    try {
      await simulateReplication();
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };


  return (
    <>
      <div className="page-header">
        <h2>System Status</h2>
        <p>Distributed database node health, query routing, and replication monitoring</p>
      </div>

      <div className="page-content">
        {/* Node Status */}
        <div className="section-title"><Server size={16} /> Database Nodes</div>
        <div className="grid-3" style={{ marginBottom: 28 }}>
          {UNI_IDS.map(uid => {
            const node = nodes.find(n => n.university_id === uid);
            const connected = node?.connected;
            return (
              <div key={uid} className="card" style={{
                borderTop: `3px solid ${connected ? 'var(--success)' : 'var(--danger)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {connected
                    ? <Wifi size={18} style={{ color: 'var(--success)' }} />
                    : <WifiOff size={18} style={{ color: 'var(--danger)' }} />
                  }
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
                      {universityLabels[uid]}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Node: {uid}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>STATUS</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 13, marginTop: 4,
                      color: connected ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {connected ? 'ONLINE' : 'OFFLINE'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>LATENCY</div>
                    <div className={`text-${node?.university_id || 'default'}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginTop: 4 }}>
                      {node?.latency_ms ? `${node.latency_ms}ms` : '—'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div>Fragmentation: Horizontal</div>
                  <div>Autonomy: Local</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture diagram */}
        <div className="section-title" style={{ marginBottom: 14 }}><Network size={16} /> Architecture Overview</div>
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 20,
            padding: '10px 0'
          }}>
            {/* Left: University nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UNI_IDS.map(uid => {
                const color = universityColors[uid];
                const node = nodes.find(n => n.university_id === uid);
                return (
                  <div key={uid} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px',
                    border: `1px solid ${color}33`
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: node?.connected ? 'var(--success)' : 'var(--danger)' }} />
                    <Database size={14} className={`text-${uid}`} />
                    <div>
                      <div className={`text-${uid}`} style={{ fontSize: 12, fontWeight: 600 }}>{universityLabels[uid]}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Local DB · Autonomous
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Middle: Central Router */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 100,
                background: 'var(--bg-card2)',
                border: '1px solid var(--accent)',
                borderRadius: 12,
                padding: '16px 10px',
                margin: '0 auto'
              }}>
                <GitFork size={20} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>CENTRAL</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ROUTER</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>FastAPI</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Query routing<br />Result merging<br />Replication
              </div>
            </div>

            {/* Right: Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Horizontal Fragmentation', desc: 'Data split by university' },
                { label: 'Distributed Query Processing', desc: 'Parallel node execution' },
                { label: 'Data Replication', desc: 'Public data synced across nodes' },
                { label: 'Local Autonomy', desc: 'Each node operates independently' },
              ].map((f, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card2)', borderRadius: 8,
                  padding: '8px 12px', border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Replication */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}><RefreshCw size={16} /> Replication Log</div>
          <button className="btn btn-outline btn-sm" onClick={simulate} disabled={simulating}>
            <RefreshCw size={12} style={{ animation: simulating ? 'spin 1s linear infinite' : 'none' }} />
            {simulating ? 'Simulating...' : 'Simulate Replication'}
          </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {logs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No replication logs yet. Click "Simulate Replication" to generate entries.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Target</th>
                  <th>Table</th>
                  <th>Operation</th>
                  <th>Status</th>
                  <th>Synced At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td><span className={`badge badge-${log.source_node}`}>{log.source_node}</span></td>
                    <td><span className={`badge badge-${log.target_node}`}>{log.target_node}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{log.table_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{log.operation}</td>
                    <td><span className={`badge badge-${log.status === 'success' ? 'active' : 'closed'}`}>{log.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {log.synced_at ? new Date(log.synced_at).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
