# NU HYDROIDS

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

