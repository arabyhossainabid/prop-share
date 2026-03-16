import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { envVars } from '../config/env';

passport.use(
    new GoogleStrategy(
        {
            clientID: envVars.GOOGLE.CLIENT_ID || 'dummy_id',
            clientSecret: envVars.GOOGLE.CLIENT_SECRET || 'dummy_secret',
            callbackURL: envVars.GOOGLE.CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // We just pass the profile to the callback
                // The AuthService handles the logic of finding/creating the user
                return done(null, profile);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

export default passport;
