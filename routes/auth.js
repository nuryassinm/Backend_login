import express from 'express';
import User from '../models/user.js';
import jwt from "jsonwebtoken";
import { protect } from '../middleware/auth.js';  // ← ADD THIS
import passport from 'passport'; // 👈 ADD THIS.

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Register 
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ username, email, password });
        const token = generateToken(user._id);
        
        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
// Login 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        const token = generateToken(user._id);
        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// @desc    Auth with Google
// @route   GET /api/users/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// @desc    Google auth callback
// @route   GET /api/users/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // Successful authentication, generate your custom app JWT
        const token = generateToken(req.user._id);
        
        // Redirect back to your React app frontend with the token inside URL parameters
        // Change localhost:5173 to your actual frontend domain when deploying
        const frontendUrl = `http://localhost:5173/oauth-success?token=${token}`;
        
        res.redirect(frontendUrl);
    }
);
// Get current user - PROTECTED ROUTE
router.get("/me", protect, async (req, res) => {  // ← ADDED 'protect' middleware
    res.status(200).json(req.user);
});

export default router;