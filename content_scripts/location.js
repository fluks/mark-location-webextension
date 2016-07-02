'use strict';

// Currently, KeyboardEvent object doesn't have a key property in Chromium.
var testIsFirefox = function() {
    return 'key' in new KeyboardEvent(1);
};

var isFirefox = testIsFirefox();
var
    // KeyboardEvent.key values for Firefox and KeyboardEvent.keyCodes for
    // Chromium. On my Finnish keyboard layout keyMark is 'å' and keyGoto
    // is 'ä'.
    keyMark = isFirefox ? 229 : 221,
    keyGoto = isFirefox ? 228 : 222,
    // Time window in ms after pressing a mark or goto key to register
    // a number key press.
    timeDeltaIndex = 1000,
    marks = [],
    markPressed = false,
    gotoPressed = false,
    markTimeout,
    gotoTimeout;

var crossBrowserKey = function(e) {
    return {
        // Use integral values for both browsers, although different.
        key: e.key === undefined ? e.keyCode : e.key.charCodeAt(0),
        ctrlKey: e.ctrlKey
    };
};

var keydownHandler = function(e) {
    e = crossBrowserKey(e);
    var maybeInt = String.fromCharCode(e.key);

    if (e.key === keyMark && e.ctrlKey) {
        window.clearTimeout(markTimeout);
        window.clearTimeout(gotoTimeout);
        gotoPressed = false;

        markPressed = true;
        markTimeout = window.setTimeout(function() {
            markPressed = false;
        }, timeDeltaIndex);
    }
    else if (e.key === keyGoto && e.ctrlKey) {
        window.clearTimeout(markTimeout);
        window.clearTimeout(gotoTimeout);
        markPressed = false;

        gotoPressed = true;
        gotoTimeout = window.setTimeout(function() {
            gotoPressed = false;
        }, timeDeltaIndex);
    }
    else if ('1234567890'.includes(maybeInt)) {
        var i = parseInt(maybeInt);

        if (markPressed) {
            window.clearTimeout(markTimeout);
            markPressed = false;

            marks[i] = { x: window.pageXOffset, y: window.pageYOffset };
        }
        else if (gotoPressed) {
            window.clearTimeout(gotoTimeout);
            gotoPressed = false;

            var offsets = marks[i];
            if (offsets)
                window.scrollTo(offsets.x, offsets.y);
        }
    }
};

window.addEventListener('keydown', keydownHandler);
