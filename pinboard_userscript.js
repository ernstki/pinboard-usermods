// ==UserScript==
// @name         Pinboard: add Prism syntax highlighting
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://pinboard.in/*
// @grant        none
// ==/UserScript==

'use strict';
var head       = document.getElementsByTagName('head')[0];
var prism      = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.8.3/';
var prismjs    = prism + 'prism.min.js';
var prismcss   = prism + 'themes/prism-okaidia.min.css';
var langphp    = prism + 'components/prism-php.js';
var langvim    = prism + 'components/prism-vim.min.js';
var langbash   = prism + 'components/prism-bash.min.js';
var linkerjs   = prism + 'plugins/autolinker/prism-autolinker.min.js';
var linkercss  = prism + 'plugins/autolinker/prism-autolinker.css';
var autoloadjs = prism + 'plugins/autoloader/prism-autoloader.js';
var toolbarjs  = prism + 'plugins/toolbar/prism-toolbar.min.js';
var toolbarcss = prism + 'plugins/toolbar/prism-toolbar.css';
var noop       = Function.prototype;

function addToHead(type, url, cb, attribs) {
    if (typeof(attribs) === 'undefined')
        attribs = {};
    else if (typeof(attribs) !== 'object')
        throw Error("Argument 'attribs' must be an object");

    if (typeof(cb) === 'undefined')
        cb = noop;

    switch (type) {
        case 'javascript':
        case 'script':
        case 'js':
            var tag = document.createElement('script');
            tag.setAttribute('language', 'javascript');
            tag.src = url;
            break;
        case 'stylesheet':
        case 'css':
            var tag = document.createElement('link');
            tag.rel = 'stylesheet';
            tag.href = url;
            break;
        default:
            throw new Error("Bad argument type='type' to addToHead");
    }

    for (var key in attribs) {
        if (attribs.hasOwnProperty(key)) {
            var attr = key;
            // convert camelCase to kebab-case (https://mzl.la/1y8T9IX)
            var munge = function(m,o){ return (o ? '-' : '') + m.toLowerCase(); };
            attr = attr.replace(/[A-Z]/, munge);
            tag.setAttribute(attr, attribs[key]);
        }
    }

    tag.onreadystatechange = cb;
    tag.onload = cb;
    head.appendChild(tag);
} // addToHead()

function setUpAutoload() {
    Prism.plugins.autoloader.languages_path = prism + 'components/';
    Prism.highlightAll();
}

function setUpToolbar() {
    // there's a bug in the example at http://prismjs.com/plugins/toolbar/
    // (you need to pass 'env' to the second argument of registerButton)
    Prism.plugins.toolbar.registerButton('select-code', function(env) {
        var button = document.createElement('button');
        button.innerHTML = 'Select Code';

        button.addEventListener('click', function() {
            // Source: http://stackoverflow.com/a/11128179/2757940
            if (document.body.createTextRange) { // ms
                var range = document.body.createTextRange();
                range.moveToElementText(env.element);
                range.select();
            } else if (window.getSelection) { // moz, opera, webkit
                var selection = window.getSelection();
                var range = document.createRange();
                range.selectNodeContents(env.element);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });

        return button;
    });
}

function setUpPrism() {
    // load plugins
    addToHead('stylesheet', linkercss);
    addToHead('script', linkerjs);
    addToHead('stylesheet', toolbarcss);
    addToHead('script', toolbarjs, setUpToolbar);

    // load languages
    //addToHead('script', langphp);
    //addToHead('script', langvim);
    //addToHead('script', langbash, Prism.highlightAll);

    // use autoloader instead
    addToHead('script', autoloadjs, setUpAutoload);

    // Re-do highlighting after clicking the "save" button
    var editButtons = document.querySelectorAll('.edit_links a.edit');

    [].forEach.call(editButtons, function(btn) {
        // get the bookmark ID
        var bid = btn.parentNode.id.replace(/\..*/, '');

        btn.addEventListener('click', function(bid, ev) {
            // doesn't work because numbers aren't legal HTML element ids
            // source: https://stackoverflow.com/a/7315790
            //var qSel = '#' + bid + ' input[value="save"]';
            var bmDiv = document.getElementById(bid);
            var descDiv = bmDiv.querySelector('div.description');
            var saveBtn = bmDiv.querySelector('input[value="save"]');
            saveBtn.addEventListener('click', function(descDiv, e) {
                // this event fires, but it doesn't actually work
                window.setTimeout(makeRealCodeTags.bind(null, descDiv), 1000);
                window.setTimeout(Prism.highlightAll, 1500);
            }.bind(null, descDiv));
        }.bind(null, bid));
    });
} // setUpPrism

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

    [].forEach.call(elcodes, function(code) {
        var codehtml = code.innerHTML;
        codehtml = codehtml.replace(/<br>/gm, '');
        codehtml = codehtml.replace(/^\n/gm, '');
        codehtml = codehtml.replace(/\n$/gm, '');
        code.innerHTML = codehtml;
    });
} // makeRealCodeTags

function doIt() {
    var els = document.querySelectorAll('div.description');

    [].forEach.call(els, function(el) {
        makeRealCodeTags(el);
    });	 // for each div.description

    addToHead('stylesheet', prismcss);
    addToHead('script', prismjs, setUpPrism); //, {dataManual: 'data-manual'});
} // doIt()

doIt();
