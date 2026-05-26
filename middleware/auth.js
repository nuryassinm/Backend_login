import User from "../models/user.js";
import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    let token;
    
    console.log("=== PROTECT MIDDLEWARE ===");
    console.log("Authorization header:", req.headers.authorization);

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            console.log("Token extracted:", token.substring(0, 50) + "...");
            
            console.log("JWT_SECRET exists?", !!process.env.JWT_SECRET);
            console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Token decoded successfully:", decoded);
            
            req.user = await User.findById(decoded.id).select("-password");
            console.log("User found:", req.user ? req.user.email : "No user found");
            
            if (!req.user) {
                console.log("User not found in database");
                return res.status(401).json({ message: "User not found" });
            }
            
            console.log("✅ Authentication successful!");
            return next();
            
        } catch (err) {
            console.error("❌ Token verification failed:");
            console.error("Error name:", err.name);
            console.error("Error message:", err.message);
            
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: "Invalid token" });
            }
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token expired" });
            }
            
            return res.status(401).json({ message: "Not Authorized, token failed" });
        }
    }
    
    console.log("No token provided");
    return res.status(401).json({ message: "Not authorized, no token" });
};