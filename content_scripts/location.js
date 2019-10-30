/** @module location */
'use strict';

const
    // Time window in ms after pressing a mark or goto key to register
    // a number key press.
    TIME_DELTA_INDEX = 1000,
    marks = [];
let
    markPressed = false,
    gotoPressed = false,
    markTimeout,
    gotoTimeout;

/**
 * Convert undefined value to false.
 * @param a - Some variable.
 * @return {Boolean} If a is undefined return false, otherwise return a.
 */
const undefinedToFalse = (a) => {
    if (typeof a === 'undefined')
        return false;
    return a;
};

/**
 * Check if the pressed key shortcut and the shortcut from the settings match.
 * @param {KeyboardEvent} pressedKey - The pressed key combo.
 * @param {Object} setKey - Keys from settings.
 * @return {Boolean} True if the keys match, false otherwise.
 */
const keysMatch = (pressedKey, setKey) => {
    return pressedKey.altKey == undefinedToFalse(setKey.alt) &&
        pressedKey.ctrlKey == undefinedToFalse(setKey.ctrl) &&
        pressedKey.shiftKey == undefinedToFalse(setKey.shift) &&
        pressedKey.key === undefinedToFalse(setKey.key);
};

/**
 * Handle the keys pressed.
 * Mark a location or go to a location on a page.
 * @param {Object} e - Object returned by the {@link crossBrowserKey} function.
 */
const keydownHandler = (e) => {
    chrome.storage.local.get(null, res => {
        if (keysMatch(e, res.mark_key.keys)) {
            window.clearTimeout(markTimeout);
            window.clearTimeout(gotoTimeout);
            gotoPressed = false;

            markPressed = true;
            markTimeout = window.setTimeout(function() {
                markPressed = false;
            }, TIME_DELTA_INDEX);
        }
        else if (keysMatch(e, res.scroll_key.keys)) {
            window.clearTimeout(markTimeout);
            window.clearTimeout(gotoTimeout);
            markPressed = false;

            gotoPressed = true;
            gotoTimeout = window.setTimeout(function() {
                gotoPressed = false;
            }, TIME_DELTA_INDEX);
        }
        else if ('1234567890'.includes(e.key)) {
            let i = parseInt(e.key);

            if (markPressed) {
                window.clearTimeout(markTimeout);
                markPressed = false;

                marks[i] = { x: window.pageXOffset, y: window.pageYOffset };
                chrome.runtime.sendMessage({ screenshot: true }, res => {
                    marks[i].image = res.image;
                });
            }
            else if (gotoPressed) {
                window.clearTimeout(gotoTimeout);
                gotoPressed = false;

                let offsets = marks[i];
                if (offsets)
                    window.scrollTo(offsets.x, offsets.y);
            }
        }
    });
};

/** Listen for requests from the popup and do something according to the
 * request.
 * @param {Object} req - Request is one of 'getMarks' {Bool}, 'mark' {Int} or
 * 'scroll' {Int}.
 * @param {MessageSender} sender
 * @param {Function} sendResponse - The function to send a response.
 * @return Return always true to send the response asynchronously, otherwise
 * the sender never gets the response.
 */
const popupListener = (req, sender, sendResponse) => {
    if (req.getMarks) {
        sendResponse({ marks: marks });
    }
    else if (req.mark) {
        const i = req.mark;
        marks[i] = { x: window.pageXOffset, y: window.pageYOffset };
        common.detectBrowser().then(browser => {
            if (browser !== common.FIREFOX_ANDROID) {
                chrome.runtime.sendMessage({ screenshot: true }, res => {
                    marks[i].image = res.image;
                });
            }
        });
    }
    else if (req.scroll) {
        const i = req.scroll;
        window.scrollTo(marks[i].x, marks[i].y);
    }

    return true;
};

window.addEventListener('keydown', keydownHandler);
chrome.runtime.onMessage.addListener(popupListener);
