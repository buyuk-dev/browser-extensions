document.getElementById('organize-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "reorganize_tabs" });
});
