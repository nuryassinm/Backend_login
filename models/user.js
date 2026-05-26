import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true ,
        unique: true,
    },
    email: {
        type: String,
        required: true ,
        unique: true,
    },
    password: {
        type: String,
        required: true ,
    },



},{timestamps: true})

userSchema.pre("save", async function(next){
     // "this" refers to the user being saved
     if(!this.isModified("password")) return next();
     // Only hash if password was changed (not on every update)
    const salt = await bcrypt.genSalt(10)
    // Salt = random string added to password before hashing
    // 10 = number of rounds (higher = slower = more secure)
    this.password = await bcrypt.hash(this.password, salt)
    // "password123" + salt → "$2b$10$XK2kPqXqJ..."
    next() // Continue saving
})

userSchema.methods.matchPassword = async function(enteredPassword) {
    // bcrypt.compare takes plain password and hash
    // It extracts salt from hash, applies to entered password, then compares
    return await bcrypt.compare(enteredPassword, this.password)
    // Returns true if matches, false if not
}

const User = mongoose.model("User", userSchema);

export default User