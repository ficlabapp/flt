"use strict";

import { Map } from "./map.js";
import { TextLine, TypeLine } from "./line.js";
import { Constants } from "./constants.js";

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
     * @param int    line   The defining line for this point
     * @param string type   Point type
     */
    constructor(map, line, type) {
        Object.defineProperties(this, {
            map: { enumerable: false, value: map },
            line: { enumerable: true, value: line },
            type: { enumerable: true, value: type },
            text: {
                enumerable: true,
                get: () =>
                    this.getTextLines()
                        .map((l) => l.text)
                        .join(""),
            },
            length: {
                enumerable: true,
                get: () =>
                    this.getTextLines()
                        .map((l) => l.length)
                        .reduce((a, i) => a + i, 0),
            },
        });
    }

    /**
     * Search / replace text
     *
     * @since 1.0.0
     *
     * @param RegEx  search
     * @param string replace
     * @return MapPoint Returns this instance, for chaining
     */
    replace(search, replace) {
        let matches = null,
            skew = 0;
        if (search.global) matches = [...this.text.matchAll(search)];
        else matches = [this.text.match(search)];

        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            if (!match) continue;

            let matchLength = match[0].length,
                matchLine = this.at(match.index + skew),
                matchReplace = replace,
                matchOffsetWithinLine = match.index + skew - matchLine.offset;

            // build replacement string when capturing groups are used
            if (match.length > 1) {
                for (let i = 1; i < match.length; i++) {
                    let r = new RegExp(`\\$${i}`, "gu");
                    matchReplace = matchReplace.replace(r, match[i] || "");
                }
            }

            // set skew & remainder so we can use the original match indexes for future matches
            skew += matchReplace.length - matchLength;
            let remainder = matchLine.line.length - matchLength - matchOffsetWithinLine;

            // fast path when only one TextLine is involved
            if (remainder >= 0) {
                matchLine.line.text =
                    matchLine.line.text.slice(0, matchOffsetWithinLine) +
                    matchReplace +
                    matchLine.line.text.slice(matchOffsetWithinLine + matchLength);

                continue;
            }

            // multi-line replace (replacement goes in first line)
            // NOTE THAT CAPTURING GROUPS ARE NOT KEPT WITHIN THEIR LINES, so if
            // using captured text as part of the replacement, bear in mind that it
            // will end up transposed into the first line. Things like quote replacement
            // etc. must be done some other way if needing to preserve line boundaries.
            matchLine.line.text =
                matchLine.line.text.slice(0, matchOffsetWithinLine) + matchReplace;
            for (
                let next = this.at(matchLine.offset + matchLine.line.length);
                remainder < 0 && next;
                next = this.at(next.offset + next.line.length)
            ) {
                if (next.line.length <= -remainder) {
                    remainder += next.line.text.length;
                    next.line.text = "";
                } else {
                    next.line.text = next.line.text.slice(-remainder);
                    break;
                }
            }
        }

        return this;
    }

    /**
     * Get the text line at the specified offset
     *
     * @since 1.0.0
     *
     * @param int offset Offset into text
     * @return { offset: int, line: TextLine }
     */
    at(offset = 0) {
        let pos = 0;
        for (let line of this.getTextLines()) {
            if (offset < pos + line.length) return { offset: pos, line };
            pos += line.length;
        }
        return null;
    }

    /**
     * Get or set the character at the specified offset
     *
     * @since 1.3.0
     *
     * @param int  offset      Offset into text
     * @param char replacement Character to replace with
     * @return char The character at the given offset
     */
    charAt(offset, replacement = null) {
        let pos = this.at(offset);
        if (!pos) return null;
        let {offset: lineOffset, line} = pos,
            intraLineOffset = offset - lineOffset;
        if (typeof replacement === 'string') {
            if (replacement.length !== 1) throw new Error('Replacement must be a single character');
            line.text = `${line.text.slice(0, intraLineOffset)}${replacement}${line.text.slice(intraLineOffset + 1)}`;
        }
        return line.text.charAt(intraLineOffset);
    }

    /**
     * Get the text lines associated with this point
     *
     * @since 1.0.0
     *
     * @return Line[]
     */
    getTextLines() {
        switch (this.type) {
            case "line":
                return [this.line];
            case "paragraph": {
                let lines = this.map.document.lines,
                    text = [];
                for (let i = lines.indexOf(this.line); i < lines.length; i++) {
                    let line = lines[i];
                    if (line instanceof TextLine) text.push(line);
                    else if (line === this.line) continue;
                    if (line instanceof TypeLine) {
                        if (
                            [
                                Constants.T_PARAGRAPH,
                                Constants.T_SECTION,
                                Constants.T_DESTINATION,
                            ].includes(line.lineType)
                        )
                            break;
                    }
                }
                return text;
            }
            case "note":
            case "cell":
            case "heading": {
                let lines = this.map.document.lines,
                    text = [];
                for (let i = lines.indexOf(this.line); i < lines.length; i++) {
                    let line = lines[i];
                    if (line instanceof TextLine) text.push(line);
                    else if (line === this.line) continue;
                    if (
                        line instanceof TypeLine &&
                        [Constants.T_DESTINATION, Constants.T_SECTION].includes(line.lineType)
                    )
                        break;
                }
                return text;
            }
            case "section": {
                let lines = this.map.document.lines,
                    text = [];
                for (let i = lines.indexOf(this.line); i < lines.length; i++) {
                    let line = lines[i];
                    if (line instanceof TextLine) text.push(line);
                    else if (line === this.line) continue;
                    if (line instanceof TypeLine && line.lineType === Constants.T_SECTION) break;
                }
                return text;
            }
        }
    }
}
