/** @module background */
'use strict';

/** Set default options on install.
 * @function setDefaultOptions
 */
const setDefaultOptions = () => {
    chrome.storage.local.get(null, res => {
        const options = {};
        // Set one default option at a time if it doesn't exist already. This
        // way it's easy to add new options.
        if (!res || !('mark_key' in res)) {
            options.mark_key = {
                string: 'Control + ,',
                keys: {
                    ctrl: true,
                    key: ',',
                },
            };
        }
        if (!res || !('scroll_key' in res)) {
            options.scroll_key = {
                string: 'Control + .',
                keys: {
                    ctrl: true,
                    key: '.',
                },
            };
        }
        if (!res || !('captured_tab_size' in res))
            options.captured_tab_size = '100%';
        if (!res || !('permanent_marks' in res))
            options.permanent_marks = true;
        if (!res || !('urls' in res))
            options.urls = {};

        chrome.storage.local.set(options);
    });
};

/**
 * Set how many positions are marked in a tab, to the browser action's badge
 * text.
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

/** Either take a screenshot, set browser badge or title and send screenshot to
 * the tab, or clear marks for the tab.
 * @function takeScreenshotAndUpdateBadgeOrClearMarks
 * @param {Object} req
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 * @return Return always true to send the response asynchronously, otherwise
 * the sender never gets the response.
 */
const takeScreenshotAndUpdateBadgeOrClearMarks = (req, sender, sendResponse) => {
    if (req.marks) {
        const marks = req.marks;
        if (marks != null && marks.constructor === Array) {
            const n = String(common.marksInUse(marks));
            setBrowserActionBadgeOrTitle(n, sender.tab.id);

            chrome.storage.local.get(null, (res) => {
                // TODO Do this only when permanent_marks is true?
                res.urls[req.url] = marks;
                chrome.storage.local.set(res);

                common.detectBrowser().then(b => {
                    if (b !== common.FIREFOX_ANDROID) {
                        chrome.tabs.captureVisibleTab({ format: 'jpeg', quality: 1, }, imageURI => {
                            sendResponse({ image: imageURI });
                            if (res.permanent_marks)
                                idb.set(req.url, imageURI);
                        });
                    }
                });
            });
        }
    }
    else if (req.clear_marks) {
        chrome.storage.local.get(null, (res) => {
            // TODO Do all these only if permanent_marks is true?
            delete(res.urls[req.url]);
            chrome.storage.local.set(res);
            if (res.permanent_marks)
                idb.del(req.url);
        });
        setBrowserActionBadgeOrTitle('', sender.tab.id);
    }

    return true;
};

/**
 * Update browser action's number of marked positions in badge text, when
 * active tab changes.
 * @function updateMarkBadge
 * @async
 * @param info {Object}
 */
const updateMarkBadge = async (info) => {
    const res = await chrome.tabs.sendMessage(info.tabId, { getMarks: true, });
    if (res) {
        const marks = res.marks;
        if (marks != null && marks.constructor === Array && marks.length > 0) {
            const n = String(common.marksInUse(marks));
            setBrowserActionBadgeOrTitle(n, info.tabId);
        }
        else
            setBrowserActionBadgeOrTitle('', info.tabId);
    }
};

/**
 * When loading a page permanent marks on, send marks and set browser action
 * badge.
 * @function setMarks
 * @param tabId {Integer} The ID of the updated tab.
 * @param changeInfo {Object} Properties of the tab that changed.
 * @param tab {tabs.Tab} The new state of the tab.
 */
const setMarks = (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.storage.local.get(null, (res) => {
            if (res.permanent_marks && tab.url in res.urls) {
                chrome.tabs.sendMessage(tabId, { marks: res.urls[tab.url], });
                const n = String(common.marksInUse(res.urls[changeInfo.url]));
                setBrowserActionBadgeOrTitle(n, tabId);
            }
        });
    }
};

setDefaultOptions();
chrome.runtime.onMessage.addListener(takeScreenshotAndUpdateBadgeOrClearMarks);
chrome.tabs.onActivated.addListener(updateMarkBadge);
chrome.tabs.onUpdated.addListener(setMarks);
// TODO Not needed? Firefox for Android needs?
common.detectBrowser().then((b) => {
    if (b === common.FIREFOX_ANDROID) {
        chrome.tabs.onUpdated.addListener((tabId) => {
            setBrowserActionBadgeOrTitle('', tabId);
        });
    }
});
