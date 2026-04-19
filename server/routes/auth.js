const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const crypto = require("crypto");
const { sendPasswordReset, sendWelcomeEmail } = require("../utils/sendEmail");
const passport = require("../config/passport");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

const sendUser = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      fullName: user.fullName,
      initials: user.initials,
      avatar: user.avatar,
      plan: user.plan,
      settings: user.settings,
      notifications: user.notifications,
    },
  });
};

// POST /api/auth/register
router.post(
  "/register",
  [
    body("firstName").trim().notEmpty().withMessage("First name required"),
    body("lastName").trim().notEmpty().withMessage("Last name required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be 6+ characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { firstName, lastName, email, password } = req.body;
      const exists = await User.findOne({ email });
      if (exists)
        return res
          .status(409)
          .json({ success: false, message: "Email already registered" });

      const user = await User.create({ firstName, lastName, email, password });
      sendWelcomeEmail(user);
      return sendUser(res, user, 201);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.matchPassword(password))) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password" });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
      return sendUser(res, user);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/auth/me
router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendUser(res, user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put(
  "/profile",
  protect,
  [
    body("firstName").optional().trim().notEmpty(),
    body("lastName").optional().trim().notEmpty(),
    body("email").optional().isEmail(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { firstName, lastName, email, password, settings, notifications, avatar } =
        req.body;
      const user = await User.findById(req.user._id).select("+password");

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (password) user.password = password;
      if (avatar !== undefined) user.avatar = avatar;
      if (settings)
        user.settings = { ...user.settings.toObject(), ...settings };
      if (notifications)
        user.notifications = {
          ...user.notifications.toObject(),
          ...notifications,
        };

      await user.save();
      return sendUser(res, user);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/logout (client just deletes token, but endpoint for logging)
router.post("/logout", protect, (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email required")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const user = await User.findOne({ email: req.body.email });
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "No account with that email" });

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Hash it before saving to DB
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save({ validateBeforeSave: false });

      // Send email
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await sendPasswordReset(user, resetUrl);

      res.json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/reset-password/:token
router.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be 6+ characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      // Hash the token from URL to compare with DB
      const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }, // not expired
      });

      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired reset token" });

      // Set new password and clear reset fields
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return sendUser(res, user);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/auth/google/login — only for existing users
router.get(
  "/google/login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "login",
  }),
);

// GET /api/auth/google/register — creates new account
router.get(
  "/google/register",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "register",
  }),
);

// GET /api/auth/google/callback
router.get(
  "/google/callback",
  (req, res, next) => {
    const state = req.query.state;
    const failureRedirect =
      state === "register"
        ? `${process.env.CLIENT_URL}/register?error=already_registered`
        : `${process.env.CLIENT_URL}/login?error=no_account`;

    passport.authenticate("google", {
      failureRedirect,
      session: false,
    })(req, res, next);
  },
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  },
);

module.exports = router;
