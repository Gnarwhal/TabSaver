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
	if (element.classList.contains(className)) {
		element.classList.remove(className);
		return { result: false, apply: (elem) => { elem.classList.remove(className); } };
	} else {
		element.classList.add(className);
		return { result: true,  apply: (elem) => { elem.classList.add(className); } };
	}
}

function transitionHeight(element, height, duration, delay) {
	element.style.transitionDelay    = delay;
	element.style.transitionDuration = duration;
	element.style.setProperty("--super-height", height.toString());
}

let widthDummy = null;
function textWidth(text, fontFamily, fontSize) {
	widthDummy.style.fontFamily = fontFamily;
	widthDummy.style.fontSize = fontSize;
	widthDummy.textContent = '|';
	let pipe_width = widthDummy.clientWidth;
	widthDummy.textContent = '|' + text + '|';
	return widthDummy.clientWidth - 2 * pipe_width;
}

function PxNumber(number) {
	return Number(number.substring(0, number.length - 2));
}
