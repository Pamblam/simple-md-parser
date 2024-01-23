(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["simpleMDParser"] = factory();
	else
		root["simpleMDParser"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parse: () => (/* binding */ parse)
/* harmony export */ });
/**
 * Convert a string containing Markdown links, images, codeblocks, inline code, bold and italic text to an HTML string.
 *   1. Remove duplicate linebreaks and spaces (including <br>)
 *   2. Convert linebreaks to <br>
 *   3. Convert URLs that are not part of a markdown tag to markdown tags
 *   4. Convert ``` MD code blocks to <pre><code> blocks
 *   5. Convert ` inline code to <code> tags
 *   6. Convert ** bold tags to <b> tags
 *   7. Convert * italics tags to <i> tags
 *   8. Convert ![]() image tags to <img> tags
 *   9. Convert []() links (including the ones from step 3) to <a> tags
 * @param {String} str - The Markdown string to convert to HTML
 * @param {Function} url_callback (optional) - A function that is called for each URL
 *	 The callback function is provided two params - A URL and a the type of tag it was called from  ("image" or "link")
 *	 If the function returns a promise, it will be awaited and the result used
 *	 If the function returns a string that is a complete, valid URL, the string will be used.
 *	 If the function returns anything else, the tag will not be processed at all.
 * @return {String} - Apromise that resolves with the string containing the HTML converted Markdown 
 */
 async function parse({ str, url_callback, render_tag }) {

	if (typeof str !== "string") return "";

	const validate_url = async (url, type) => {
		try {
			if ('function' === typeof url_callback) {
				url = await Promise.resolve(url_callback(url, type));
			}
			new URL(url);
			return url;
		} catch (e) {
			return false;
		}
	};

	if (typeof render_tag !== 'function') {
		render_tag = (tagname, attrs, innerText) => {
			switch (tagname) {
				case "b":
					return `<b>${innerText}</b>`;
				case "i":
					return `<i>${innerText}</i>`;
				case "a":
					return `<a href="${encodeURI(attrs.href)}">${innerText.replace(/<\/a>/gmi, '&lt;/a>')}</a>`;
				case "img":
					return `<img src="${encodeURI(attrs.src)}" alt="${attrs.alt.replace(/\\/gmi, '&#8726;').replace(/"/gmi, '&quot;')}" />`;
				case "code":
					return `<code>${innerText.replace(/<\/code>/gmi, '&lt;/code>')}</code>`;
				case "pre":
					return `<pre><code>${innerText.replace(/<\/code>/gmi, '&lt;/code>').replace(/<\/pre>/gmi, '&lt;/pre>')}</code></pre>`;
				case "ul":
					return `<ul>${innerText.map(text => `<li>${text}</li>`).join('')}</ul>`;
				case "ol":
					return `<ol>${innerText.map(text => `<li>${text}</li>`).join('')}</ol>`;
				case "br":
					return `<br />`;
				default:
					return "";
			}
		};
	}

	var url_regex = /(https?:\/\/)?((www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}|localhost)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gmi,
		img_regex = /!\[([^\]]*)\]\(((https?:\/\/)?((www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}|localhost)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))\)/gmi,
		link_regex = /\[([^\]]*)\]\(((https?:\/\/)?((www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}|localhost)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))\)/gmi,
		opening_pos = false,
		closing_pos = false,
		last_index = 0,
		link_matches,
		img_matches,
		url_matches;

	// Convert <br> to \n
	// Remove extra spaces
	// Ensure no more than two consecutive line breaks
	str = str.replace(/<br[^>]*>/gmi, "\n");
	str = str.replace(/ +/gmi, ' ');
	str = str.replace(/\n{2,}/gmi, "\n\n");

	// Parse lists
	let lines = str.split(/\n/);
	let curr_list = [];
	let lists = [];

	let is_prev_line_list_item = false;
	for (let i = 0; i < lines.length; i++) {
		let item = lines[i].match(/^\s*-\s?([^\n]*)$/);
		if (lines[i].match(/^\s*--/)) item = null;
		if (item !== null) {
			curr_list.push(item[1]);
		} else if (curr_list.length) {
			lists.push({ type: 'ul', line_pos: i - curr_list.length, items: curr_list });
			curr_list = [];
		}
	}
	if (curr_list.length) {
		lists.push({ type: 'ul', line_pos: lines.length - curr_list.length, items: curr_list });
		curr_list = [];
	}

	for (let i = 0; i < lines.length; i++) {
		let item = lines[i].match(/^\s*\d+[\.\)]\s?([^\n]*)$/);
		if (item !== null) {
			curr_list.push(item[1]);
		} else if (curr_list.length) {
			lists.push({ type: 'ol', line_pos: i - curr_list.length, items: curr_list });
			curr_list = [];
		}
	}
	if (curr_list.length) {
		lists.push({ type: 'ol', line_pos: lines.length - curr_list.length, items: curr_list });
		curr_list = [];
	}

	lists.sort((a, b) => a.line_pos > b.line_pos ? 1 : -1);

	for (let i = lists.length; i--;) {
		lines.splice(lists[i].line_pos, lists[i].items.length);
		lines[lists[i].line_pos] = render_tag(lists[i].type, {}, lists[i].items) + (lines[lists[i].line_pos] || '');
		if (lines[lists[i].line_pos - 1]) {
			lines[lists[i].line_pos - 1] += lines[lists[i].line_pos];
			lines.splice(lists[i].line_pos, 1);
		}
	}

	// Convert line breaks (back) to <br>
	str = lines.join(render_tag('br', {}, null));

	// Find all URLs that are not part of an image or link tag and convert them to a link tag
	url_matches = [...str.matchAll(url_regex)].reverse();
	url_matches_loop: for (let n = 0; n < url_matches.length; n++) {
		var url = await validate_url(url_matches[n][0], 'link');
		if (false === url) continue;

		link_matches = [...str.matchAll(link_regex)].reverse();
		for (let i = 0; i < link_matches.length; i++) {
			if (url_matches[n].index > link_matches[i].index && url_matches[n].index < link_matches[i].index + link_matches[i][0].length) {
				continue url_matches_loop;
			}
		}

		img_matches = [...str.matchAll(img_regex)].reverse();
		for (let i = 0; i < img_matches.length; i++) {
			if (url_matches[n].index > img_matches[i].index && url_matches[n].index < img_matches[i].index + img_matches[i][0].length) {
				continue url_matches_loop;
			}
		}

		str = str.substring(0, url_matches[n].index + url_matches[n][0].length) + ')' + str.substring(url_matches[n].index + url_matches[n][0].length);
		str = str.substring(0, url_matches[n].index) + '[' + url_matches[n][0] + '](' + url + str.substring(url_matches[n].index + url_matches[n][0].length);
	}

	// block code
	while (last_index > -1) {
		last_index = str.indexOf("```", last_index);
		if (last_index > -1) {
			if (opening_pos === false) opening_pos = last_index;
			else closing_pos = last_index;
			last_index += 3;
		}
		if (opening_pos !== false && closing_pos !== false) {
			let br = render_tag('br', {}, null)
			let block_code = str.substring(opening_pos + 3, closing_pos);

			if(block_code.startsWith(br)){
				block_code = block_code.substring(br.length)
			}
			
			if(block_code.endsWith(br)){
				block_code = block_code.substring(0, block_code.length-br.length)
			}

			block_code = block_code.replaceAll(br, "\n");
			block_code = block_code.replaceAll('<', '&lt;');
			block_code = block_code.replaceAll('>', '&gt;');
			let html = render_tag('pre', {}, block_code);
			html = html.replaceAll("\n", br);

			let before_html = str.substring(0, opening_pos);
			let after_html = str.substring(closing_pos + 3).replace(/^\s*/, '');

			// remove up to 2 line breaks following the code block, since <pre> is a block level element
			if(after_html.startsWith(br)){
				after_html = after_html.substring(br.length);
				if(after_html.startsWith(br)){
					after_html = after_html.substring(br.length);
				}
			}

			str = before_html + html + after_html;

			last_index = opening_pos + html.length;
			opening_pos = false;
			closing_pos = false;
		}
	}

	opening_pos = false;
	closing_pos = false;
	last_index = 0;

	// inline code
	while (last_index > -1) {
		last_index = str.indexOf("`", last_index);
		if (last_index > -1) {
			if (opening_pos === false) opening_pos = last_index;
			else closing_pos = last_index;
			last_index++;
		}
		if (opening_pos !== false && closing_pos !== false) {
			let html = render_tag('code', {}, str.substring(opening_pos + 1, closing_pos).replaceAll('<', '&lt;').replaceAll('>', '&gt;'));
			str = str.substring(0, opening_pos) + html + str.substring(closing_pos + 1);
			last_index = opening_pos + html.length;
			opening_pos = false;
			closing_pos = false;
		}
	}

	opening_pos = false;
	closing_pos = false;
	last_index = 0;

	// replace bold tags
	while (last_index > -1) {
		last_index = str.indexOf("**", last_index);
		if (last_index > -1) {
			if (opening_pos === false) opening_pos = last_index;
			else closing_pos = last_index;
			last_index += 2;
		}
		if (opening_pos !== false && closing_pos !== false) {
			let html = render_tag('b', {}, str.substring(opening_pos + 2, closing_pos));
			str = str.substring(0, opening_pos) + html + str.substring(closing_pos + 2);
			last_index = opening_pos + html.length;
			opening_pos = false;
			closing_pos = false;
		}
	}

	opening_pos = false;
	closing_pos = false;
	last_index = 0;

	// replace italic tags
	while (last_index > -1) {
		last_index = str.indexOf("*", last_index);
		if (last_index > -1) {
			if (opening_pos === false) opening_pos = last_index;
			else closing_pos = last_index;
			last_index++;
		}
		if (opening_pos !== false && closing_pos !== false) {
			let html = render_tag('i', {}, str.substring(opening_pos + 1, closing_pos));
			str = str.substring(0, opening_pos) + html + str.substring(closing_pos + 1);
			last_index = opening_pos + html.length;
			opening_pos = false;
			closing_pos = false;
		}
	}

	// Convert img tags to <img>
	img_matches = [...str.matchAll(img_regex)].reverse();
	for (let n = 0; n < img_matches.length; n++) {
		var url = await validate_url(img_matches[n][2], 'image');
		if (false === url) continue;
		let html = render_tag('img', { src: url, alt: img_matches[n][1] }, null);
		str = str.substring(0, img_matches[n].index) + html + str.substring(img_matches[n].index + img_matches[n][0].length);
	}

	// Convert links to <a> tags
	link_matches = [...str.matchAll(link_regex)].reverse();
	for (let n = 0; n < link_matches.length; n++) {
		var url = await validate_url(link_matches[n][2], 'link');
		if (false === url) continue;
		let html = render_tag('a', { href: url }, link_matches[n][1]);
		str = str.substring(0, link_matches[n].index) + html + str.substring(link_matches[n].index + link_matches[n][0].length);
	}

	return str;
}
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=simple-md-parser.js.map