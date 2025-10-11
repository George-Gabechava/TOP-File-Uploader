const express = require("express");
const router = express.Router();
const uploaderController = require("../controllers/uploaderController");

const multer = require("multer");

// Upload file destination (temporarily in /public)
const upload = multer({ dest: "./public/data/uploads/" });
// POST upload file
router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("file"),
  function (req, res) {
    res.redirect("/uploader");
  }
);

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// Routes using controller functions
router.get("/", ensureAuthenticated, uploaderController.getUploaderPage);
router.post("/folder", ensureAuthenticated, uploaderController.createFolder);
router.get("/files", ensureAuthenticated, uploaderController.getUserFiles);

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
