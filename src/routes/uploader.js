const express = require("express");
const router = express.Router();

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// Render uploader
router.get("/", ensureAuthenticated, (req, res) => {
  res.render("uploader", {
    title: "File Uploader",
    user: req.user,
  });
});

// GET log out
router.get("/logOut", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

//
module.exports = router;
