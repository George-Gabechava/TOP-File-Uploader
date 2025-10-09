const express = require("express");
const router = express.Router();
const controller = require("../controllers/indexController.js");

/* GET home page. */
router.get("/", function (req, res, next) {
  // If user is already logged in, redirect to uploader
  if (req.isAuthenticated()) {
    return res.redirect("/uploader");
  }

  res.render("index", {
    title: "Shmoogle Drive",
    user: req.user,
  });
});
// Sign up router
router.post("/signup", controller.validateSignup, controller.postSignup);

//
module.exports = router;
