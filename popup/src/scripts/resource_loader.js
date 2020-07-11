const LOAD_FAILED  = 0;
const LOADING      = 1;
const LOAD_SUCCESS = 2;

let loadState           = LOADING;
let pseudoResourceCount = 0;
let loadedCount         = 0;
let resourcePaths       = [
	// HTML Templates
	"popup/src/templates/window_entry.html.template",
	"popup/src/templates/tab_entry.html.template",
	"popup/src/templates/date_entry.html.template",

	// SVG Icons
	"popup/res/expand.svg",
	"popup/res/restore.svg",
	"popup/res/restore_and_remove.svg",
	"popup/res/remove.svg"
];
let loadCallbacks = [];
let resources = {};

resourcePaths.forEach(resourceLoader);

function incrementLoad() {
	++loadedCount;
	if (loadedCount === resourcePaths.length + pseudoResourceCount) {
		for (callback of loadCallbacks) {
			callback();
		}
		loadState = LOAD_SUCCESS;
	}
}

function resourceLoader(resourcePath) {
	fetch(browser.runtime.getURL(resourcePath))
		.then(response => response.text())
		.then((response) => {
			resources[resourcePath] = response;
			incrementLoad();
		});
}

function pseudoResource(func) {
	++pseudoResourceCount;
	return function(e) {
		let ret = func(e);
		incrementLoad();
		return ret;
	}
}