# IMovies – Movie Ticket Booking Made Simple

A full-stack MERN app to browse movies, pick showtimes, and reserve seats with real-time availability.

**Tech:** React (Vite) · Bootstrap · Node.js · Express.js · MongoDB (Mongoose) · JWT · bcrypt

## Features
- Secure signup/login with JWT authentication and hashed passwords
- Browse movies, pick date and showtime
- Seat selection with real-time availability (double-booking blocked on the server)
- My Bookings page with cancel option

## Prerequisites
Node.js v16+, npm v8+, MongoDB (local or Atlas), VS Code, Postman (for API testing)

## Run locally
**1. Backend**
```
cd backend
npm install
cp .env.example .env     # set MONGO_URI and JWT_SECRET
npm start
```
**2. Frontend** (new terminal)
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## API
| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/signup | – | Register |
| POST | /api/auth/login | – | Login, returns JWT |
| GET | /api/movies | – | List movies |
| GET | /api/bookings/taken | – | Booked seats for a show |
| POST | /api/bookings | JWT | Book seats |
| GET | /api/bookings/mine | JWT | My bookings |
| DELETE | /api/bookings/:id | JWT | Cancel booking |

## Deploy (free)
- Database: MongoDB Atlas (free cluster) → copy connection string
- Backend: Render (root `backend`, start `npm start`, add env vars MONGO_URI, JWT_SECRET)
- Frontend: Vercel/Netlify (root `frontend`, build `npm run build`, env `VITE_API_URL=https://your-backend.onrender.com`)
