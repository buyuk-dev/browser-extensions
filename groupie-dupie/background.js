chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "duplicate_window") {
    duplicateWindow();
  }
});

chrome.action.onClicked.addListener(() => {
  // Keeps the service worker alive when the user interacts with the extension
  console.log("Extension icon clicked");
});

async function duplicateWindow() {
  try {
    // Get the current active window and its tabs
    const [currentWindow] = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });

    // Store tab URLs and group information
    const tabsByGroup = {};
    const ungroupedTabs = [];

    for (let tab of currentWindow.tabs) {
      if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        // Ungrouped tabs
        ungroupedTabs.push(tab.url);
      } else {
        // Grouped tabs
        if (!tabsByGroup[tab.groupId]) {
          tabsByGroup[tab.groupId] = {
            urls: [],
            groupInfo: {}
          };
        }
        tabsByGroup[tab.groupId].urls.push(tab.url);
      }
    }

    // Get group information (name, color)
    const groupIds = Object.keys(tabsByGroup);
    if (groupIds.length > 0) {
      const groupInfos = await Promise.all(groupIds.map(groupId => chrome.tabGroups.get(parseInt(groupId))));

      groupInfos.forEach((groupInfo) => {
        tabsByGroup[groupInfo.id].groupInfo = {
          title: groupInfo.title,
          color: groupInfo.color
        };
      });
    }

    // Create a new window for the duplicated tabs
    const newWindow = await chrome.windows.create();

    // Duplicate ungrouped tabs
    for (let url of ungroupedTabs) {
      await chrome.tabs.create({ windowId: newWindow.id, url });
    }

    // Duplicate grouped tabs and recreate the groups
    for (let groupId of groupIds) {
      const { urls, groupInfo } = tabsByGroup[groupId];

      // Open the tabs in the new window
      const tabIds = [];
      for (let url of urls) {
        const tab = await chrome.tabs.create({ windowId: newWindow.id, url });
        tabIds.push(tab.id);
      }

      // Create the group in the new window
      const newGroupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(newGroupId, { title: groupInfo.title, color: groupInfo.color });
    }
  } catch (error) {
    console.error("An error occurred while duplicating the window:", error);
  }
}
