"use strict";

/**
 * Ancestor plugin class - never directly instantiated
 *
 * @since 1.1.0
 */
export class Plugin {
    /**
     * Return a list of methods to attach
     *
     * @since 1.1.0
     *
     * @return array
     */
    static _register() {
        return [];
    }
}
