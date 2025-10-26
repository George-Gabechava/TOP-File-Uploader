//uploaderScripts.js

// folder onClick function
function openFolder(folderId) {
  console.log("oppening folder", folderId);
  // store current folderId
  //code

  // close all folders
  closeAllFolders();

  // add open class to current folder
  let folderElement = document.getElementById("folder" + folderId);
  folderElement.classList.add("open");

  // Show contents
  showFolderContent(folderId);
}

// close all folders
function closeAllFolders() {
  let allFolders = document.querySelectorAll(".folder");
  allFolders.forEach((folder) => {
    folder.classList.remove("open");
  });

  let allContents = document.querySelectorAll(".folderContent");
  allContents.forEach((content) => {
    content.style.display = "none";
  });
}

// show folder content
function showFolderContent(folderId) {
  let folderContent = document.getElementById("content" + folderId);
  if (folderContent) {
    folderContent.style.display = "block";
  }
}
