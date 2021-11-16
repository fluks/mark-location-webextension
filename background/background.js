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

/**
 * Set how many positions are marked in a tab, to the
 * browser action's badge text.
 * @function setBrowserActionBadgeOrTitle
 * @param n {Integer} Number of marks set on a tab.
 * @param tabId {Integer} Id of the tab.
 */
const setBrowserActionBadgeOrTitle = (n, tabId) => {
    common.detectBrowser().then(b => {
        if (b !== common.FIREFOX_ANDROID) {
            chrome.browserAction.setBadgeText({
                text: n + '',
                tabId: tabId,
            });
        }
        else {
            if (n)
                n = `Mark Location (${n})`;
            // FfA doesn't update the title to the default title with empty
            // string on tab update, we have to set it explicitly.
            else
                n = 'Mark Location';
            chrome.browserAction.setTitle({
                title: n,
                tabId: tabId,
           });
        }
    });
};

/** Take a screenshot and send it to the sender.
 * @function takeScreenshotAndUpdateBadgeOrTitle
 * @param {Object} req
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 * @return Return always true to send the response asynchronously, otherwise
 * the sender never gets the response.
 */
const takeScreenshotAndUpdateBadgeOrTitle = (req, sender, sendResponse) => {
    common.detectBrowser().then(b => {
        if (b !== common.FIREFOX_ANDROID) {
            chrome.tabs.captureVisibleTab(imageURI => {
                sendResponse({ image: imageURI });
            });
        }
    });

    const marks = req.marks;
    if (marks != null && marks.constructor === Array && marks.length > 0) {
        const n = common.marksInUse(marks) + '';
        setBrowserActionBadgeOrTitle(n, sender.tab.id);
    }

    return true;
};

/**
 * Update browser action's number of marked positions in badge text,
 * when active tab changes.
 * @function updateMarkBadge
 * @async
 * @param info {Object}
 */
const updateMarkBadge = async (info) => {
    const res = await chrome.tabs.sendMessage(info.tabId, { getMarks: true, });
    if (res) {
        marks = res.marks;
        if (marks != null && marks.constructor === Array && marks.length > 0) {
            const n = common.marksInUse(marks) + '';
            setBrowserActionBadgeOrTitle(n, info.tabId);
        }
        else
            setBrowserActionBadgeOrTitle('', info.tabId);
    }
};

setDefaultOptions();
chrome.runtime.onMessage.addListener(takeScreenshotAndUpdateBadgeOrTitle);
chrome.tabs.onActivated.addListener(updateMarkBadge);
// TODO Not needed? Firefox for Android needs?
common.detectBrowser().then((b) => {
    if (b === common.FIREFOX_ANDROID) {
        chrome.tabs.onUpdated.addListener((tabId) => {
            setBrowserActionBadgeOrTitle('', tabId);
        });
    }
});
