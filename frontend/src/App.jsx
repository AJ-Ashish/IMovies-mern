import { useState, useEffect } from 'react';

const API = (import.meta.env.VITE_API_URL || '') + '/api';
const TIMES = ['10:00 AM', '01:30 PM', '05:00 PM', '09:00 PM'];
const ROWS = ['A', 'B', 'C', 'D', 'E'];
const day = (i) => { const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); };

async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token');
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function Auth({ onDone }) {
  const [signup, setSignup] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async () => {
    try {
      const d = await api(signup ? '/auth/signup' : '/auth/login', 'POST', f);
      localStorage.setItem('token', d.token); localStorage.setItem('name', d.name); onDone(d.name);
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="card p-4 mx-auto mt-5" style={{ maxWidth: 380 }}>
      <h4>{signup ? 'Create account' : 'Login'}</h4>
      {signup && <input className="form-control my-2" placeholder="Name" onChange={(e) => setF({ ...f, name: e.target.value })} />}
      <input className="form-control my-2" placeholder="Email" onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className="form-control my-2" type="password" placeholder="Password" onChange={(e) => setF({ ...f, password: e.target.value })} />
      <div className="text-danger small">{err}</div>
      <button className="btn btn-danger w-100 mt-2" onClick={submit}>{signup ? 'Sign up' : 'Login'}</button>
      <button className="btn btn-link" onClick={() => { setSignup(!signup); setErr(''); }}>
        {signup ? 'Have an account? Login' : 'New here? Sign up'}
      </button>
    </div>
  );
}

function Movies({ onPick }) {
  const [movies, setMovies] = useState([]);
  useEffect(() => { api('/movies').then(setMovies).catch(() => {}); }, []);
  return (
    <div className="row g-3">
      {movies.map((m) => (
        <div className="col-6 col-md-4" key={m._id}>
          <div className="card h-100 p-3 text-center">
            <div style={{ fontSize: 48 }}>{m.emoji}</div>
            <h6 className="mt-2">{m.title}</h6>
            <div className="text-muted small">{m.genre} · {m.language} · {m.duration}</div>
            <div className="fw-bold my-2">₹{m.price}</div>
            <button className="btn btn-danger btn-sm" onClick={() => onPick(m)}>Book Tickets</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Book({ movie, onDone, onBack }) {
  const [date, setDate] = useState(day(0));
  const [time, setTime] = useState(TIMES[0]);
  const [taken, setTaken] = useState([]);
  const [sel, setSel] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    setSel([]);
    api(`/bookings/taken?movie=${movie._id}&date=${date}&time=${encodeURIComponent(time)}`).then(setTaken);
  }, [date, time]);
  const toggle = (s) => setSel(sel.includes(s) ? sel.filter((x) => x !== s) : sel.length < 6 ? [...sel, s] : sel);
  const confirm = async () => {
    try { await api('/bookings', 'POST', { movie: movie._id, date, time, seats: sel }); onDone(); }
    catch (e) { setErr(e.message); }
  };
  return (
    <div>
      <button className="btn btn-outline-secondary btn-sm mb-2" onClick={onBack}>← Back</button>
      <h4>{movie.emoji} {movie.title}</h4>
      <div className="mb-2">{[0, 1, 2, 3, 4].map((i) => (
        <button key={i} className={'btn btn-sm me-1 ' + (date === day(i) ? 'btn-danger' : 'btn-outline-secondary')} onClick={() => setDate(day(i))}>{day(i).slice(5)}</button>))}</div>
      <div className="mb-3">{TIMES.map((t) => (
        <button key={t} className={'btn btn-sm me-1 mb-1 ' + (time === t ? 'btn-danger' : 'btn-outline-secondary')} onClick={() => setTime(t)}>{t}</button>))}</div>
      <div className="text-center text-muted small mb-2">— SCREEN THIS WAY —</div>
      <div className="mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 6, maxWidth: 340 }}>
        {ROWS.flatMap((r) => [1, 2, 3, 4, 5, 6, 7, 8].map((c) => {
          const s = r + c, t = taken.includes(s);
          return <button key={s} disabled={t} onClick={() => toggle(s)}
            className={'btn btn-sm ' + (t ? 'btn-secondary' : sel.includes(s) ? 'btn-success' : 'btn-outline-dark')}>{s}</button>;
        }))}
      </div>
      <div className="text-danger small text-center mt-2">{err}</div>
      <div className="card p-3 mt-3 d-flex flex-row justify-content-between align-items-center">
        <div><b>{sel.join(', ') || 'No seats selected'}</b><div className="text-muted small">Total: ₹{sel.length * movie.price}</div></div>
        <button className="btn btn-danger" disabled={!sel.length} onClick={confirm}>Confirm</button>
      </div>
    </div>
  );
}

function Mine() {
  const [list, setList] = useState([]);
  const load = () => api('/bookings/mine').then(setList);
  useEffect(() => { load(); }, []);
  const cancel = async (id) => { await api('/bookings/' + id, 'DELETE'); load(); };
  return (
    <div>
      <h4>My Bookings</h4>
      {!list.length && <p className="text-muted">No bookings yet.</p>}
      {list.map((b) => (
        <div className="card p-3 mb-2" key={b._id}>
          <b>{b.movie?.title}</b>
          <div className="text-muted small">{b.date} · {b.time}</div>
          <div>Seats: {b.seats.join(', ')} · <b>₹{b.total}</b></div>
          <button className="btn btn-outline-danger btn-sm mt-2 align-self-start" onClick={() => cancel(b._id)}>Cancel</button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [name, setName] = useState(localStorage.getItem('name'));
  const [view, setView] = useState('home');
  const [movie, setMovie] = useState(null);
  const logout = () => { localStorage.clear(); setName(null); setView('home'); };
  return (
    <>
      <nav className="navbar bg-white border-bottom px-3">
        <span className="navbar-brand text-danger fw-bold">🎬 IMovies</span>
        {name && <div>
          <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setView('home')}>Movies</button>
          <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setView('mine')}>My Bookings</button>
          <button className="btn btn-sm btn-danger" onClick={logout}>Logout</button>
        </div>}
      </nav>
      <div className="container py-3" style={{ maxWidth: 900 }}>
        {!name ? <Auth onDone={setName} /> :
          view === 'book' ? <Book movie={movie} onBack={() => setView('home')} onDone={() => setView('mine')} /> :
          view === 'mine' ? <Mine /> :
          <><h4 className="mb-3">Now Showing, {name.split(' ')[0]}</h4><Movies onPick={(m) => { setMovie(m); setView('book'); }} /></>}
      </div>
    </>
  );
}
