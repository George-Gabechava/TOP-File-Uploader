const { PrismaClient } = require("@prisma/client");
const { check } = require("express-validator");
const prisma = new PrismaClient();

// GET uploader page
async function getUploaderPage(req, res) {
  try {
    // Fetch user's folders from database
    let root = await prisma.folder.findFirst({
      where: { ownerId: req.user.id, parentId: null },
      orderBy: { createdAt: "asc" },
    });

    if (!root) {
      root = await prisma.folder.create({
        data: { name: "Root", parentId: null, ownerId: req.user.id },
      });
    }

    return res.redirect(`/uploader/folder/${root.id}`);
  } catch (error) {
    console.error("getUploaderPage error:", error);
    return res.status(500).render("error", { message: "Failed to open root." });
  }
}

async function renderFolder(req, res) {
  try {
    const folder = await prisma.folder.findFirst({
      where: { id: req.params.folderId, ownerId: req.user.id },
      include: {
        parent: true,
        children: true,
        files: true,
      },
    });
    const errorMessage = req.session.errorMessage;
    delete req.session.errorMessage;

    let contents = {
      ...folder,
      contentsCreatedAt: folder.createdAt
        ? folder.createdAt.toLocaleString()
        : "",
      children: folder.children.map((child) => ({
        ...child,
        contentsCreatedAt: child.createdAt
          ? child.createdAt.toLocaleString()
          : "",
      })),
      files: folder.files.map((file) => ({
        ...file,
        contentsCreatedAt: file.createdAt
          ? file.createdAt.toLocaleString()
          : "",
        contentsSize: `${file.size} B`,
      })),
    };
    return res.render("uploader", {
      title: contents.name,
      folder: contents,
      errorMessage,
      user: req.user,
    });
  } catch (error) {
    console.error("renderFolder error:", error);
  }
}

// GET user's files and folders
async function getUserFiles(req, res) {
  const userFolders = await prisma.user.findMany();
  return userFolders;
}

// Check for duplicate folder names
async function hasDuplicate(ownerId, parentId, name, editId = null) {
  // Check for duplicate folder names in the same location
  const existingFolder = await prisma.folder.findFirst({
    where: {
      name: name,
      ownerId: ownerId,
      parentId: parentId || null,
      ...(editId && { id: { not: editId } }),
    },
  });

  if (existingFolder) {
    return true;
  } else {
    return false;
  }
}

// POST create folder
async function createFolder(req, res) {
  try {
    // Match the field name from your form
    let { createFolderName, parentId } = req.body;
    const ownerId = req.user.id;

    console.log("Creating folder:", createFolderName);
    console.log("Parent ID from form:", parentId);

    // check if folder name already in use
    let checkResult = await hasDuplicate(
      ownerId,
      parentId,
      createFolderName.trim()
    );
    if (checkResult === false) {
      // Create the new folder
      await prisma.folder.create({
        data: {
          name: createFolderName,
          parentId: parentId,
          ownerId: req.user.id,
        },
        include: {
          owner: true,
          parent: true,
          children: true,
          files: true,
        },
      });
    }
    if (checkResult === true) {
      req.session.errorMessage = `A folder named "${createFolderName.trim()}" already exists here.`;
      //
      return req.session.save(() => {
        res.redirect(parentId ? `/uploader/folder/${parentId}` : "/uploader");
      });
    }

    delete req.session.errorMessage;
    return res.redirect(`/uploader/folder/${parentId}`);
  } catch (error) {
    console.error("Error creating folder:", error);
    req.session.errorMessage = "Error creating folder. Please try again.";
    res.redirect("/uploader");
  }
}

// POST edit folder
async function editFolder(req, res) {
  console.log(req.body);
  try {
    const folderId = req.params.id;
    const newName = req.body.newName.trim();
    const ownerId = req.user.id;
    console.log("edit", folderId);

    const current = await prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: ownerId,
      },
      select: { id: true, parentId: true, name: true },
    });
    const currentParentId = current.parentId;
    // check if folder name already in use
    let checkResult = await hasDuplicate(
      ownerId,
      currentParentId,
      newName,
      folderId
    );
    console.log(checkResult, currentParentId);
    if (checkResult === false) {
      await prisma.folder.update({
        where: { id: folderId },
        data: { name: newName },
      });
    }
    if (checkResult === true) {
      req.session.errorMessage = `Folder "${newName}" already exists here.`;
      return req.session.save(() => {
        res.redirect(
          current.parentId
            ? `/uploader/folder/${current.parentId}`
            : "/uploader"
        );
      });
    }

    // Clear any existing error message on successful creation
    delete req.session.errorMessage;
    return res.redirect(
      current.parentId ? `/uploader/folder/${current.parentId}` : "/uploader"
    );
  } catch (error) {
    console.error("Error editing folder:", error);
  }
}

// POST delete folder and its children
async function deleteFolder(req, res) {
  try {
    const folderId = req.params.id;
    console.log("delete", folderId);

    const folder = await prisma.folder.delete({
      where: {
        id: folderId,
        ownerId: req.user.id,
      },
      include: {
        children: true,
        files: true,
      },
    });

    // Clear any existing error message on successful creation
    delete req.session.errorMessage;
    res.redirect("/uploader");
  } catch (error) {
    console.error("Error deleting folder:", error);
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
  renderFolder,
  uploadFile,
  getUserFiles,
  createFolder,
  editFolder,
  deleteFolder,
};
