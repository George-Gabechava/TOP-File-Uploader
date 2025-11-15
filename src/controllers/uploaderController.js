const { PrismaClient } = require("@prisma/client");
const { check } = require("express-validator");
const prisma = new PrismaClient();
require("dotenv").config();
// Supabase setup
const { createClient } = require("@supabase/supabase-js");
const { redirect } = require("react-router-dom");
const supabase = createClient(
  "https://lxdjtdkmbxyoclnlapet.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

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
        contentsCreatedAt: file.uploadedAt
          ? file.uploadedAt.toLocaleString()
          : "",
        contentsSize: `${file.size}B`,
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
        res.redirect(`/uploader/folder/${parentId}`);
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
  try {
    // Get folder details
    const folderId = req.params.id;
    const newName = req.body.newName.trim();
    const ownerId = req.user.id;

    // Find folder
    const current = await prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: ownerId,
      },
      select: { id: true, parentId: true, name: true },
    });
    const currentParentId = current.parentId;
    // Check if folder name already in use
    let checkResult = await hasDuplicate(
      ownerId,
      currentParentId,
      newName,
      folderId
    );
    // Update folder name
    if (checkResult === false) {
      await prisma.folder.update({
        where: { id: folderId },
        data: { name: newName },
      });
    }
    // Stop if found duplicate name.
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

    // Clear any existing error message
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
    // Delete folder and contents.
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

    // Clear any existing error message
    delete req.session.errorMessage;
    res.redirect("/uploader");
  } catch (error) {
    console.error("Error deleting folder:", error);
  }
}

// POST upload file
async function uploadFile(req, res) {
  // Send file details to database
  createFileProperties(req, res);

  // Get folder and file name for unique location.
  const folderId = req.body.folderId;
  const filename = req.file.filename;

  // Get file using fs
  try {
    const fs = require("fs");
    const fileBuffer = fs.readFileSync(req.file.path);
    // Upload file to Supabase
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(`${folderId}/${filename}`, fileBuffer, {
        contentType: req.file.mimetype,
      });

    // Reload page
    delete req.session.errorMessage;
    return res.redirect(`/uploader/folder/${folderId}`);
  } catch (error) {
    console.error("Upload error:", error);
    req.session.errorMessage = "Error uploading file.";
    return req.session.save(() => res.redirect(`/uploader/folder/${folderId}`));
  }
}

async function createFileProperties(req, res) {
  try {
    const ownerId = req.user.id;
    const folderId = req.body.folderId;

    // Add file properties to database
    await prisma.file.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        ownerId,
        folderId,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    req.session.errorMessage = "Error uploading file.";
  }
}

async function viewFile(req, res) {
  try {
    // Get file
    const file = await prisma.file.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: { Folder: true },
    });

    const errorMessage = req.session.errorMessage;

    const details = {
      ...file,
      formattedUploadedAt: file.uploadedAt.toLocaleString(),
      formattedSize: `${file.size}B`,
    };

    // Render specific details
    return res.render("file", {
      title: details.fileName,
      file: details,
      folder: file.Folder,
      errorMessage,
      user: req.user,
    });
  } catch (error) {
    console.error("file details error:", error);
    return req.session.save(() => res.redirect(`/uploader/folder/${folderId}`));
  }
}

async function downloadFile(req, res) {
  try {
    // Get file details
    const file = await prisma.file.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        folderId: true,
        ownerId: true,
      },
    });

    // Download file via signed url
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUrl(`${file.folderId}/${file.fileName}`, 300, {
        download: file.originalName || file.fileName,
      });

    if (error || !data) {
      console.log(error);
      req.session.errorMessage = "Could not download file.";
      return res.redirect(`/uploader/folder/${file.folderId}`);
    }

    return res.redirect(data.signedUrl);
  } catch (error) {
    console.error("file download error:", error);
    req.session.errorMessage = "Download failed.";
    return res.redirect("/uploader");
  }
}

async function shareFile(req, res) {
  try {
    // Get file details
    const file = await prisma.file.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        folderId: true,
        ownerId: true,
      },
    });

    console.log(
      "about to await supabase storage: ",
      `${file.folderId}/${file.fileName}`
    );

    // Get url via signed url (86400 seconds = expires after 24 hours).
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUrl(`${file.folderId}/${file.fileName}`, 500);

    console.log("shareable?: ", data.signedUrl);

    if (error || !data) {
      console.log(error);
      req.session.errorMessage = "Could not generate signed URL.";
      return res.redirect(`/uploader/folder/${file.folderId}`);
    }

    return res.type("text/plain").send(data.signedUrl);
  } catch (error) {
    console.error("file download error:", error);
    req.session.errorMessage = "Download failed.";
    return res.redirect("/uploader");
  }
}

module.exports = {
  getUploaderPage,
  renderFolder,
  createFolder,
  editFolder,
  deleteFolder,
  uploadFile,
  createFileProperties,
  viewFile,
  downloadFile,
  shareFile,
};
