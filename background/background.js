/** @module background */
'use strict';

/** Set default options on install.
 */
const setDefaultOptions = () => {
    chrome.storage.local.get(null, res => {
        // Set one default option at a time if it doesn't exist already. This
        // way it's easy to add new options.
        if (!res || !res.hasOwnProperty('mark_key')) {
            chrome.storage.local.set({
                mark_key: {
                    string: 'Control + ,',
                    keys: {
                        ctrl: true,
                        key: ',',
                    },
                },
            });
        }
        if (!res || !res.hasOwnProperty('scroll_key')) {
            chrome.storage.local.set({
                scroll_key: {
                    string: 'Control + .',
                    keys: {
                        ctrl: true,
                        key: '.',
                    },
                },
            });
        }
        if (!res || !res.hasOwnProperty('captured_tab_size')) {
            chrome.storage.local.set({
                captured_tab_size: '100%',
            });
        }
    });
};

/** Take a screenshot and send it to the sender.
 * @param {Object} req
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 * @return Return always true to send the response asynchronously, otherwise
 * the sender never gets the response.
 */
const screenshotListener = (req, sender, sendResponse) => {
    chrome.tabs.captureVisibleTab(imageURI => {
        sendResponse({ image: imageURI });
    });

    return true;
};

setDefaultOptions();
chrome.runtime.onMessage.addListener(screenshotListener);
