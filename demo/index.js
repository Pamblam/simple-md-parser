(async function main(){

	const textarea = document.querySelector('#input-textarea');
	const preview_div = document.querySelector('#preview-div');
	const input_div = document.querySelector('#input-div');
	const checkbox = document.querySelector("#markup-cb");

	// expand the textarea as user types, so there's never a scrollbar
	const autoExpandTextarea = function(){
		this.setAttribute('rows', 1);
		var cs = getComputedStyle(this);
		var paddingTop = +cs.paddingTop.substr(0, cs.paddingTop.length-2);
		var paddingBottom = +cs.paddingBottom.substr(0, cs.paddingBottom.length-2);
		var lineHeight = +cs.lineHeight.substr(0, cs.lineHeight.length-2);
		var rows = (this.scrollHeight - (paddingTop + paddingBottom)) / lineHeight;
		this.setAttribute('rows', Math.max(rows, 5));
	};

	// wait for all images to laod
	const waitForImages = async () => {
		return Promise.all([...preview_div.querySelectorAll('img')].map(img=>{
			return new Promise(done=>{
				if(img.complete) done();
				else img.addEventListener('load', ()=>done());
			});
		}));
	};

	const runParser = async function(){
		autoExpandTextarea.call(this);
		let md = this.value;
		let html = await simpleMDParser.parse({str: md});
		preview_div.innerHTML = checkbox.checked ? `<pre>${html.replaceAll("<br />", "<br />\n").replaceAll("<", "&lt;")}</pre>` : html;
		await waitForImages();
	};

	let base_url = location.href.split('/');
	base_url.pop();
	base_url = base_url.join('/');

	textarea.value = `
		http://www.google.com is converted to a link

		*this is italic*

		**this is bold**

		\`<pre>This is inline code</pre>\`

		\`\`\`
		()=>{
			return "here's some block code";
		}
		\`\`\`

		here's an image...
		![](${base_url}/smile.png)

		[here's a link to google](https://www.google.com)

		here's an unordered list
		- one
		- two

		...and an ordered list
		1. one
		1. two
		6. doesn't matter what number you use
		34. yeah..
	`.trim().split("\n").map(l=>l.trim()).join("\n");

	runParser.call(textarea);
	textarea.addEventListener('input', runParser);
	checkbox.addEventListener('input', ()=>runParser.call(textarea));

})();