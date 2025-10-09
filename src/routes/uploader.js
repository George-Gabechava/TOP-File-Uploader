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

//

module.exports = router;
