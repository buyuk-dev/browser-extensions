document.getElementById('duplicate').addEventListener('click', () => {
  console.log("Button clicked, sending message to background script");
  chrome.runtime.sendMessage({ action: "duplicate_window" });
});
