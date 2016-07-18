'use strict';

const
    // Mark key is a comma and goto key is a dot.
    MARK_KEY = 44,
    GOTO_KEY = 46,
    // Time window in ms after pressing a mark or goto key to register
    // a number key press.
    TIME_DELTA_INDEX = 1000,
    MARKS = [];
let
    markPressed = false,
    gotoPressed = false,
    markTimeout,
    gotoTimeout;

/**
 * Get the key pressed under the same property regardless of the browser.
 * @param {Object} e - KeyboardEvent
 * @return {Object} *key* - the key pressed as a number. *ctrlKey* - boolean
 * whether control was pressed or not.
 * @todo Return KeyboardEvent but add key property if needed.
 */
const crossBrowserKey = function(e) {
    return {
        // Use integral values for both browsers, although different.
        key: e.key === undefined ? e.keyCode : e.key.charCodeAt(0),
        ctrlKey: e.ctrlKey
    };
};

/**
 * Handle the keys pressed.
 * Mark a location or go to a location on a page.
 * @param {Object} e - Object returned by the {@link crossBrowserKey} function.
 */
const keydownHandler = function(e) {
    e = crossBrowserKey(e);
    let maybeInt = String.fromCharCode(e.key);

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
        let i = parseInt(maybeInt);

        if (markPressed) {
            window.clearTimeout(markTimeout);
            markPressed = false;

            MARKS[i] = { x: window.pageXOffset, y: window.pageYOffset };
        }
        else if (gotoPressed) {
            window.clearTimeout(gotoTimeout);
            gotoPressed = false;

            let offsets = MARKS[i];
            if (offsets)
                window.scrollTo(offsets.x, offsets.y);
        }
    }
};

window.addEventListener('keydown', keydownHandler);
