import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is not supported.'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export default function App() {
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [status, setStatus] = useState({ type: 'idle', text: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: 'loading', text: 'Getting your location…' });

    let coords;
    try {
      const pos = await getPosition();
      coords = pos.coords;
    } catch (err) {
      const text =
        err.code === 1
          ? 'Location permission denied. Allow location access to mark attendance.'
          : 'Could not get your location. Try again outdoors or near a window.';
      return setStatus({ type: 'error', text });
    }

    setStatus({ type: 'loading', text: 'Submitting…' });
    try {
      const res = await fetch(`${API}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          usn,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setStatus({ type: 'error', text: data.message || 'Submission failed.' });
      setStatus({ type: 'success', text: `Attendance recorded for ${data.record.usn}.` });
      setName('');
      setUsn('');
    } catch {
      setStatus({ type: 'error', text: 'Could not reach the server.' });
    }
  }

  const busy = status.type === 'loading';

  return (
    <main className="card">
      <h1>Nexus Attendance</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
        </label>
        <label>
          USN
          <input
            value={usn}
            onChange={(e) => setUsn(e.target.value.toUpperCase())}
            required
            minLength={6}
            maxLength={20}
            pattern="[A-Za-z0-9]+"
            title="Letters and digits only"
          />
        </label>
        <button disabled={busy}>{busy ? status.text : 'Submit'}</button>
      </form>
      {status.type !== 'idle' && status.type !== 'loading' && (
        <p className={`msg ${status.type}`}>{status.text}</p>
      )}
    </main>
  );
}
