"use strict";

import { Constants } from "./constants.js";
import { TextLine, TypeLine } from "./line.js";
import { MapPoint } from "./map-point.js";

/**
 * Feature map for FLT documents
 *
 * @since 1.2.0
 */
export class Map {
    /**
     * New instance
     *
     * @since 1.2.0
     *
     * @param Document document Document to create a map for
     */
    constructor(document) {
        Object.defineProperties(this, {
            document: { enumerable: true, value: document },
            paragraphs: {
                enumerable: true,
                get: () => {
                    return document.lines
                        .filter(
                            (l) => l instanceof TypeLine && l.lineType === Constants.T_PARAGRAPH
                        )
                        .map((l) => new MapPoint(this, l, "paragraph"));
                },
            },
        });
    }

    /**
     * Get map info for a specific offset
     *
     * @since 1.2.0
     *
     * @param int offset
     * @return object
     */
    at(offset = 0) {
        let pos = 0,
            lineOffset = null,
            destination = null,
            out = {
                line: null,
                section: null,
                paragraph: null,
                note: null,
                cell: null,
                heading: null,
            };

        // find the text line at this offset
        for (let i = 0; i < this.document.lines.length; i++) {
            let line = this.document.lines[i];
            if (line instanceof TextLine) {
                if (pos <= offset && pos + line.length > offset) {
                    lineOffset = i;
                    out.line = new MapPoint(this, line, "line");
                    break;
                }
                pos += line.length;
            }
        }

        // find the parent containers of this line
        reverse: for (let i = lineOffset; i >= 0; i--) {
            let line = this.document.lines[i];
            if (!(line instanceof TypeLine)) continue;
            switch (line.lineType) {
                case Constants.T_SECTION:
                    out.section = new MapPoint(this, line, "section");
                    break reverse;
                case Constants.T_PARAGRAPH:
                    if (!out.paragraph && (destination == null || destination === Constants.D_BODY))
                        out.paragraph = new MapPoint(this, line, "paragraph");
                    break;
                case Constants.T_DESTINATION: {
                    if (destination === null) {
                        destination = line.destination;
                        switch (destination) {
                            case Constants.D_NOTE:
                                out.note = new MapPoint(this, line, "note");
                                break;
                            case Constants.D_CELL:
                                out.cell = new MapPoint(this, line, "cell");
                                break;
                            case Constants.D_HEAD:
                                out.heading = new MapPoint(this, line, "heading");
                                break;
                        }
                    }
                    break;
                }
            }
        }

        return out;
    }
}
