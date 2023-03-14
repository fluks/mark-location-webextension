const idb = {    
    defaultGetStoreFunc: null,
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            // @ts-ignore - file size hacks
            request.oncomplete = request.onsuccess = () => resolve(request.result);
            // @ts-ignore - file size hacks
            request.onabort = request.onerror = () => reject(request.error);
        });
    },
    createStore(dbName, storeName) {
        const request = indexedDB.open(dbName);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        const dbp = this.promisifyRequest(request);
        return (txMode, callback) => dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
    },
    defaultGetStore() {
        if (!this.defaultGetStoreFunc) {
            this.defaultGetStoreFunc = this.createStore('keyval-store', 'keyval');
        }
        return this.defaultGetStoreFunc;
    },
    /**
     * Get a value by its key.
     *
     * @param key
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    get(key, customStore = this.defaultGetStore()) {
        return customStore('readonly', (store) => this.promisifyRequest(store.get(key)));
    },
    /**
     * Set a value with a key.
     *
     * @param key
     * @param value
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    set(key, value, customStore = this.defaultGetStore()) {
        return customStore('readwrite', (store) => {
            store.put(value, key);
            return this.promisifyRequest(store.transaction);
        });
    },
    /**
     * Set multiple values at once. This is faster than calling set() multiple times.
     * It's also atomic – if one of the pairs can't be added, none will be added.
     *
     * @param entries Array of entries, where each entry is an array of `[key, value]`.
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    setMany(entries, customStore = this.defaultGetStore()) {
        return customStore('readwrite', (store) => {
            entries.forEach((entry) => store.put(entry[1], entry[0]));
            return this.promisifyRequest(store.transaction);
        });
    },
    /**
     * Get multiple values by their keys
     *
     * @param keys
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    getMany(keys, customStore = this.defaultGetStore()) {
        return customStore('readonly', (store) => Promise.all(keys.map((key) => this.promisifyRequest(store.get(key)))));
    },
    /**
     * Update a value. This lets you see the old value and update it as an atomic operation.
     *
     * @param key
     * @param updater A callback that takes the old value and returns a new value.
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    update(key, updater, customStore = this.defaultGetStore()) {
        return customStore('readwrite', (store) => 
        // Need to create the promise manually.
        // If I try to chain promises, the transaction closes in browsers
        // that use a promise polyfill (IE10/11).
        new Promise((resolve, reject) => {
            store.get(key).onsuccess = function () {
                try {
                    store.put(updater(this.result), key);
                    resolve(this.promisifyRequest(store.transaction));
                }
                catch (err) {
                    reject(err);
                }
            };
        }));
    },
    /**
     * Delete a particular key from the store.
     *
     * @param key
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    del(key, customStore = this.defaultGetStore()) {
        return customStore('readwrite', (store) => {
            store.delete(key);
            return this.promisifyRequest(store.transaction);
        });
    },
    /**
     * Delete multiple keys at once.
     *
     * @param keys List of keys to delete.
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    delMany(keys, customStore = this.defaultGetStore()) {
        return customStore('readwrite', (store) => {
            keys.forEach((key) => store.delete(key));
            return this.promisifyRequest(store.transaction);
        });
    },
    /**
     * Clear all values in the store.
     *
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    clear(customStore = this.defaultGetStore()) {
        return customStore('readwrite', (store) => {
            store.clear();
            return this.promisifyRequest(store.transaction);
        });
    },
    eachCursor(store, callback) {
        store.openCursor().onsuccess = function () {
            if (!this.result)
                return;
            callback(this.result);
            this.result.continue();
        };
        return this.promisifyRequest(store.transaction);
    },
    /**
     * Get all keys in the store.
     *
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    keys(customStore = this.defaultGetStore()) {
        return customStore('readonly', (store) => {
            // Fast path for modern browsers
            if (store.getAllKeys) {
                return this.promisifyRequest(store.getAllKeys());
            }
            const items = [];
            return eachCursor(store, (cursor) => items.push(cursor.key)).then(() => items);
        });
    },
    /**
     * Get all values in the store.
     *
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    values(customStore = this.defaultGetStore()) {
        return customStore('readonly', (store) => {
            // Fast path for modern browsers
            if (store.getAll) {
                return this.promisifyRequest(store.getAll());
            }
            const items = [];
            return eachCursor(store, (cursor) => items.push(cursor.value)).then(() => items);
        });
    },
    /**
     * Get all entries in the store. Each entry is an array of `[key, value]`.
     *
     * @param customStore Method to get a custom store. Use with caution (see the docs).
     */
    entries(customStore = this.defaultGetStore()) {
        return customStore('readonly', (store) => {
            // Fast path for modern browsers
            // (although, hopefully we'll get a simpler path some day)
            if (store.getAll && store.getAllKeys) {
                return Promise.all([
                    this.promisifyRequest(store.getAllKeys()),
                    this.promisifyRequest(store.getAll()),
                ]).then(([keys, values]) => keys.map((key, i) => [key, values[i]]));
            }
            const items = [];
            return customStore('readonly', (store) => eachCursor(store, (cursor) => items.push([cursor.key, cursor.value])).then(() => items));
        });
    },
};
