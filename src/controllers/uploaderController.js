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

    res.render("uploader", {
      title: "File Uploader",
      user: req.user,
      userFolders: userFolders,
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
    const { createFolderName, parentId, description } = req.body;

    const folder = await prisma.folder.create({
      data: {
        name: createFolderName,
        parentID: parentId,
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

    res.redirect("/uploader?success=Folder created successfully");
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
