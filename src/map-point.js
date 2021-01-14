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
     * Get the text line at the specified offset
     *
     * @since 1.0.0
     *
     * @param int offset Offset into text
     * @return TextLine
     */
    at(offset = 0) {
        let pos = 0;
        for (let line of this.getTextLines()) {
            if (offset <= pos + line.length) return line;
            pos += line.length;
        }
        return null;
    }

    /**
     * Get the text lines associated with this poine
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
