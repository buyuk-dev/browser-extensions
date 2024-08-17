async function getAllTabsAndGroups() {
  const tabs = await chrome.tabs.query({});
  const groups = await chrome.tabGroups.query({});
  
  let tabData = tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    groupId: tab.groupId
  }));

  let groupData = groups.map(group => ({
    id: group.id,
    title: group.title,
    color: group.color
  }));

  return { tabData, groupData };
}

async function sendToGPT(tabStructure) {
  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer YOUR_OPENAI_API_KEY`
    },
    body: JSON.stringify({
      model: "gpt-4",
      prompt: `Here is a list of open tabs and groups: ${JSON.stringify(tabStructure)}. Please reorganize them into logical groups for better productivity.`,
      max_tokens: 500
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].text);
}

async function reorganizeTabs() {
  const { tabData, groupData } = await getAllTabsAndGroups();
  const newStructure = await sendToGPT({ tabData, groupData });

  // Apply the new structure
  for (const group of newStructure.tab_groups) {
    const groupId = await chrome.tabGroups.create({ title: group.name });
    for (const tab of group.tabs) {
      await chrome.tabs.move(tab.id, { index: -1 });
      await chrome.tabs.group({ tabIds: tab.id, groupId: groupId });
    }
  }
}

chrome.action.onClicked.addListener(reorganizeTabs);
