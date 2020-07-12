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

		let superHeight = 1;
		let superParent = document.getElementById(message.id.toString());

		// Have to trigger a reflow in order for the animation to trigger properly for whatever reason
		superParent.offsetHeight;
		superParent.style.setProperty("--super-height", "1");

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
			for (let i = 0; i < 2; ++i) {
				tabParent.children[i * 2].addEventListener("click", (event) => {
					event.stopPropagation();
					navigator.clipboard.writeText(tabParent.children[i * 2 + 1].textContent).catch(console.log);
				});
			}
			tabParent.addEventListener("click", function(e) {
				let toggleResult = toggleClass(tabParent, "expanded");
				for (child of tabParent.children) {
					toggleResult.apply(child);
				}
				if (toggleResult.result) {
					superHeight += 1;
					transitionHeight(superParent, superHeight, "0.25s", "0s"); 
				} else {
					superHeight -= 1;
					transitionHeight(superParent, superHeight, "0.25s", "0.25s"); 
				}
			});
		}
		
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
			port.postMessage({ type: "updateEntryName", data: { id: Number(superParent.getAttribute("id")), name: entryName.value } });
		});
		entryName.removeAttribute("id");

		function addClickListener(name, action) {
			let element = document.getElementById("temp" + name + "Id");
			element.addEventListener("click", (event) => {
				action(event, element);
			});
			element.removeAttribute("id");
		}

		function addMessageClickListener(name, action) {
			addClickListener(name.charAt(0).toUpperCase() + name.substring(1), (event) => {
				port.postMessage({ type: name, data: { id: Number(superParent.getAttribute("id")) } });
				action(event)
			});
		}
		
		addClickListener("Expand", (event, expand) => {
			let toggleResult = toggleClass(expand, "expanded");
			if (toggleResult.result) {
				superHeight = 0;
				for (child of superParent.children) {
					superHeight += 1;
					if (child.classList.contains("expanded")) {
						superHeight += 1;
					}
				}
			} else {
				superHeight = 1;
			}
			transitionHeight(superParent, superHeight, "0.5s", "0s"); 
		});
		
		addMessageClickListener("restore", (event) => {});

		function removeEntry() {
			let deleteBackground = superParent.children[0].children[0];
			deleteBackground.style.marginLeft = "0%";
			deleteBackground.style.width      = "100%";

			transitionHeight(superParent, "0.5s", "0.1s");

			superParent.addEventListener("transitionend", (e) => {
				let height = window.getComputedStyle(superParent).getPropertyValue("height");
				height = Number(height.substring(0, height.length - 2));
				if (e.propertyName === "height" && height < 10) {
					superParent.parentElement.removeChild(superParent);
				}
			});
		}

		addMessageClickListener("restoreAndRemove", removeEntry);
		addMessageClickListener("remove",           removeEntry);
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

function resizeInput(element) {
	let style = window.getComputedStyle(element);
	let text = element.value;
	if (text === "") {
		text = element.placeholder;
	}
	element.style.width = Math.max(
		8, // Minimum width of the text field
		textWidth(
			text,
			style.getPropertyValue("font-family"),
			style.getPropertyValue("font-size")
		)
	) + "px";
}

window.addEventListener("load", pseudoResource(() => {
	window.addEventListener("unload", function(e) {
		if (port !== null) {
			port.disconnect();
		}
	});

	widthDummy = document.getElementById("width_dummy");
	copyDummy = document.getElementById("copy_dummy");

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