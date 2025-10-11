const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET uploader page
async function getUploaderPage(req, res) {
  try {
    // Fetch user's folders from database
    const userFolders = await prisma.folder.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Get error message from session
    const errorMessage = req.session.errorMessage;

    // Clear error message after displaying it.
    // Timeout to prevent no error message bug.
    if (errorMessage) {
      setTimeout(() => {
        delete req.session.errorMessage;
      }, 100);
    }

    res.render("uploader", {
      title: "File Uploader",
      user: req.user,
      userFolders: userFolders,
      errorMessage: errorMessage,
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
  }
}

// GET user's files and folders
async function getUserFiles(req, res) {
  const userFolders = await prisma.user.findMany();
}

// POST create folder
async function createFolder(req, res) {
  try {
    const { createFolderName, description } = req.body;
    let { parentId } = req.body;

    // Handle parentId: null for root folders, or valid folder ID
    if (!parentId || parentId === null || parentId.trim() === "") {
      parentId = null; // Root folder - use null
    }

    // Manual duplicate checking (since PostgreSQL treats NULL != NULL for uniqueness)
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: createFolderName,
        ownerId: req.user.id,
        parentId: parentId, // This will be either null or a valid folder ID
      },
    });

    if (existingFolder) {
      req.session.errorMessage =
        "A folder with that name already exists in this location";
      return res.redirect("/uploader");
    }

    const folder = await prisma.folder.create({
      data: {
        name: createFolderName,
        parentId: parentId,
        description: description,
        ownerId: req.user.id,
      },
      include: {
        owner: true,
        parent: true,
        children: true,
        files: true,
      },
    });

    // Clear any existing error message on successful creation
    delete req.session.errorMessage;
    res.redirect("/uploader");
  } catch (error) {
    console.error("Error creating folder:", error);
  }
}

// POST upload file
async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    console.log("File uploaded:", req.file);
    res.redirect("/uploader?success=File uploaded successfully");
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send("Error uploading file");
  }
}

module.exports = {
  getUploaderPage,
  uploadFile,
  getUserFiles,
  createFolder,
};
