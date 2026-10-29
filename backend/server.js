require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Models ----------
const { ObjectId } = mongoose.Schema.Types;
const User = mongoose.model('User', new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String
}));
const Movie = mongoose.model('Movie', new mongoose.Schema({
  title: String, genre: String, language: String, duration: String, price: Number, emoji: String
}));
const Booking = mongoose.model('Booking', new mongoose.Schema({
  user: { type: ObjectId, ref: 'User' }, movie: { type: ObjectId, ref: 'Movie' },
  date: String, time: String, seats: [String], total: Number
}, { timestamps: true }));

// ---------- JWT middleware ----------
const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.userId = jwt.verify(token, process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ message: 'Please login first' }); }
};
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ---------- Auth routes ----------
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 4)
    return res.status(400).json({ message: 'Name, email and password (min 4) required' });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(400).json({ message: 'Email already registered' });
  const u = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 10) });
  res.json({ token: sign(u), name: u.name });
});

app.post('/api/auth/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(400).json({ message: 'Wrong email or password' });
  res.json({ token: sign(u), name: u.name });
});

// ---------- Movie routes ----------
app.get('/api/movies', async (req, res) => res.json(await Movie.find()));

// ---------- Booking routes ----------
app.get('/api/bookings/taken', async (req, res) => {
  const { movie, date, time } = req.query;
  const list = await Booking.find({ movie, date, time });
  res.json(list.flatMap((b) => b.seats));
});

app.post('/api/bookings', auth, async (req, res) => {
  const { movie, date, time, seats } = req.body;
  const m = await Movie.findById(movie);
  if (!m || !seats || !seats.length) return res.status(400).json({ message: 'Invalid booking' });
  const taken = (await Booking.find({ movie, date, time })).flatMap((b) => b.seats);
  if (seats.some((s) => taken.includes(s)))
    return res.status(409).json({ message: 'Some seats were just booked. Pick others.' });
  const b = await Booking.create({ user: req.userId, movie, date, time, seats, total: seats.length * m.price });
  res.json(b);
});

app.get('/api/bookings/mine', auth, async (req, res) =>
  res.json(await Booking.find({ user: req.userId }).populate('movie').sort({ createdAt: -1 })));

app.delete('/api/bookings/:id', auth, async (req, res) => {
  await Booking.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
});

// ---------- Start + seed ----------
mongoose.connect(process.env.MONGO_URI).then(async () => {
  if ((await Movie.countDocuments()) === 0) {
    await Movie.insertMany([
      { title: 'Galaxy Raiders', genre: 'Sci-Fi', language: 'English', duration: '2h 15m', price: 250, emoji: '🚀' },
      { title: 'Dil Ka Safar', genre: 'Romance', language: 'Hindi', duration: '2h 30m', price: 200, emoji: '💖' },
      { title: 'Mumbai Mafia', genre: 'Action', language: 'Hindi', duration: '2h 40m', price: 220, emoji: '🔫' },
      { title: 'Laugh Riot', genre: 'Comedy', language: 'Hindi', duration: '2h 05m', price: 180, emoji: '😂' },
      { title: 'Haunted Haveli', genre: 'Horror', language: 'Hindi', duration: '1h 55m', price: 200, emoji: '👻' },
      { title: 'Toon Kingdom', genre: 'Animation', language: 'English', duration: '1h 40m', price: 150, emoji: '🦁' }
    ]);
    console.log('Seeded movies');
  }
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
}).catch((e) => console.error('MongoDB error:', e.message));
