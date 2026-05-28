// models/user.js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // 👈 Changed to false for Google OAuth users
    },
    googleId: {         // 👈 Added to track Google Users
        type: String,
        unique: true,
        sparse: true,   // Allows multiple users to have 'undefined' password/googleId without collisions
    }
},{timestamps: true})

userSchema.pre("save", async function(next){
     if(!this.isModified("password") || !this.password) return next(); // 👈 Added check for this.password
     
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

userSchema.methods.matchPassword = async function(enteredPassword) {
    if(!this.password) return false; // If user signed up with Google and has no password
    return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model("User", userSchema);
export default User;