// ==UserScript==
// @name         Pinboard: add Prism syntax highlighting
// @namespace    com.github.ernstki.pinboard-usermods
// @version      0.2
// @description  Create actual &lt;code&gt; blocks out of bookmark descriptions and apply autoloaded Prism syntax highlighting to them
// @match        https://pinboard.in/*
// @downloadURL  https://raw.githubusercontent.com/ernstki/pinboard-usermods/refs/heads/master/pinboard_userscript.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js
// @resource     autoloaderjs  https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.js
// @resource     toolbarjs     https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.min.js
// @resource     prismcss      https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css
// @resource     linkercss     https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autolinker/prism-autolinker.css
// @resource     toolbarcss    https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.css
// @grant        GM.getResourceUrl
// ==/UserScript==


var head = document.getElementsByTagName('head')[0];
var prism = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0';


// via: https://wiki.greasespot.net/GM.getResourceUrl
// see also: https://wiki.greasespot.net/Third-Party_Libraries#Resource_injection
async function addCssResource(resourceName) {
  var style = document.createElement('style');
  fetch(await GM.getResourceUrl(resourceName))
  	.then(r => r.text())
  	.then(rtext => {
    	style.textContent = rtext;
    	head.appendChild(style);
  	});
}


// async function addJsResource(resourceName) {
//   var script = document.createElement('script');
//   fetch(await(GM.getResourceUrl(resourceName));
//   	.then(r => r.text());
//     .then(rtext => {
// 	    script.setAttribute('type', 'text/javascript');
//     	script.textContent = rtext;
// 	    head.appendChild(script);
//   	});
// }


function makeRealCodeTags(el) {
  var elhtml = el.innerHTML;

  // remove leading and trailing <br> tags:
  elhtml = elhtml.replace(/^\n?<br>\n?/, '').replace(/\n?<br>\n?$/, '');

  // make real <code> tags:
  elhtml = elhtml.replace(/&lt;code([^&]*)&gt;/g, '<pre><code$1>');
  elhtml = elhtml.replace(/&lt;\/code&gt;/g, '</code></pre>');
  el.innerHTML = elhtml;

  // get the new <code> elements
  var elcodes = el.getElementsByTagName('code');

  [].forEach.call(elcodes, code => {
    var codehtml = code.innerHTML;
    codehtml = codehtml.replace(/<br>/gm, '');
    codehtml = codehtml.replace(/^\n/gm, '');
    codehtml = codehtml.replace(/\n$/gm, '');
    code.innerHTML = codehtml;
  });
} // makeRealCodeTags


(async () => {
 
  // make real <code> tags out of every div.description
  var els = document.querySelectorAll('div.description');
  [].forEach.call(els, el => makeRealCodeTags(el));
  
  await addCssResource('prismcss');
  
// 	await addCssResource('linkercss');
//   await addCssResource('toolbarcss');
//   await addJsResource('prismjs');
//   await addJsResource('autoloaderjs');
//   await addJsResource('toolbarjs');
  
//   console.log(prism);
// Prism.plugins.autoloader.languages_path = prism + '/components/';
//   Prism.highlightAll();
  
})();
