/** @module popup */
'use strict';

// Can't use only _, because l10n library declares that already.
const _M = chrome.i18n.getMessage;

/** Create a node for a scroll-to button.
 * @function createScrollNode
 * @param {Int} i - i'th mark.
 * @return {Element}
 */
const createScrollNode = i => {
    const scroll = document.createElement('span');
    scroll.setAttribute('id', 'scroll-' + i);
    scroll.textContent = _M('scrollCellText');
    scroll.className = 'clickable';

    return scroll;
};

/**
 * Hide captured tab image and update tooltip texts.
 * @function hideImage
 * @param {Object} e - Click event.
 * @param {Element} image - Image HTML element.
 * @param {Element} tooltip - Image's parent HTML element.
 */
const hideImage = (e, image, tooltip) => {
    image.src = '';
    image.classList.add('tooltip-image');
    image.classList.remove('visible');
    tooltip.title = _M('tooltipTitle');
    e.stopPropagation();
    // If the image is so large that the popup can be scrolled
    // and the popup is scrolled, say, down. When the image is
    // closed, the topmost table cells might not be visible.
    // Scrolling to the top of the popup fixes this.
    window.scrollTo(0, 0);
};

/**
 * Show captured tab image and update tooltip texts.
 * @function showImage
 * @param {Object} e - Click event.
 * @param {Element} image - Image HTML element.
 * @param {Object el - Mark object.
 * @param {Element} tooltip - Image's parent HTML element.
 */
const showImage = (e, image, el, tooltip) => {
    tooltip.title = '';
    image.src = el.image;
    chrome.storage.local.get(null, async (res) => {
        if (await common.detectBrowser() === common.CHROME)
            image.style.height = res.captured_tab_size;
        else
            image.style.maxWidth = res.captured_tab_size;
    });
    image.classList.remove('tooltip-image');
    image.classList.add('visible');
};

/** Show scroll texts.
 * @function handleMarks
 * @param {Object} response
 */
const handleMarks = async (response) => {
    const isFirefoxAndroid = await common.detectBrowser() === common.FIREFOX_ANDROID;
    response.marks
        .forEach((el, i) => {
            if (el) {
                const scroll = createScrollNode(i);
                const row = document.querySelector('#mark-' + i).parentNode;
                row.appendChild(scroll);

                if (!isFirefoxAndroid) {
                    const image = document.querySelector('#image-' + i);
                    image.addEventListener('click', e => {
                         hideImage(e, image, tooltip);
                     });
                    image.title = _M('imageTitle');

                    const tooltip = row.children[0];
                    tooltip.classList.add('clickable');
                    tooltip.addEventListener('click', e => {
                        showImage(e, image, el, tooltip);
                    });
                    tooltip.title = _M('tooltipTitle');
                }
            }
        });
};

/** Get marks and show a possibility to scroll to them.
 * @function updateUI
 * @param {EventTarget} e
 */
const updateUI = e => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { getMarks: true }, handleMarks);
    });
};

/**
 * Close the browser action popup.
 * @function close
 * @async
 */
const close = async () => {
    if (await common.detectBrowser() === common.FIREFOX_ANDROID) {
        chrome.tabs.getCurrent((tab) => {
            chrome.tabs.remove(tab.id);
        });
    }
    else
        window.close();
};

/** Handle clicks on a popup to mark a location or scroll to a location.
 * @function clickHandler
 * @param {EventTarget} e
 */
const clickHandler = e => {
    if (e.target.id) {
        const id = e.target.id;
        const index = id.charAt(id.length - 1);

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const options = {};
            if (id.includes('mark'))
                options.mark = index;
            else if (id.includes('scroll'))
                options.scroll = index;
            chrome.tabs.sendMessage(tabs[0].id, options);
            close();
        });
    }
};

document.addEventListener('DOMContentLoaded', updateUI);
document.addEventListener('click', clickHandler);
