const express = require("express");
const router = express.Router();
const controller = require("../controllers/indexController.js");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "Shmoogle Drive",
    user: req.user,
  });
});

// Sign Up router
router.post("/signup", controller.validateSignup, controller.postSignup);

// Log in router
// code here

//
module.exports = router;
