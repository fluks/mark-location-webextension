'use strict';

const
    save = document.querySelector('#save'),
    cancel = document.querySelector('#cancel'),
    mark = document.querySelector('#mark_key'),
    _scroll = document.querySelector('#scroll_key'),
    tabSize = document.querySelector('#captured_tab_size'),
    info = document.querySelector('#info-message'),
    permanentMarks = document.querySelector('#permanent-marks');

let keys = {};

/** Restore key from the setttings.
 * @function restoreKey
 * @param {String} id - The id attribute of the key.
 */
const restoreKey = (id) => {
    chrome.storage.local.get([ 'mark_key', 'scroll_key' ], res => {
        if (id.includes('mark')) {
            mark.value = res.mark_key.string;
            keys[mark.id] = res.mark_key.keys;
        }
        else if (id.includes('scroll')) {
            _scroll.value = res.scroll_key.string;
            keys[_scroll.id] = res.scroll_key.keys;
        }
    });
};

/** Restore options for viewing.
 * @function restoreOptions
 */
const restoreOptions = () => {
    chrome.storage.local.get([ 'mark_key', 'scroll_key', 'captured_tab_size', 'permanent_marks' ], res => {
        mark.value = res.mark_key.string;
        keys[mark.id] = res.mark_key.keys;
        _scroll.value = res.scroll_key.string;
        keys[_scroll.id] = res.scroll_key.keys;
        tabSize.value = res.captured_tab_size;
        permanentMarks.checked = res.permanent_marks;
    });
};

/** Save options.
 * @function saveOptions
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
            string: _scroll.value,
            keys: keys[_scroll.id],
        },
        captured_tab_size: tabSize.value,
        permanent_marks: permanentMarks.checked,
    });

    info.setAttribute('style', 'visibility: visible;');
    window.setTimeout(() => {
        info.setAttribute('style', 'visibility: hidden;');
    }, 2000);
};

/** Don't save options, restore old ones.
 * @function cancelOptions
 * @param {EventTarget} e
 */
const cancelOptions = (e) => {
    e.preventDefault();
    restoreOptions();
    save.disabled = false;
};

/** Clear the key field.
 * @function emptyValue
 * @param {Object} e - Event.
 */
const emptyValue = (e) => {
    e.target.value = '';
    save.disabled = true;
};

/** Validate keys.
 * @function areKeysValid
 * @param {Object} keys - Current key combo, alt, ctrl, shift and key.
 * @return {Boolean} True if keys are valid, false otherwise.
 */
const areKeysValid = (keys) => {
    return (keys.ctrl || keys.alt || keys.shift) && keys.key.length === 1;
};

/** Read the pressed key combo, assign it to a variable and construct the key
 * string from it.
 * @function getKeyShortcut
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

    save.disabled = !areKeysValid(keys[id]) || mark.value === _scroll.value;
};

/** Validate the key combo when focus leaves the key field.
 * @function validate
 * @param {Object} e - Event.
 */
const validate = (e) => {
    const id = e.target.id;
    if (!areKeysValid(keys[id]) || mark.value === _scroll.value ||
            !e.target.value) {
        restoreKey(id);
        save.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', restoreOptions);
save.addEventListener('click', saveOptions);
cancel.addEventListener('click', cancelOptions);
[ mark, _scroll ].forEach(e => {
    e.addEventListener('keydown', getKeyShortcut);
    e.addEventListener('focus', emptyValue);
    e.addEventListener('blur', validate);
});
