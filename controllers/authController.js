const { body, matchedData, validationResult } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const auth = require("../middlewares/authMiddleware");

const validateUser = [
  body("firstName")
    .exists()
    .withMessage("first name is required")
    .trim()
    .notEmpty()
    .withMessage("first name can't be empty")
    .isString()
    .withMessage("first name must be a string"),
  body("lastName")
    .exists()
    .withMessage("last name is required")
    .trim()
    .notEmpty()
    .withMessage("last name can't be empty")
    .isString()
    .withMessage("last name must be a string"),
  body("email")
    .exists()
    .withMessage("email is required")
    .trim()
    .notEmpty()
    .withMessage("email can't be empty")
    .isEmail()
    .withMessage("email is not a valid email address")
    .custom(async (value) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: value },
      });
      if (existingUser) {
        throw new Error("A user already exists with this email address!");
      }
      return true;
    }),
  body("password")
    .exists()
    .withMessage("password is required")
    .trim()
    .notEmpty()
    .withMessage("password can't be empty")
    .isLength({ min: 8 })
    .withMessage("password must contain at least 8 characters"),
  body("passwordConfirmation")
    .exists()
    .withMessage("password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation must match the password field!");
      }
      return true;
    }),
];

module.exports.getSignup = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("auth/signup");
};

module.exports.postSignup = [
  validateUser,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("auth/signup", { errors: errors.array() });
    }
    const { firstName, lastName, email, password, isAdmin } = matchedData(req);
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
      },
    });
    res.redirect("/login");
  },
];

module.exports.getLogin = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("auth/login");
};

module.exports.postLogin = [
  [body("email").exists().isEmail(), body("password").exists()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).render("auth/login", { errors: errors.array() });
    }
    next();
  },
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/",
  }),
];

module.exports.profile = [
  auth,
  (req, res) => res.render("auth/profile", { user: req.user }),
];

module.exports.logout = [
  auth,
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  },
];
