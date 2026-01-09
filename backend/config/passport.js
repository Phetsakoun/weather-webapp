const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  // ฟังก์ชัน verify ต้องมี try-catch เสมอ
  async (accessToken, refreshToken, profile, done) => {
    try {
    // ดึง email จาก profile (กันกรณีไม่มี email)
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }
      let user = await User.findOne({ where: { username: email } });
      if (!user) {
        user = await User.create({
          username: email,
          password: '', // ไม่จำเป็นสำหรับ Google Login
          role: 'user',
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  },
));
