const express = require("express");
const router = express.Router();
const uploaderController = require("../controllers/uploaderController");

// Upload file destination (temporarily in /public)
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });

// POST upload file (multer)
// router.post(
//   "/upload",
//   ensureAuthenticated,
//   upload.single("file"),
//   function (req, res) {
//     res.redirect("/uploader");
//   }
// );

// POST upload file
router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("file"),
  uploaderController.uploadFile
);

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// Render page
router.get("/", ensureAuthenticated, uploaderController.getUploaderPage);
router.get(
  "/folder/:folderId",
  ensureAuthenticated,
  uploaderController.renderFolder
);
// Create folder (root or child)
router.post("/folder", ensureAuthenticated, uploaderController.createFolder);
// Edit folder
router.post(
  "/folder/:id/edit",
  ensureAuthenticated,
  uploaderController.editFolder
);

// Delete folder
router.post(
  "/folder/:id/delete",
  ensureAuthenticated,
  uploaderController.deleteFolder
);
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
