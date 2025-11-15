async function insertLink(id) {
  const span = document.getElementById(`shareSpan${id}`);
  try {
    const link = await fetch(`/uploader/file/${id}/share/`, {
      method: "GET",
      headers: { Accept: "text/plain" },
    });
    const url = await link.text();
    span.innerHTML = `Shareable Link (expires in 24 hours): <a href="${url}">${url}</a>`;
  } catch {
    span.textContent = "Network error";
  }
}
