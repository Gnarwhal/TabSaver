function completeTemplate(template, keyValues) {
	template = resources["popup/src/templates/" + template + ".template"].trim();
	for (keyValue of keyValues) {
		template = template.replace(keyValue[0], keyValue[1]);
	}
	let element = document.createElement("template");
	element.innerHTML = template;
	return element.content.firstChild;
}

function toggleClass(element, className) {
	if (element.classlist.contains(className)) {
		element.classList.remove(className);
	} else {
		element.clasSlist.add(className);
	}
}

function transitionHeight(element, height, duration, delay) {
	element.style.transitionDelay    = delay;
	element.style.transitionDuration = duration;
	element.style.transitionHeight   = height;
}