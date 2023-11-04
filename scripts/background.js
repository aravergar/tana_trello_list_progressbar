chrome.runtime.onInstalled.addListener(async () => {
	for (const cs of chrome.runtime.getManifest().content_scripts) {
		for (const tab of await chrome.tabs.query({url: cs.matches})) {
			chrome.scripting.executeScript({
				target: {tabId: tab.id},
				files: cs.js,
			});
            console.log("Tab reinjection")
		}
        console.log("Content Scripts Reinjection")
	}
    console.log("Reinjected")
});