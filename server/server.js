import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, default: "Hackathon" },
  eventDate: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
  teamName: { type: String, required: true, trim: true },
  projectTitle: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  repositoryUrl: { type: String, default: "" },
  demoUrl: { type: String, default: "" },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  scores: [{
    judgeName: { type: String, default: "Judge" },
    innovation: { type: Number, min: 0, max: 10, default: 0 },
    functionality: { type: Number, min: 0, max: 10, default: 0 },
    design: { type: Number, min: 0, max: 10, default: 0 },
    technical: { type: Number, min: 0, max: 10, default: 0 }
  }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Tournament = mongoose.model("Tournament", tournamentSchema);
const Submission = mongoose.model("Submission", submissionSchema);

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in first." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

app.get("/api/health", (_req, res) => res.json({ message: "NU HYDROIDS API is running" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "That email is already registered." });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Could not register user.", detail: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Could not log in.", detail: error.message });
  }
});

app.get("/api/tournaments", async (_req, res) => {
  try {
    const tournaments = await Tournament.find().populate("createdBy", "name").sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Could not load tournaments.", detail: error.message });
  }
});

app.post("/api/tournaments", auth, async (req, res) => {
  try {
    const { title, description, category, eventDate } = req.body;
    if (!title) return res.status(400).json({ message: "Tournament title is required." });
    const tournament = await Tournament.create({ title, description, category, eventDate, createdBy: req.user.id });
    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ message: "Could not create tournament.", detail: error.message });
  }
});

app.get("/api/tournaments/:id/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find({ tournament: req.params.id }).populate("submittedBy", "name").sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Could not load submissions.", detail: error.message });
  }
});

app.post("/api/submissions", auth, async (req, res) => {
  try {
    const { tournament, teamName, projectTitle, description, repositoryUrl, demoUrl } = req.body;
    if (!tournament || !teamName || !projectTitle) {
      return res.status(400).json({ message: "Tournament, team name, and project title are required." });
    }
    const exists = await Tournament.findById(tournament);
    if (!exists) return res.status(404).json({ message: "Tournament not found." });
    const submission = await Submission.create({
      tournament, teamName, projectTitle, description, repositoryUrl, demoUrl, submittedBy: req.user.id
    });
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: "Could not submit project.", detail: error.message });
  }
});

app.post("/api/submissions/:id/score", auth, async (req, res) => {
  try {
    const { judgeName, innovation, functionality, design, technical } = req.body;
    const values = [innovation, functionality, design, technical].map(Number);
    if (values.some(n => !Number.isFinite(n) || n < 0 || n > 10)) {
      return res.status(400).json({ message: "Each score must be between 0 and 10." });
    }
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found." });
    submission.scores.push({ judgeName: judgeName || req.user.name, innovation: values[0], functionality: values[1], design: values[2], technical: values[3] });
    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: "Could not save score.", detail: error.message });
  }
});

app.get("/api/leaderboard/:tournamentId", async (req, res) => {
  try {
    const submissions = await Submission.find({ tournament: req.params.tournamentId });
    const ranked = submissions.map(s => {
      const allScores = s.scores.map(x => (x.innovation + x.functionality + x.design + x.technical));
      const average = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      return {
        id: s._id, teamName: s.teamName, projectTitle: s.projectTitle,
        totalScore: Number(average.toFixed(2)), judgeCount: s.scores.length
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: "Could not load leaderboard.", detail: error.message });
  }
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`NU HYDROIDS API running at http://localhost:${PORT}`));
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
