# NU HYDROIDS — MERN Starter

A starter full-stack tournament platform for a school project. Includes:
- Account registration/login (JWT)
- Create and view tournaments
- Submit a team project with repository/demo links
- Judges can score submissions
- Leaderboard totals
- MongoDB persistence

## Requirements
- Node.js LTS
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- VS Code

## 1. Start the backend
Open a terminal in this folder:

```bash
cd server
npm install
```

Copy `.env.example` to `.env`, then set `MONGO_URI` and `JWT_SECRET`.

```bash
npm run dev
```

Backend runs at http://localhost:5000

## 2. Start the frontend
Open a SECOND terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Notes
- Register a user, then create a tournament.
- For this starter, any logged-in user can create tournaments and score projects. Before final submission, add role-based permissions for Admin, Organizer, Participant, and Judge.
- Do not use real passwords or secrets in a school demo.
- Repository URLs are stored and displayed; commit timestamps are not proof of originality.
