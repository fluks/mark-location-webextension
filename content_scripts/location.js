'use strict';

const IS_FIREFOX = true,
    // KeyboardEvent.key values for Firefox and KeyboardEvent.keyCodes for
    // Chromium. Mark key is a comma and goto key is a dot.
    MARK_KEY = IS_FIREFOX ? 44 : 188,
    GOTO_KEY = IS_FIREFOX ? 46 : 190,
    // Time window in ms after pressing a mark or goto key to register
    // a number key press.
    TIME_DELTA_INDEX = 1000,
    MARKS = [];
var
    markPressed = false,
    gotoPressed = false,
    markTimeout,
    gotoTimeout;

const crossBrowserKey = function(e) {
    return {
        // Use integral values for both browsers, although different.
        key: e.key === undefined ? e.keyCode : e.key.charCodeAt(0),
        ctrlKey: e.ctrlKey
    };
};

const keydownHandler = function(e) {
    e = crossBrowserKey(e);
    var maybeInt = String.fromCharCode(e.key);

    if (e.key === MARK_KEY && e.ctrlKey) {
        window.clearTimeout(markTimeout);
        window.clearTimeout(gotoTimeout);
        gotoPressed = false;

        markPressed = true;
        markTimeout = window.setTimeout(function() {
            markPressed = false;
        }, TIME_DELTA_INDEX);
    }
    else if (e.key === GOTO_KEY && e.ctrlKey) {
        window.clearTimeout(markTimeout);
        window.clearTimeout(gotoTimeout);
        markPressed = false;

        gotoPressed = true;
        gotoTimeout = window.setTimeout(function() {
            gotoPressed = false;
        }, TIME_DELTA_INDEX);
    }
    else if ('1234567890'.includes(maybeInt)) {
        var i = parseInt(maybeInt);

        if (markPressed) {
            window.clearTimeout(markTimeout);
            markPressed = false;

            MARKS[i] = { x: window.pageXOffset, y: window.pageYOffset };
        }
        else if (gotoPressed) {
            window.clearTimeout(gotoTimeout);
            gotoPressed = false;

            var offsets = MARKS[i];
            if (offsets)
                window.scrollTo(offsets.x, offsets.y);
        }
    }
};

window.addEventListener('keydown', keydownHandler);
