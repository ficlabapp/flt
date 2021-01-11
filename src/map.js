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
        let text = "",
            lines = [{ offset: 0, length: 0 }],
            sections = [{ offset: 0, length: 0 }],
            paragraphs = [{ offset: 0, length: 0 }],
            notes = [{ offset: 0, length: 0 }],
            cells = [{ offset: 0, length: 0 }],
            headings = [{ offset: 0, length: 0 }],
            dest = Constants.D_BODY,
            inParagraph = true,
            inNote = false,
            inHeading = false,
            inCell = false;

        for (let line of document.lines) {
            if (line instanceof TextLine) {
                // add text & line, and update container lengths
                text += line.text;
                lines.push({ offset: text.length, length: line.text.length, text: line });
                sections.slice(-1)[0].length += line.text.length;
                if (inParagraph) paragraphs.slice(-1)[0].length += line.text.length;
                if (inNote) notes.slice(-1)[0].length += line.text.length;
                if (inCell) cells.slice(-1)[0].length += line.text.length;
                if (inHeading) headings.slice(-1)[0].length += line.text.length;
            } else if (line instanceof TypeLine) {
                // update container targets
                switch (line.lineType) {
                    case Constants.T_SECTION:
                        sections.push({ offset: text.length, length: 0 });
                    // deliberate fallthrough to paragraph
                    case Constants.T_PARAGRAPH:
                        paragraphs.push({ offset: text.length, length: 0 });
                        inParagraph = true;
                        break;
                    case Constants.T_DESTINATION:
                        inParagraph = inNote = inHeading = inCell = false;
                        switch (line.destination) {
                            case Constants.D_BODY:
                                paragraphs.push({ offset: text.length, length: 0 });
                                inParagraph = true;
                                break;
                            case Constants.D_NOTE:
                                notes.push({ offset: text.length, length: 0 });
                                inNote = true;
                                break;
                            case Constants.D_CELL:
                                cells.push({ offset: text.length, length: 0 });
                                inCell = true;
                                break;
                            case Constants.D_HEAD:
                                headings.push({ offset: text.length, length: 0 });
                                inHeading = true;
                                break;
                        }
                        break;
                }
            }
        }

        // attach result to instance
        Object.defineProperties(this, {
            text: { enumerable: true, value: text },
            lines: { enumerable: true, value: lines.filter((v) => v.length) },
            sections: { enumerable: true, value: sections.filter((v) => v.length) },
            paragraphs: { enumerable: true, value: paragraphs.filter((v) => v.length) },
            notes: { enumerable: true, value: notes.filter((v) => v.length) },
            cells: { enumerable: true, value: cells.filter((v) => v.length) },
            headings: { enumerable: true, value: headings.filter((v) => v.length) },
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
        let text = null;
        function find(offset, arr) {
            if (!arr || !arr.length) return [0, 0];
            let l = 0,
                r = arr.length - 1;
            while (l <= r) {
                let i = Math.ceil((l + r) / 2);
                if (arr[i].offset > offset) r = Math.max(0, i - 1);
                else if (arr[i].offset <= offset) l = i;
                if (l === r) {
                    if (offset < arr[l].offset) return [0, 0];
                    if (offset >= arr[l].offset + arr[l].length) return [0, 0];
                    text = arr[l].text;
                    return [arr[l].offset, arr[l].length];
                }
            }
        }

        let out = { offset };
        for (let type of ["section", "paragraph", "note", "cell", "heading"]) {
            let result = find(offset, this[`${type}s`]);
            out[type] = result[1] ? new MapPoint(this, ...result, type) : null;
        }
        out.line = new MapPoint(this, ...find(offset, this.lines), "line");
        out.text = text;

        return out;
    }
}
