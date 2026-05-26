import express from 'express';
import cors from 'cors';  // ← ADD THIS
import dotenv from 'dotenv';
import authRoutes from "./routes/auth.js";
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// ✅ ADD CORS MIDDLEWARE - This fixes the CORS error
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Allow React dev servers
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// OR use this simpler version (for development only):
// app.use(cors()); // This allows all origins

app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: "Server is working!" });
});

app.use("/api/users", authRoutes);

console.log("Attempting to connect to MongoDB...");

connectDB().catch(err => {
    console.error("MongoDB connection error:", err);
});

app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});