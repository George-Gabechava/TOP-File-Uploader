const express = require("express");
const router = express.Router();
const uploaderController = require("../controllers/uploaderController");

// Multer for files
const multer = require("multer");
const upload = multer({ dest: "/tmp/myUploads" });

// POST upload file
router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("selectedFile"),
  uploaderController.uploadFile
);

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// GET rendered page
router.get("/", ensureAuthenticated, uploaderController.getUploaderPage);
router.get(
  "/folder/:folderId",
  ensureAuthenticated,
  uploaderController.renderFolder
);
// POST create folder (root or child)
router.post("/folder", ensureAuthenticated, uploaderController.createFolder);
// POST edit folder
router.post(
  "/folder/:id/edit",
  ensureAuthenticated,
  uploaderController.editFolder
);

// POST delete folder
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

// GET file details
router.get("/file/:id", ensureAuthenticated, uploaderController.viewFile);

// GET file download
router.get(
  "/file/:id/download/",
  ensureAuthenticated,
  uploaderController.downloadFile
);

// GET file shareable link
router.get(
  "/file/:id/share/",
  ensureAuthenticated,
  uploaderController.shareFile
);

module.exports = router;
