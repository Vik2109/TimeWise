const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { sendWelcomeEmail } = require("../utils/sendEmail");

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true, // ← allows us to read state from req
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value
        const state = req.query.state // 'login' or 'register'
        let user = await User.findOne({ email })

        if (state === 'register') {
          if (user) {
            // Account already exists — block registration
            return done(null, false, { message: 'already_registered' })
          }
          // Create new account
          user = await User.create({
            firstName: profile.name.givenName  || profile.displayName,
            lastName:  profile.name.familyName || 'User',
            email,
            googleId:  profile.id,
            avatar:    profile.photos[0]?.value || '',
            password:  require('crypto').randomBytes(32).toString('hex'),
          })
          sendWelcomeEmail(user) // ← welcome email on register
          return done(null, user)
        }

        if (state === 'login') {
          if (!user) {
            // No account found — block login
            return done(null, false, { message: 'no_account' })
          }
          return done(null, user)
        }

        return done(null, false, { message: 'invalid_state' })
      } catch (err) {
        return done(err, null)
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;