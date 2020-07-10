let port = null;

let activeWindow = -1;
const MESSAGES = {
	activeWindow: function(message) {
		activeWindow = message.active;
		let windowName = document.getElementById("window_name");
		windowName.style.display = "flex";
		windowName.value = message.name;
		let headerLoading = document.getElementById("header_loading");
		headerLoading.parentElement.removeChild(headerLoading);
	},
	addState: function(message) {
		///////// FILL OUT TEMPLATE /////////
		document.getElementById("list").prepend(completeTemplate(
			"window_entry.html",
			[
				[ "$ID",                 message.id                                    ],
				[ "$VALUE",              message.name                                  ],
				[ "$EXPAND",             resources["popup/res/expand.svg"            ] ],
				[ "$RESTORE",            resources["popup/res/restore.svg"           ] ],
				[ "$RESTORE_AND_REMOVE", resources["popup/res/restore_and_remove.svg"] ],
				[ "$REMOVE",             resources["popup/res/remove.svg"            ] ]
			]
		));
		let superParent = document.getElementById(message.id.toString());
		window.getComputedStyle(superParent).getPropertyValue("height");
		superParent.style.height = "35px";
		let language = navigator.languages[0];
		let options = {};
		superParent.appendChild(completeTemplate(
			"date_entry.html",
			[
				[ "$DATE", new Date(message.date).toLocaleString(language, options) ]
			]
		));
		for (tab of message.tabs) {
			superParent.appendChild(completeTemplate(
				"tab_entry.html",
				[
					[ "$TAB_NAME", tab.title ],
					[ "$TAB_URL",  tab.url   ]
				]
			));
			let tabParent = superParent.lastChild;
			let urlDiv = tabParent.children[3];
			urlDiv.addEventListener("animationiteration", function(e) {
				urlDiv.style.animationPlayState = "paused";
			});
			tabParent.addEventListener("click", function(e) {
				let superHeight = superParent.style.height;
				superHeight = Number(superHeight.substring(0, superHeight.length - 2));
				if (tabParent.classList.contains("tab_parent_expanded")) {
					tabParent.classList.remove("tab_parent_expanded");
					tabParent.children[0].classList.remove("tab_name_literal_expanded");
					tabParent.children[1].classList.remove("tab_name_expanded");
					tabParent.children[2].classList.remove("tab_url_literal_expanded");
					tabParent.children[3].classList.remove("tab_url_expanded");
					superHeight -= 35;
					superParent.style.transitionDelay = "0.25s";
				} else {
					tabParent.classList.add("tab_parent_expanded");
					tabParent.children[0].classList.add("tab_name_literal_expanded");
					tabParent.children[1].classList.add("tab_name_expanded");
					tabParent.children[2].classList.add("tab_url_literal_expanded");
					tabParent.children[3].classList.add("tab_url_expanded");
					superHeight += 35;
					superParent.style.transitionDelay = "0s";
				}
				superParent.style.transitionDuration = "0.25s";
				superParent.style.height = superHeight + "px";
			});
		}
		///////// SET ENTRY NAME PROPERTIES /////////
		let entryName = document.getElementById("tempEntryNameId");
		resizeInput(entryName);
		entryName.addEventListener("input", (e) => resizeInput(e.target));
		entryName.addEventListener("keyup", function(e) {
			if (e.keyCode === 13) {
				e.target.blur();
			}
		});
		entryName.addEventListener("focus", () => entryName.placeholder = entryName.value);
		entryName.addEventListener("blur", function() {
			if (entryName.value === "") {
				entryName.value = entryName.placeholder;
			}
			let parent = entryName.parentElement.parentElement.parentElement;
			port.postMessage({ type: "updateEntryName", data: { id: Number(parent.getAttribute("id")), name: entryName.value } });
		});
		entryName.removeAttribute("id");
		///////// SET EXPAND PROPERTIES /////////
		let expand = document.getElementById("tempExpandId");
		expand.addEventListener("click", function() {
			if (expand.classList.contains("expanded")) {
				expand.classList.remove("expanded");
				superParent.style.transitionDelay = "0s";
				superParent.style.transitionDuration = "0.5s";
				superParent.style.height = "35px";
			} else {
				expand.classList.add("expanded");
				let superHeight = 0;
				for (child of superParent.children) {
					superHeight += 35;
					if (child.classList.contains("tab_parent_expanded")) {
						superHeight += 35;
					}
				}
				superParent.style.height = superHeight + "px";
			}
		});
		expand.removeAttribute("id");
		///////// SET RESTORE PROPERTIES /////////
		let restore = document.getElementById("tempRestoreId");
		restore.addEventListener("click", function() {
			let parent = restore.parentElement.parentElement.parentElement;
			port.postMessage({ type: "restore", data: { id: Number(parent.getAttribute("id")) } });
		});
		restore.removeAttribute("id");

		///////// REMOVE ENTRY /////////
		function removeEntry(parent) {
			parent.children[0].children[0].style.marginLeft = "0%";
			parent.children[0].children[0].style.width      = "100%";

			parent.style.transitionDuration = "0.5s";
			parent.style.transitionDelay = "0.1s";
			parent.style.height = "0%";

			parent.addEventListener("transitionend", (e) => {
				let height = window.getComputedStyle(parent).getPropertyValue("height");
				height = Number(height.substring(0, height.length - 2));
				if (e.propertyName === "height" && height < 10) {
					parent.parentElement.removeChild(parent);
				}
			});
		}
		////////////////////////////////

		///////// SET RESTORE AND REMOVE PROPERTIES /////////
		let restoreAndRemove = document.getElementById("tempRestoreAndRemoveId");
		restoreAndRemove.addEventListener("click", function() {
			let parent = restoreAndRemove.parentElement.parentElement.parentElement;
			port.postMessage({ type: "restoreAndRemove", data: { id: Number(parent.getAttribute("id")) } });
			removeEntry(parent);
		});
		restoreAndRemove.removeAttribute("id");
		///////// SET REMOVE PROPERTIES /////////
		let remove = document.getElementById("tempRemoveId");
		remove.addEventListener("click", function() {
			let parent = remove.parentElement.parentElement.parentElement;
			port.postMessage({ type: "remove", data: { id: Number(parent.getAttribute("id")) } });
			removeEntry(parent);
		});
		remove.removeAttribute("id");
	},
	complete: function() {
		document.getElementById("entry_loading").style.display = "none";
	}
};

loadCallbacks.push(() => {
	port = browser.runtime.connect();
	port.onMessage.addListener(function(message) {
		MESSAGES[message.type](message.data);
	});
});

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

window.addEventListener("load", pseudoResource(() => {
	window.addEventListener("unload", function(e) {
		if (port !== null) {
			port.disconnect();
			port = false;
		}
	});
	dummy = document.getElementById("dummy");

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
}));