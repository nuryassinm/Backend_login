import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. RUN DOTENV CONFIG FIRST (Crucial for all database and passport keys)
dotenv.config(); 

// 2. NOW IMPORT CONFIGURATIONS AND SERVICES
import passport from 'passport'; 
import './config/passport.js';   // Passport now safely reads loaded environment variables
import authRoutes from "./routes/auth.js";
import { connectDB } from './config/db.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const PORT = process.env.PORT || 5000;
const app = express();

// 3. TRUST PROXY (Allows rate-limiters and secure cookies to read real user IPs behind proxies)
app.set('trust proxy', 1);

// 4. SECURITY HEADERS WITH HELMET
app.use(helmet());

// 5. CORS HEADERS CONFIGURATION (With credentials tracking allowed for cross-origin cookies)
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 6. CORE EXPRESS MIDDLEWARES
app.use(express.json());
app.use(cookieParser()); // Translates raw header cookie strings into accessible req.cookies
app.use(passport.initialize());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: "Server is working!" });
});

// 7. ROUTE BINDING
app.use("/api/users", authRoutes);

// 8. DATABASE LIFECYCLE INITIALIZATION
console.log("Attempting to connect to MongoDB...");
connectDB().catch(err => {
    console.error("MongoDB connection error:", err);
});

// 9. LISTEN FOR CONNECTIONS
app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});