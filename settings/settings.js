'use strict';

const
    save = document.querySelector('#save'),
    cancel = document.querySelector('#cancel'),
    mark = document.querySelector('#mark_key'),
    scroll = document.querySelector('#scroll_key'),
    tabSize = document.querySelector('#captured_tab_size'),
    info = document.querySelector('#info-message'),
    MODIFIERS = new Set([ 'Alt', 'Ctrl', 'Shift' ]);

let keys = {};

/**
 * Restore key from the setttings.
 * @param {String} id - The id attribute of the key.
 */
const restoreKey = (id) => {
    chrome.storage.local.get(null, res => {
        if (id.includes('mark')) {
            mark.value = res.mark_key.string;
            keys[mark.id] = res.mark_key.keys;
        }
        else if (id.includes('scroll')) {
            scroll.value = res.scroll_key.string;
            keys[scroll.id] = res.scroll_key.keys;
        }
    });
};

/** Restore options for viewing.
 */
const restoreOptions = () => {
    restoreKey('mark');
    restoreKey('scroll');
    chrome.storage.local.get(null, res => {
        tabSize.value = res.captured_tab_size;
    });
};

/** Save options.
 * @param {EventTarget} e
 */
const saveOptions = (e) => {
    e.preventDefault();

    chrome.storage.local.set({
        mark_key: {
            string: mark.value,
            keys: keys[mark.id],
        },
        scroll_key: {
            string: scroll.value,
            keys: keys[scroll.id],
        },
        captured_tab_size: tabSize.value,
    });

    info.setAttribute('style', 'visibility: visible;');
    window.setTimeout(() => {
        info.setAttribute('style', 'visibility: hidden;');
    }, 2000);
};

/** Don't save options, restore old ones.
 * @param {EventTarget} e
 */
const cancelOptions = (e) => {
    e.preventDefault();
    restoreOptions();
    save.disabled = false;
};

/**
 * Clear the key field.
 * @param {Object} e - Event.
 */
const emptyValue = (e) => {
    e.target.value = '';
    save.disabled = true;
};

/**
 * Validate keys. Control and some regular key must be used.
 * @param {Object} keys - Current key combo, alt, ctrl, shift and key.
 * @return {Boolean} True if keys are valid, false otherwise.
 */
const areKeysValid = (keys) => {
    return keys.ctrl && keys.key.length === 1;
};

/**
 * Read the pressed key combo, assign it to a variable and construct the key
 * string from it.
 * @param {Object} e - Event.
 */
const getKeyShortcut = (e) => {
    e.preventDefault();
    if (e.repeat)
        return;

    const id = e.target.id;
    keys[id] = {
        alt: e.altKey,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        key: e.key,
    };
    e.target.value = [
        e.ctrlKey && 'Control',
        e.altKey && 'Alt',
        e.shiftKey && 'Shift',
        e.key.length === 1 && e.key,
    ].filter(k => k).join(' + ');

    save.disabled = !areKeysValid(keys[id]) || mark.value === scroll.value;
};

/**
 * Validate the key combo when focus leaves the key field.
 * @param {Object} e - Event.
 */
const validate = (e) => {
    const id = e.target.id;
    if (!areKeysValid(keys[id]) || mark.value === scroll.value ||
            !e.target.value) {
        restoreKey(id);
        save.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', restoreOptions);
save.addEventListener('click', saveOptions);
cancel.addEventListener('click', cancelOptions);
[ mark, scroll ].forEach(e => {
    e.addEventListener('keydown', getKeyShortcut);
    e.addEventListener('focus', emptyValue);
    e.addEventListener('blur', validate);
});
