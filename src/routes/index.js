const express = require("express");
const router = express.Router();
const indexController = require("../controllers/indexController.js");

// Routes using controller functions
router.get("/", indexController.getHomePage);
router.post(
  "/signup",
  indexController.validateSignup,
  indexController.postSignup
);

module.exports = router;
