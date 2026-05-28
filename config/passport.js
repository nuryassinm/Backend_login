// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv'; // 👈 1. Import dotenv
import User from '../models/user.js';

// 2. Run config right here to force load variables before GoogleStrategy reads them
dotenv.config(); 

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/users/google/callback',
            proxy: true, 
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if user already exists by googleId
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                // 2. If not, check if they exist by email (signed up traditionally before)
                const email = profile.emails[0].value;
                user = await User.findOne({ email });

                if (user) {
                    // Link Google ID to existing account
                    user.googleId = profile.id;
                    await user.save();
                    return done(null, user);
                }

                // 3. Create a brand new user if they don't exist
                user = await User.create({
                    googleId: profile.id,
                    username: profile.displayName || profile.name.givenName,
                    email: email,
                });

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

export default passport;