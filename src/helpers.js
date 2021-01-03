"use strict";

import * as Errors from "./error.js";

/** Various useful helper functions */
export class Helpers {
    /**
     * Find the offset of the first zero bit
     *
     * @since 1.0.0
     *
     * @param int value
     * @return int
     */
    static ffz(value) {
        value = BigInt(value);
        let offset = 0;
        while (value & 1n) {
            offset++;
            value >>= 1n;
        }

        return offset;
    }

    /**
     * Peel off & parse a numeric prefix from a string
     *
     * @since 1.0.0
     *
     * @param string s     String to parse
     * @param int    radix Base to parse as
     * @return object {prefix, data}
     */
    static splitNumPrefix(s, radix = 16) {
        let matches = s.match(/^(.+?)(?: (.*))?$/u);
        if (!matches) throw new Errors.InternalSyntaxError("Invalid numeric prefix");
        matches[1] = BigInt(matches[1], radix);

        return matches.slice(1, 3);
    }
}
