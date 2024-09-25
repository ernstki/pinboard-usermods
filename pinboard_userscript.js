// ==UserScript==
// @name         Pinboard: add Prism syntax highlighting
// @namespace    com.github.ernstki.pinboard-usermods
// @version      0.2.1
// @description  Create actual <code> blocks out of bookmark descriptions and apply autoloaded Prism syntax highlighting to them
// @match        https://pinboard.in/*
// @downloadURL  https://raw.githubusercontent.com/ernstki/pinboard-usermods/refs/heads/master/pinboard_userscript.js
// ==/UserScript==

var head         = document.getElementsByTagName('head')[0];
var prism        = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0';
var prismjs      = prism + '/prism.min.js';
var autoloaderjs = prism + '/plugins/autoloader/prism-autoloader.js';
var toolbarjs    = prism + '/plugins/toolbar/prism-toolbar.min.js';
var prismcss     = prism + '/themes/prism-okaidia.min.css';
var linkercss    = prism + '/plugins/autolinker/prism-autolinker.css';
var toolbarcss   = prism + '/plugins/toolbar/prism-toolbar.css';


// worked for CSS, not so well for JS: https://wiki.greasespot.net/GM.getResourceUrl
// see also: https://wiki.greasespot.net/Third-Party_Libraries#Resource_injection
function addCss(url) {
  var link = document.createElement('link');
  link.setAttribute('href', url);
  link.setAttribute('rel', 'stylesheet');
  head.appendChild(link);
  return new Promise((resolve, reject) => { resolve() });
}


function addJs(url) {
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', url);
  head.appendChild(script);
  return new Promise((resolve, reject) => { resolve() });
}


function makeCodeTags(el) {
  // remove leading and trailing <br> tags:
  el.innerHTML = el.innerHTML
    .replace(/&lt;code([^&]*)&gt;/g, '<pre><code$1>')
    .replace(/&lt;\/code&gt;/g, '</code></pre>');

  // get the new <code> elements
  var codes = el.querySelectorAll('pre>code');

  [].forEach.call(codes, code => {
    if (code.classList.length == 0 ) {
      code.innerHTML = code.innerHTML
        .replace(/<br>(?!\n<br>)/gm, '');
    }
  });
}


// tried Marked, chewed up my <code> elements; just parse some limited Markdown
function parseSomeMarkdown(el) {
  el.innerHTML = el.innerHTML
    .replace(/`([^`]+)`/gm, '<code>$1</code>')
  	.replace(/\*\*([^*]+)\*\*/gm, '<strong>$1</strong>')
   	.replace(/_([^_]+)_/gm, '<em>$1</em>');
}


var els = document.querySelectorAll('div.description');

[].forEach.call(els, el => {
  // make real <code> tags out of every div.description
  makeCodeTags(el);
  parseSomeMarkdown(el);
});


// Re-do highlighting after clicking the "save" button
// FIXME: doesn't work
var editButtons = document.querySelectorAll('.edit_links a.edit');

[].forEach.call(editButtons, function(btn) {
  // get the bookmark ID
  var bid = btn.parentNode.id.replace(/\..*/, '');

  btn.addEventListener('click', function(bid, ev) {
    var bmDiv = document.getElementById(bid);
    var descDiv = bmDiv.querySelector('div.description');
    var saveBtn = bmDiv.querySelector('input[value="save"]');

    saveBtn.addEventListener('click', function(descDiv, e) {
      window.setTimeout(makeCodeTags.bind(null, descDiv), 1000);
      window.setTimeout(Prism.highlightAll, 1500);
    }.bind(null, descDiv));

  }.bind(null, bid));
});


addJs(prismjs)
  .then(() => addJs(autoloaderjs))
  .then(() => addCss(prismcss))
	.then(() => {
    Prism.plugins.autoloader.languages_path = prism + '/components/';
    Prism.highlightAll();
	});


addJs(toolbarjs)
	.then(() => addCss(toolbarcss));
