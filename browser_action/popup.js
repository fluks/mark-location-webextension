'use strict';

const CHROME = 0,
    FIREFOX = 1,
    TOOLTIP_TEXT = 'Click to show captured tab';

/** Create a node for a scroll-to button.
 * @param {Int} i - i'th mark.
 * @return {Element}
 */
const createScrollNode = i => {
    const scroll = document.createElement('span');
    scroll.setAttribute('id', 'scroll-' + i);
    scroll.textContent = 'Scroll';
    scroll.className = 'clickable';

    return scroll;
};

/**
 * Detect which browser this addon is installed to.
 * @return FIREFOX if the addon is installed to Firefox, CHROME otherwise.
 */
const detectBrowser = () => {
    try {
        browser.runtime.getBrowserInfo();
        return FIREFOX;
    }
    catch (error) {
        return CHROME;
    }
};

/**
 * Hide captured tab image and update tooltip texts.
 * @param {Object} e - Click event.
 * @param {Element} image - Image HTML element.
 * @param {Element} tooltip - Image's parent HTML element.
 */
const hideImage = (e, image, tooltip) => {
    image.src = '';
    image.classList.add('tooltip-image');
    image.classList.remove('visible');
    tooltip.title = TOOLTIP_TEXT;
    e.stopPropagation();
    // If the image is so large that the popup can be scrolled
    // and the popup is scrolled, say, down. When the image is
    // closed, the topmost table cells might not be visible.
    // Scrolling to the top of the popup fixes this.
    window.scrollTo(0, 0);
};

/**
 * Show captured tab image and update tooltip texts.
 * @param {Object} e - Click event.
 * @param {Element} image - Image HTML element.
 * @param {Object el - Mark object.
 * @param {Element} tooltip - Image's parent HTML element.
 */
const showImage = (e, image, el, tooltip) => {
    tooltip.title = '';
    image.src = el.image;
    chrome.storage.local.get(null, res => {
        if (detectBrowser() === CHROME)
            image.style.height = res.captured_tab_size;
        else
            image.style.maxWidth = res.captured_tab_size;
    });
    image.classList.remove('tooltip-image');
    image.classList.add('visible');
};

/** Show scroll texts.
 * @param {Object} response
 */
const handleMarks = response => {
    response.marks
        .forEach((el, i) => {
            if (el) {
                const scroll = createScrollNode(i);
                const row = document.querySelector('#mark-' + i).parentNode;
                row.appendChild(scroll);

                const image = document.querySelector('#image-' + i);
                image.addEventListener('click', e => {
                     hideImage(e, image, tooltip);
                 });
                image.title = 'Click to hide';

                const tooltip = row.children[0];
                tooltip.classList.add('clickable');
                tooltip.addEventListener('click', e => {
                    showImage(e, image, el, tooltip);
                });
                tooltip.title = TOOLTIP_TEXT;
            }
        });
};

/** Get marks and show a possibility to scroll to them.
 * @param {EventTarget} e
 */
const updateUI = e => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { getMarks: true }, handleMarks);
    });
};

/** Handle clicks on a popup to mark a location or scroll to a location.
 * @param {EventTarget} e
 */
const clickHandler = e => {
    if (e.target.id) {
        const id = e.target.id;
        const index = id.charAt(id.length - 1);

        if (id.includes('mark')) {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, { mark: index });
                // Have to be inside the function.
                window.close();
            });
        }
        else if (id.includes('scroll')) {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, { scroll: index });
                window.close();
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', updateUI);
document.addEventListener('click', clickHandler);
