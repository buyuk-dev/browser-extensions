document.getElementById('organize-btn').addEventListener('click', () => {
  console.log("Button clicked, sending message to background script");
  chrome.runtime.sendMessage({ action: "organize_tabs" });
});
