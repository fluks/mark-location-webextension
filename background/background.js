'use strict';

/** Set default options on install. onInstalled isn't triggered for
 * temporarily installed add-ons on Firefox and that's the
 * reason this function still exists.
 */
const setDefaultOptions = () => {
    chrome.storage.local.get(null, res => {
        if (!res || !res.hasOwnProperty('mark_key')) {
            chrome.storage.local.set({
                mark_key: {
                    string: 'Control + ,',
                    keys: {
                        ctrl: true,
                        key: ',',
                    },
                },
                scroll_key:  {
                    string: 'Control + .',
                    keys: {
                        ctrl: true,
                        key: '.',
                    },
                },
            });
        }
    });
};

/** Set dafault settings on installing the add-on.
 * @param {Object} details - onInstalled event can be triggered when the add-on
 * is installed, updated or the browser is updated.
 */
const setDefaultSettings = (details) => {
    if (details.reason === 'install') {
        chrome.storage.local.set({
            mark_key: {
                string: 'Control + ,',
                keys: {
                    ctrl: true,
                    key: ',',
                },
            },
            scroll_key:  {
                string: 'Control + .',
                keys: {
                    ctrl: true,
                    key: '.',
                },
            },
        });
    }
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

/* This must be commented out, when creating a release version. onInstalled
 * isn't triggered for temporarily installed add-ons on Firefox and that's the
 * reason this function is still called here.
 */
setDefaultOptions();
// Uncomment this before a release.
// chrome.runtime.onInstalled(setDefaultSettings);
chrome.runtime.onMessage.addListener(screenshotListener);
