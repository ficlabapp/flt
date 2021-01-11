"use strict";

import { Map } from "./map.js";

/**
 * A single point on a map
 *
 * @since 1.2.0
 */
export class MapPoint {
    /**
     * Create instance
     *
     * @since 1.2.0
     *
     * @param Map    map    The map to work on
     * @param int    offset The offset into the map text
     * @param int    length The length of the text relating to this point
     * @param string type   Point type
     */
    constructor(map, offset, length, type) {
        Object.defineProperties(this, {
            map: { enumerable: false, value: map },
            offset: { enumerable: true, value: offset },
            length: { enumerable: true, value: length },
            type: { enumerable: true, value: type },
            text: { enumerable: true, get: () => map.text.substr(this.offset, this.length) },
        });
    }
}
