// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. RUN DOTENV CONFIG FIRST 
dotenv.config(); 

// 2. NOW IMPORT FILES THAT DEPEND ON ENV VARIABLES
import passport from 'passport'; 
import './config/passport.js';   // 👈 This was running before dotenv could load your keys!
import authRoutes from "./routes/auth.js";
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(passport.initialize());

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