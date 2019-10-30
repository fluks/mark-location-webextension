/** @module common */
'use strict';

const common = {
    /** @property {Int} CHROME */
    CHROME: 0,
    /** @property {Int} FIREFOX */
    FIREFOX: 1,
    /** @property {Int} FIREFOX_ANDROID */
    FIREFOX_ANDROID: 2,

    /**
     * Detect the browser.
     * @function detectBrowser
     * @async
     * @return {Promise<Int>} FIREFOX if the browser is Firefox, FIREFOX_ANDROID if
     * it's Firefox for Android and CHROME for Chromium based.
     */
    async detectBrowser() {
        try {
            const info = await browser.runtime.getBrowserInfo();
            if (/fennec/i.test(info.name))
                return this.FIREFOX_ANDROID;
            return this.FIREFOX;
        }
        catch (error) {
            return this.CHROME;
        }
    },
};
