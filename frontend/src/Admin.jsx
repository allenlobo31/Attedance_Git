import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';
const STORE_KEY = 'nexus_admin_pw';

function readStored() {
  try { return sessionStorage.getItem(STORE_KEY) || ''; } catch { return ''; }
}
function writeStored(v) {
  try { v ? sessionStorage.setItem(STORE_KEY, v) : sessionStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
}

// Prevent spreadsheet formula injection when exporting names typed by students
const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export default function Admin() {
  const [password, setPassword] = useState('');
  const [key, setKey] = useState(readStored());
  const [rows, setRows] = useState(null);
  const [day, setDay] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(k = key, d = day) {
    setLoading(true);
    setError('');
    try {
      const url = `${API}/api/attendance${d ? `?day=${encodeURIComponent(d)}` : ''}`;
      const res = await fetch(url, { headers: { 'x-admin-key': k } });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { writeStored(''); setKey(''); }
        setRows(null);
        setError(data.message || 'Failed to load.');
        return;
      }
      setRows(data);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (key) load(key, day); /* eslint-disable-next-line */ }, [key, day]);

  function login(e) {
    e.preventDefault();
    writeStored(password);
    setKey(password);
    setPassword('');
  }

  function logout() {
    writeStored('');
    setKey('');
    setRows(null);
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.usn.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  function exportCsv() {
    const head = ['Name', 'USN', 'Date', 'Time', 'Distance (m)', 'IP'];
    const lines = filtered.map((r) =>
      [r.name, r.usn, r.day, new Date(r.createdAt).toLocaleTimeString(), r.distanceFromVenue ?? '', r.ip].map(csvCell).join(',')
    );
    const blob = new Blob([[head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance${day ? `-${day}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!key || !rows) {
    return (
      <main className="card">
        <h1>Admin</h1>
        <form onSubmit={login}>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          </label>
          <button disabled={loading}>{loading ? 'Checking…' : 'Sign in'}</button>
        </form>
        {error && <p className="msg error">{error}</p>}
      </main>
    );
  }

  return (
    <main className="card wide">
      <div className="bar">
        <h1>Attendance</h1>
        <button className="ghost" onClick={logout}>Log out</button>
      </div>
      <div className="filters">
        <input type="search" placeholder="Search name or USN" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} aria-label="Filter by date" />
        <button className="ghost" onClick={() => load()}>{loading ? '…' : 'Refresh'}</button>
        <button className="ghost" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
      </div>
      <p className="count">{filtered.length} record{filtered.length === 1 ? '' : 's'}{day ? ` on ${day}` : ''}</p>
      {error && <p className="msg error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>USN</th><th>Date</th><th>Time</th><th>Distance</th><th>IP</th></tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r._id}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.usn}</td>
                <td>{r.day}</td>
                <td>{new Date(r.createdAt).toLocaleTimeString()}</td>
                <td>{r.distanceFromVenue != null ? `${r.distanceFromVenue} m` : '—'}</td>
                <td>{r.ip}</td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="7" className="empty">No records.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
