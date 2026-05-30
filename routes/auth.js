import express from 'express';
import crypto from 'crypto'; // 👈 Added for generating random secure reset tokens
import User from '../models/user.js';
import jwt from "jsonwebtoken";
import { protect } from '../middleware/auth.js';
import passport from 'passport';

const router = express.Router();

// Strict password rule: 8+ chars, 1 uppercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};


// Register Route with Explicit Checks
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        // 1. Strict Server-Side Password Validation Guard
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character."
            });
        }

        // 2. Check if the USERNAME is already taken
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: "This username is already taken. Please try another one." });
        }

        // 3. Check if the EMAIL is already registered
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        // 4. Safe to create user now that validations passed
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
        res.status(500).json({ message: "Server error during registration" });
    }
});

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

// ── FORGOT PASSWORD ──
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: "Please provide your email address" });
        }

        const user = await User.findOne({ email });
        
        // Security rule: Don't explicitly reveal if an email doesn't exist
        if (!user) {
            return res.status(200).json({ message: "If that account exists, a reset link has been sent." });
        }

        // Create random 20-character hex string token
        const token = crypto.randomBytes(20).toString('hex');

        // Store token and expiration (15 minutes from now) inside the document
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
        await user.save();

        // Create reset link pointing to your React frontend URL layout
        const resetLink = `http://localhost:5173/reset-password/${token}`;

        // Print to backend log terminal window for local testing
        console.log("\n========== PASSWORD RESET LINK ==========");
        console.log(resetLink);
        console.log("=========================================\n");

        res.status(200).json({ message: "If that account exists, a reset link has been sent." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error handling forgot-password" });
    }
});

// ── RESET PASSWORD ──
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Strict validation check matching the initial registration strength check
    if (!password || !passwordRegex.test(password)) {
        return res.status(400).json({ 
            message: "Password must be 8+ characters with a capital letter, number, and special sign." 
        });
    }

    try {
        // Query user where token matches AND expiration time is greater ($gt) than right now
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or has expired." });
        }

        // Assign password directly. Your mongoose pre-save hook will auto-hash this safely!
        user.password = password;

        // Strip the single-use token fields out completely so they cannot be reused
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password updated successfully!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error resetting password" });
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
        const token = generateToken(req.user._id);
        const frontendUrl = `http://localhost:5173/oauth-success?token=${token}`;
        res.redirect(frontendUrl);
    }
);

// Get current user - PROTECTED ROUTE
router.get("/me", protect, async (req, res) => {
    res.status(200).json(req.user);
});

export default router;