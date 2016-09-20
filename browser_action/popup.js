'use strict';

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
                    image.src = '';
                    image.classList.add('tooltip-image');
                    image.classList.remove('visible');
                    e.stopPropagation();
                });
                image.title = 'Click to hide';

                const tooltip = row.children[0];
                tooltip.classList.add('clickable');
                tooltip.addEventListener('click', e => {
                    image.src = el.image;
                    image.classList.remove('tooltip-image');
                    image.classList.add('visible');
                });
                tooltip.title = 'Click to show captured tab';
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
