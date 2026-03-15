const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");

const customFields = {
  usernameField: "email",
  passwordField: "password",
};

const verifyCallback = async (email, password, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      done(null, false, { message: "Incorrect email" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return done(null, user);
    } else {
      done(null, false, { message: "Incorrect password" });
    }
  } catch (err) {
    done(err);
  }
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (userId, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        folders: true,
        files: true,
      },
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});
