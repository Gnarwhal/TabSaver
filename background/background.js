let data           = null;
let livingWindows  = null;
let activeWindow   = -1;
let popupPorts     = [];
let globalWindowId = 0;

let sendData       = nop;
let sendWindowInfo = nop;

////////// On start //////////
function load() {
	// Load stored data
	browser.storage.local.get("version")
		.then(function(version) {
			function format(version) {
				return "v" + version.number[0] + "." + version.number[1] + "." + version.number[2] + " - " + version.stage;
			}
			const CURRENT_VERSION = { number: [ 0, 0, 1 ], stage: "alpha" };
			console.log("Version Info: " + format(CURRENT_VERSION));

			// Handle version changes //
			// -->
			////////////////////////////

			browser.storage.local.set({ version: format(CURRENT_VERSION) }).catch(console.log);
			browser.storage.local.get("save_data")
				.then(function(saveData) {
					if (saveData.save_data === undefined) {
						data = [];
					} else {
						data = saveData.save_data;
					}
					for (port of popupPorts) {
						sendData(port);
					}
				})
				.catch(console.log);

			browser.storage.local.get("global_window_id")
				.then(function(id) {
					if (id.global_window_id === undefined) {
						globalWindowId = 0;
					} else {
						globalWindowId = id.global_window_id;
					}
					getCurrentWindows();
				})
				.catch(console.log);

			function getCurrentWindows() {
				browser.windows.getAll({ populate: true, windowTypes: ["normal"] })
					.then(function(windowInfos) {
						let localLivingWindows = new Map();
						for (windowInfo of windowInfos) {
							let id = generateWindowId();
							if (windowInfo.focused) {
								activeWindow = windowInfo.id;
							}
							let windowTabs = { globalId: id, name: generateName(id), tabs: new Map() };
							localLivingWindows.set(windowInfo.id, windowTabs);
							for (tab of windowInfo.tabs) {
								windowTabs.tabs.set(tab.id, { title: tab.title, url: tab.url });
							}
						}
						livingWindows = localLivingWindows;
						browser.tabs.onUpdated.addListener(tabUpdatedListener);
						browser.tabs.onDetached.addListener(tabDetachedListener);
						browser.tabs.onRemoved.addListener(tabRemovedListener);
						browser.windows.onCreated.addListener(windowCreatedListener);
						browser.windows.onFocusChanged.addListener(windowFocusChangedListener);
						browser.windows.onRemoved.addListener(windowRemovedListener);
						for (port of popupPorts) {
							sendWindowInfo(port);
						}
					})
					.catch(console.log);
			}
		})
		.catch(console.log);

	// Scan already open windows
}
load();

function generateName(id) {
	let name = id.toString(16);
	while (name.length < 6) {
		name = "0" + name;
	}
	return "0x" + name;
}

function generateWindowId() {
	let copy = globalWindowId;
	++globalWindowId;
	return copy;
}
//////////////////////////////

////////// Tab/Window Managment //////////

function validateURL(url) {
	let validAbouts = [
		"about:blank",
		"about:newtab",
		"about:home"
	];
	if (
		   !url.startsWith("chrome:")
		&& !url.startsWith("javascript:")
		&& !url.startsWith("data:")
		&& !url.startsWith("file:")
		&& (!url.startsWith("about:") || validAbouts.includes(url))
		&& url.length > 0
	) {
		return url;
	} else {
		return null;
	}
}

// Tabs

function tabUpdatedListener(id, changeInfo, tab) {
	let url = validateURL(tab.url);
	if (url !== null) {
		livingWindows.get(tab.windowId).tabs.set(id, { title: tab.title, url: url });
	} else {
		livingWindows.get(tab.windowId).tabs.delete(id);
	}
}

function tabDetachedListener(id, detachInfo) {
	livingWindows.get(detachInfo.windowId).tabs.delete(id);
}

function tabRemovedListener(tab, removeInfo) {
	if (!removeInfo.isWindowClosing) {
		livingWindows.get(removeInfo.windowId).tabs.delete(tab);
	}
}

// Windows

function windowCreatedListener(windowInfo) {
	if (windowInfo.type === "normal" && !livingWindows.has(windowInfo.id)) {
		let id = generateWindowId();
		livingWindows.set(windowInfo.id, { globalId: id, name: generateName(id), tabs: new Map() });
	}
}

function windowFocusChangedListener(windowId) {
	activeWindow = windowId;
}

function saveData() {
	let obj = { save_data: data };
	browser.storage.local.set(obj).catch(console.log);
}

function windowRemovedListener(windowInfo) {
	if (livingWindows.has(windowInfo)) {
		let windowData = livingWindows.get(windowInfo);
		if (windowData.tabs.size > 0) {
			let obj = { id: windowData.globalId, name: windowData.name, date: Date.now(), tabs: Array.from(windowData.tabs.values()) };
			data.push(obj);
			saveData();
			for (port of popupPorts) {
				port.postMessage({ type: "addState", data: data[data.length - 1] });
			}
		}
		browser.storage.local.set({ global_window_id: globalWindowId }).catch(console.log);
		livingWindows.delete(windowInfo);
	}
}
//////////////////////////////////////////

browser.runtime.onConnect.addListener(function(port) {
	popupPorts.push(port);
	if (livingWindows !== null) {
		sendLoadedWindowInfo(port);
	} else {
		sendWindowInfo = sendLoadedWindowInfo;
	}
	if (data !== null) {
		sendLoadedData(port);
	} else {
		sendData = sendLoadedData;
	}

	function find(id) {
		for (let i = 0; i < data.length; ++i) {
			if (data[i].id === id) {
				return i;
			}
		}
		return -1;
	}
	function restoreWindow(index) {
		let i = 0;
		let urls = [];
		let newTabs = [];
		for (tab of data[index].tabs) {
			if (tab.url === "about:newtab" || tab.url === "about:home") {
				newTabs.splice(0, 0, i);
			} else {
				urls.push(tab.url);
				++i;
			}
		}
		let globalId = generateWindowId();
		let name = data[index].name;

		if (urls.length === 0) {
			browser.windows.create()
				.then(function(window) {
					let tabs = new Map();
					livingWindows.set(window.id, { globalId: globalId, name: name, tabs: tabs });
					for (tab of window.tabs) {
						tabs.set(tab.id, { title: tab.title, url: tab.url });
					}
					for (let i = 0; i < newTabs.length - 1; ++i) {
						browser.tabs.create({ windowId: window.id })
							.then(function(tab) {
								tabs.set(tab.id, { title: tab.title, url: tab.url });
							})
							.catch(console.log);
					}
				}).catch(console.log);
		} else {
			browser.windows.create({ url: urls })
				.then(function(window) {
					let tabs = new Map();
					livingWindows.set(window.id, { globalId: globalId, name: name, tabs: tabs });
					for (i of newTabs) {
						browser.tabs.create({ windowId: window.id, index: i })
							.then(function(tab) {
								tabs.set(tab.id, { title: tab.title, url: tab.url });
							})
							.catch(console.log);
					}
				})
				.catch(console.log);
		}
	}
	const MESSAGES = {
		updateWindowName: function(message) {
			livingWindows.get(message.active).name = message.name;
		},
		updateEntryName: function(message) {
			let index = find(message.id);
			if (index !== -1) {
				data[index].name = message.name;
			}
		},
		restore: function(message) {
			let index = find(message.id);
			if (index !== -1) {
				restoreWindow(index);
			}
		},
		restoreAndRemove: function(message) {
			let index = find(message.id);
			if (index !== -1) {
				restoreWindow(index);
				data.splice(index, 1);
				saveData();
			}
		},
		remove: function(message) {
			let index = find(message.id);
			if (index !== -1) {
				data.splice(index, 1);
				saveData();
			}
		}
	};
	port.onMessage.addListener(function(message) {
		MESSAGES[message.type](message.data);
	});
	port.onDisconnect.addListener(function(e) {
		if (e.error) {
			console.log("Disconnect error: " + e.error.mesage);
		}
		sendData = nop;
		sendWindowInfo = nop;
		for (let i = 0; i < popupPorts.length; ++i) {
			if (popupPorts[i] == port) {
				popupPorts.splice(i, 1);
			}
		}
	});
});

function nop() {}

function sendLoadedData(port) {
	for (let i = 0; i < data.length; ++i) {
		port.postMessage({ type: "addState", data: data[i] });
	}
	port.postMessage({ type: "complete", data: undefined });
}

function sendLoadedWindowInfo(port) {
	port.postMessage({ type: "activeWindow", data: { active: activeWindow, name: livingWindows.get(activeWindow).name } });
}