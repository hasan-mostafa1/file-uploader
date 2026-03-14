require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("node:path");
const errorMiddleware = require("./middlewares/errorMiddleware");
const webRouter = require("./routes/web");
const passport = require("passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { prisma } = require("./lib/prisma");

/**
 * -------------- GENERAL SETUP ----------------
 */

const app = express();

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * -------------- SESSION SETUP ----------------
 */

const sessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000, //ms
  dbRecordIdIsSessionId: true,
  dbRecordIdFunction: undefined,
});
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Equals 1 day (1 day * 24 hr/1 day * 60 min/1 hr * 60 sec/1 min * 1000 ms / 1 sec)
    },
  }),
);

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */

require("./config/passport");
app.use(passport.session());

/**
 * -------------- ROUTES ----------------
 */

app.use(webRouter);

/**
 * -------------- ERROR HANDLER ---------------
 */

app.use(errorMiddleware);

/**
 * -------------- SERVER ----------------
 */

// Server listens on http://localhost:3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Express app listening on port ${PORT}`);
});

/**
 * -------------- SETTINGS ----------------
 */
const viewsPath = path.join(__dirname, "views");
app.set("views", viewsPath);
app.set("view engine", "ejs");
