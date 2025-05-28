// ==UserScript==
// @name         Pinboard: add Prism syntax highlighting
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://pinboard.in/*
// @match        https://notes.pinboard.in/*
// @grant        GM_addStyle
// ==/UserScript==

'use strict';
var head = document.getElementsByTagName('head')[0];
var prism = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.8.3/';
var prismjs= prism + 'prism.min.js';
var prismcss = prism + 'themes/prism-okaidia.min.css';
var langphp = prism + 'components/prism-php.js';
var langvim = prism + 'components/prism-vim.min.js';
var langbash = prism + 'components/prism-bash.min.js';
var linkerjs = prism + 'plugins/autolinker/prism-autolinker.min.js';
var linkercss = prism + 'plugins/autolinker/prism-autolinker.css';
var autoloadjs = prism + 'plugins/autoloader/prism-autoloader.js';
var toolbarjs = prism + 'plugins/toolbar/prism-toolbar.min.js';
var toolbarcss = prism + 'plugins/toolbar/prism-toolbar.css';
var noop = Function.prototype;

function addToHead(type, url, cb, attribs) {
    var tag;

    if (typeof(attribs) === 'undefined') {
        attribs = {};
    } else if (typeof(attribs) !== 'object') {
        throw Error("Argument 'attribs' must be an object");
    }

    if (typeof(cb) === 'undefined') {
        cb = noop;
    }

    switch (type) {
        case 'javascript':
        case 'script':
        case 'js':
            tag = document.createElement('script');
            tag.setAttribute('language', 'javascript');
            tag.src = url;
            break;
        case 'stylesheet':
        case 'css':
            tag = document.createElement('link');
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
        var range;
        button.innerHTML = 'Select Code';

        button.addEventListener('click', function() {
            // Source: http://stackoverflow.com/a/11128179/2757940
            if (document.body.createTextRange) { // ms
                range = document.body.createTextRange();
                range.moveToElementText(env.element);
                range.select();
            } else if (window.getSelection) { // moz, opera, webkit
                var selection = window.getSelection();
                range = document.createRange();
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
    // multiple <br> tags
    elhtml = elhtml.replaceAll(/<br>(<br>)+/g, '<br>');

    // make real <code> tags:
    elhtml = elhtml.replace(/&lt;code([^&]*)&gt;/g, '<pre><code$1>');
    elhtml = elhtml.replace(/&lt;\/code&gt;/g, '</code></pre>');
    el.innerHTML = elhtml;

    // get the new <code> elements
    var elcodes = el.getElementsByTagName('code');

    [].forEach.call(elcodes, function(code) {
        var codehtml = code.innerHTML;
        //codehtml = codehtml.replace(/<br>/gm, '');
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

    if (document.location.host.startsWith('notes')) {
        // add user styles for notes.pinboard.in
        GM_addStyle(`
            blockquote.note {
              font-family: Menlo, Open Sans, Arial, helvetica;
            }
            blockquote.note a:hover {
              text-decoration: underline !important;
            }
            code {
              margin: inherit !important;
              padding: 0 3px 2px;
              color: #222;
              background: #efefef;
              font-family: "Ubuntu Mono",Roboto,"DejaVu Sans Mono",monaco,courier,monospace;
            }`
        );
    } else {
      // add user styles for pinboard.in
        GM_addStyle(`
            body
            {
              font: 90%/110% "PT Sans", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", sans-serif !important;
              margin: 0;
            }

            /* a, a:link
            {
              color: #3d332a !important;
            } */

            /* a:visited
            {
              color: #42423d !important;
            } */
            a:hover
            {
              text-decoration: underline !important;
            }

            h2,
            h3,
            .settings_heading,
            td.settings_heading
            {
              background: #e9e7e0;
              color: #a0998d;
            }

            code
            {
              margin-left: 0 !important;
            }

            code a,
            code a:link,
            code a:active,
            code a:hover {
                color: inherit !important;
            }

            #content
            {
              /*margin-top: 60px;*/
              clear: left;
              display: inline-block;
              height: 100%;
              /*width:1000px !important;*/
              padding: 0px 15px;
            }

            #content:after
            {
              content: ".";
              display: block;
              clear: both;
              visibility: hidden;
              line-height: 0;
              height: 0;
            }

            html[xmlns] #content
            {
              display: block;
            }

            * html #content
            {
              height: 1%;
            }

            #banner
            {
              /*position: fixed;*/
              top: 0px;
              background: #444 !important;
              color: #fff;
              padding: 10px;
              box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.5);
              -moz-box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.5);
              -webkit-box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.5);
              z-index: 100;
              border-bottom: 1px solid #222 !important;
              border-bottom-right-radius: 10px;
              -moz-border-radius-bottomright: 10px;
              border-bottom-left-radius: 10px;
              -moz-border-radius-bottomleft: 10px;
            }

            #user_navbar
            {
              display: none;
            }

            #logo .pin_logo
            {
              display: none;
            }

            #logo #pinboard_name
            {
              background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAOCAYAAAD0f5bSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkYwNTY0MzJBMDlDRDExRTA5NTlDQzJEQzQ3NTVCNzdBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkYwNTY0MzJCMDlDRDExRTA5NTlDQzJEQzQ3NTVCNzdBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RjA1NjQzMjgwOUNEMTFFMDk1OUNDMkRDNDc1NUI3N0EiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RjA1NjQzMjkwOUNEMTFFMDk1OUNDMkRDNDc1NUI3N0EiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5t6Ji9AAAAyUlEQVR42mL4//8/AxrmB+IoKM2ADaML2APxWyD+A8TSxGjKhCoGgQ9ArE5IU8h/VFANxPdwaQQRxkD8DU3TZCD2AOLbQKyCTdPJ/9gBssZkID4GxNthmuZA/fMci8aZUIXIzkYJCJD7n/zHDc4DMSe2IMelERQNijB1TAyo4CYQOwDxOzTx71AMBuiaQIATiPmh7EdAHAHVsBEqx4At8hqhTloHxEJQMSFogCwF8RnBHkMFEkDMDMRP0cRBYhNA4tg0EQKuAAEGAMiryfGxuJK6AAAAAElFTkSuQmCC) center left no-repeat;
              height: 14px;
              line-height: 14px;
              padding-left: 20px;
            }

            #timer
            {
              color: #fff;
              display: none;
            }

            #banner a,
            #banner a.banner_username
            {
              color: #fff !important;
            }

            #main_column
            {
              width: auto !important;
              margin-right: 2em;
            }

            a.bookmark_title
            {
              color: #094866 !important;
            }

            a.bookmark_title.unread
            {
              color: #a11a1a !important;
            }

            .bookmark
            {
              border-left: 4px solid rgba(0, 0, 0, 0) !important;
              border-bottom: 1px dashed #bbb !important;
              padding: 10px 2px 10px 10px !important;
              margin-bottom: 0px !important;
            }

            a.bookmark_title
            {
              text-decoration: none !important;
            }

            .bookmark:hover
            {
              background-color: #f5f5f5;
              border-left: 4px solid rgba(20, 60, 120, 0.5) !important;
            }


            /*
            a.tag
            {
              border: 1px solid #ccc;
              padding: 2px 6px;
              background: #ddd;
              -moz-border-radius: 10px;
              border-radius: 10px;
            }

            a.tag:hover
            {
              text-decoration: none;
              background: #eee;
            }
            */
            .star
            {
              margin-left: -40px !important;
              font-size: 1.8em !important;
            }

            #bookmarks a.edit,
            #bookmarks a.delete,
            #bookmarks a.mark_read,
            #edit_bookmark_form input[type="button"],
            #edit_bookmark_form input[type="reset"]
            {
              display: inline-block;
              padding: 4px 8px;
              -moz-border-radius: 10px;
              border-radius: 10px;
              border: 2px solid #ccc;
              margin-top: 0.5em !important;
            }

            #bookmarks a.edit:hover,
            #bookmarks a.delete:hover,
            #bookmarks a.mark_read:hover,
            #edit_bookmark_form input[type="button"]:hover,
            #edit_bookmark_form input[type="reset"]:hover
            {
              text-decoration: none;
              background-color: #fff;
            }

            .display
            {
              float: right;
              width: 580px;
            }

            div.description
            {
              margin: 1em 0 1em !important;
            }

            div.description blockquote
            {
              background-color: #dedede;
              padding: 0.5em 1em;
            }

            div.description pre,
            div.description code
            {
              white-space: pre;
              overflow-x: scroll;
              line-height: 1em;
            }

            textarea.description.edit_form_input,
            div.description code,
            div.description pre
            {
              /*padding-top: 0;*/
              font: 90%/120% "PT Mono", "Ubuntu Mono", "Inconsolata", Consolas, Menlo, monospace !important;
            }

            #edit_bookmark_form
            {
              background-color: transparent !important;
            }

            .bookmark_title
            {
              font-size: 15px;
            }

            .edit_links
            {
              margin-right: 4px;
              opacity: 1;
              float: right;
              text-align: right;
            }

            .edit_links a
            {
              color: #d1cfc9;
            }

            .edit_link a:hover
            {
              font-weight: bold;
            }

            .tabs
            {
              background: none;
            }

            .tab
            {
              background: #e9e7e0;
              border-bottom: none;
              margin-right: 10px;
            }

            .tab_selected
            {
              background: #fff;
            }

            .tab_spacer
            {
              display: none;
            }

            #tab_panes
            {
              border-top: 1px solid #aaa;
            }

            #tag_cloud
            {
              display: none;
            }

            #right_bar
            {
              background: #f5f5f5;
              border: 1px solid #bbb !important;
              border-bottom: 1px solid #aaa !important;
              padding: 10px;
              box-shadow: inset 0px 0px 20px rgba(100, 100, 100, 0.1);
              -moz-box-shadow: inset 0px 0px 20px rgba(100, 100, 100, 0.1);
              -webkit-box-shadow: inset 0px 0px 20px rgba(100, 100, 100, 0.1);
              -moz-border-radius: 10px;
              border-radius: 10px;
              width: 320px !important;
            }

            #right_bar a.tag
            {
              border: 0px;
              padding: 2px 6px;
              background: none;
            }

            #right_bar a:link,
            #right_bar a
            {
              color: #777 !important;
              font-weight: bold;
            }

            #right_bar a.tag:hover
            {
              color: #555 !important;
            }

            #search_query_field
            {
              font-size: 120%;
              max-width: 300px;
              padding: 0.3em;
            }

            #searchbox p
            {
              margin-bottom: 0 !important;
            }

            #searchbox label[for="fulltext"]
            {
              padding-left: 0.5em;
            }

            #searchbox input[type="checkbox"]
            {
              float: left;
            }

            @media (max-width: 900px)
            {
              #banner
              {
                position: relative;
                width: auto !important;
              }

              #content
              {
                width: auto !important;
              }

              #top_menu
              {
                position: absolute;
                right: 0;
                top: 0;
                padding: 0 1em 0 175px;
                text-align: right;
              }

              #right_bar
              {
                display: none;
              }
            }`
        );
    } // add user styles for pinboard.in
} // doIt()

doIt();
