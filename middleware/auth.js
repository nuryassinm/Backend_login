import User from "../models/user.js";
import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    let token;
    
    console.log("=== PROTECT MIDDLEWARE ===");
    // Read token straight from cookies instead of incoming authorization headers
    console.log("Cookies present on request:", req.cookies ? "Yes" : "No");

    if (req.cookies && req.cookies.token) {
        try {
            token = req.cookies.token;
            console.log("Token extracted from Cookie successfully:", token.substring(0, 30) + "...");
            
            console.log("JWT_SECRET exists?", !!process.env.JWT_SECRET);
            
            // Verify the cookie token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Token decoded successfully:", decoded);
            
            req.user = await User.findById(decoded.id).select("-password");
            console.log("User found:", req.user ? req.user.email : "No user found");
            
            if (!req.user) {
                console.log("User not found in database");
                return res.status(401).json({ message: "User not found" });
            }
            
            console.log("✅ Cookie Authentication successful!");
            return next();
            
        } catch (err) {
            console.error("❌ Cookie Token verification failed:");
            console.error("Error name:", err.name);
            console.error("Error message:", err.message);
            
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: "Invalid token structure" });
            }
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Session token expired" });
            }
            
            return res.status(401).json({ message: "Not Authorized, token failed" });
        }
    }
    
    console.log("No authorization cookie found");
    return res.status(401).json({ message: "Not authorized, please log in" });
};