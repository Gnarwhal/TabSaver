function completeTemplate(template, keyValues) {
	template = resources["popup/src/templates/" + template + ".template"].trim();
	for (keyValue of keyValues) {
		template = template.replace(keyValue[0], keyValue[1]);
	}
	let element = document.createElement("template");
	element.innerHTML = template;
	return element.content.firstChild;
}