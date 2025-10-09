const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Signup Validation Middleware
const validateSignup = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters")
    .escape(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Passwords do not match"),
];

// Signup Handler
async function postSignup(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render("index", {
      title: "Shmoogle Drive",
      user: req.user,
      errors: errors.array(),
    });
  }

  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (existingUser) {
      return res.render("index", {
        title: "Shmoogle Drive",
        user: req.user,
        errors: [{ msg: "Username already exists. Please choose another." }],
      });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
      },
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error in sign-up:", error);
    res.render("index", {
      title: "Shmoogle Drive",
      errors: [{ msg: "An error occurred during sign up" }],
    });
  }
}

module.exports = {
  validateSignup,
  postSignup,
};
