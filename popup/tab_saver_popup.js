let port = false;

let activeWindow = -1;
const MESSAGES = {
	activeWindow: function(message) {
		activeWindow = message.active;
		document.getElementById("window_name").value = message.name;
	},
	addState: function(message) {
		let template = entryTemplate;
		///////// FILL OUT TEMPLATE /////////
		template = template
			.replace(/\$ID/, message.id)
			.replace(/\$VALUE/, message.name)
			.replace(/\$EXPAND/, expandSvg)
			.replace(/\$RESTORE/, restoreSvg)
			.replace(/\$RESTORE_AND_REMOVE/, restoreAndRemoveSvg)
			.replace(/\$REMOVE/, removeSvg);
		let element = document.createElement("template");
		element.innerHTML = template;
		document.getElementById("list").insertBefore(element.content.firstChild, document.getElementById("loading"));
		///////// SET ENTRY NAME PROPERTIES /////////
		let entryName = document.getElementById("tempEntryNameId");
		resizeInput(entryName);
		entryName.addEventListener("input", (e) => resizeInput(e.target));
		entryName.addEventListener("keyup", function(e) {
			if (e.keyCode === 27) {
				e.target.value = e.target.placeholder;
				resizeInput(e.target);
				e.target.blur();
			}
			if (e.keyCode === 13) {
				e.target.blur();
			}
		});
		entryName.addEventListener("focus", () => entryName.placeholder = entryName.value);
		entryName.addEventListener("blur", function() {
			if (entryName.value === "") {
				entryName.value = entryName.placeholder;
			}
		});
		entryName.removeAttribute("id");
		///////// SET EXPAND PROPERTIES /////////
		let expand = document.getElementById("tempExpandId");
		expand.addEventListener("click", function() {
			if (expand.classList.contains("expanded")) {
				expand.classList.remove("expanded");
			} else {
				expand.classList.add("expanded");
			}
		});
		expand.removeAttribute("id");
		///////// SET RESTORE PROPERTIES /////////
		let restore = document.getElementById("tempRestoreId");
		restore.addEventListener("click", function() {
			let parent = restore.parentElement.parentElement;
			port.postMessage({ type: "restore", data: { id: Number(parent.getAttribute("id")) } });
		});
		restore.removeAttribute("id");
		///////// SET RESTORE AND REMOVE PROPERTIES /////////
		let restoreAndRemove = document.getElementById("tempRestoreAndRemoveId");
		restoreAndRemove.addEventListener("click", function() {
			let parent = remove.parentElement.parentElement;
			port.postMessage({ type: "restoreAndRemove", data: { id: Number(parent.getAttribute("id")) } });
			parent.parentElement.removeChild(parent);	
		});
		restoreAndRemove.removeAttribute("id");
		///////// SET REMOVE PROPERTIES /////////
		let remove = document.getElementById("tempRemoveId");
		remove.addEventListener("click", function() {
			let parent = remove.parentElement.parentElement;
			port.postMessage({ type: "remove", data: { id: Number(parent.getAttribute("id")) } });
			parent.parentElement.removeChild(parent);	
		});
		remove.removeAttribute("id");
	},
	complete: function() {
		let loading = document.getElementById("loading");
		loading.parentElement.removeChild(loading);
	}
};

let callCount = 0;
function loadThenConnect() {
	++callCount;
	if (callCount === 5) {
		port = browser.runtime.connect();
		port.onMessage.addListener(function(message) {
			console.log(message);
			MESSAGES[message.type](message.data);
		});
	}
}

let entryTemplate = false;
fetch(browser.runtime.getURL("popup/tab_saver_entry.html.template"))
	.then(response => response.text())
	.then(function(response) {
		entryTemplate = response;
		loadThenConnect();
	})
	.catch(function(e) { console.log(e); entryTemplate = null; });

let expandSvg = false;
fetch(browser.runtime.getURL("popup/expand.svg"))
	.then(response => response.text())
	.then(function(response) {
		expandSvg = response;
		loadThenConnect();
	})
	.catch(function(e) { console.log(e); expandSvg = null; });

let restoreSvg = false;
fetch(browser.runtime.getURL("popup/restore.svg"))
	.then(response => response.text())
	.then(function(response) {
		restoreSvg = response;
		loadThenConnect();
	})
	.catch(function(e) { console.log(e); restoreSvg = null; });

let restoreAndRemoveSvg = false;
fetch(browser.runtime.getURL("popup/restore_and_remove.svg"))
	.then(response => response.text())
	.then(function(response) {
		restoreAndRemoveSvg = response;
		loadThenConnect();
	})
	.catch(function(e) { console.log(e); restoreAndRemoveSvg = null; });

let removeSvg = false;
fetch(browser.runtime.getURL("popup/remove.svg"))
	.then(response => response.text())
	.then(function(response) {
		removeSvg = response;
		loadThenConnect();
	})
	.catch(function(e) { console.log(e); removeSvg = null; });

let dummy = null;
function textWidth(text, fontFamily, fontSize) {
	dummy.style.fontFamily = fontFamily;
	dummy.style.fontSize = fontSize;
	dummy.textContent = '|';
	let pipe_width = dummy.clientWidth;
	dummy.textContent = '|' + text + '|';
	return dummy.clientWidth - 2 * pipe_width;
}

function resizeInput(element) {
	let style = window.getComputedStyle(element);
	let newWidth = 0;
	if (element.value === "") {
		newWidth = textWidth(element.placeholder, style.getPropertyValue("font-family"), style.getPropertyValue("font-size"));
	} else {
		newWidth = textWidth(element.value, style.getPropertyValue("font-family"), style.getPropertyValue("font-size"));
	}
	const MIN_WIDTH = 8;
	if (newWidth < 8) {
		newWidth = 8;
	}
	element.style.width = newWidth + "px";
}

window.addEventListener("load", function() {
	dummy = document.getElementById("dummy");

	let elements = document.getElementsByClassName("expand");
	for (let i = 0; i < elements.length; ++i) {
		let element = elements[i];
	}

	let windowName = document.getElementById("window_name");
	windowName.addEventListener("keyup", function(e) {
		if (e.keyCode === 27) {
			e.target.value = e.target.placeholder;
			e.target.blur();
		}
		if (e.keyCode === 13) {
			e.target.blur();
		}
	});
	windowName.addEventListener("focus", () => windowName.placeholder = windowName.value);
	windowName.addEventListener("blur", function() {
		if (windowName.value === "") {
			windowName.value = windowName.placeholder;
		}
		port.postMessage({ type: "updateWindowName", data: { active: activeWindow, name: windowName.value } });
	});

	loadThenConnect();
});
