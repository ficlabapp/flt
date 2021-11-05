"use strict";

import { Bitfield } from "@ficlabapp/bitfield";

import { Constants } from "./constants.js";
import { Helpers } from "./helpers.js";
import { Features } from "./features.js";
import * as Error from "./error.js";

/**
 * Ancestor class for lines; never instantiated directly
 *
 * @since 1.0.0
 */
export class Line extends Bitfield {
    /**
     * New instance
     *
     * @since 1.0.0
     *
     * @param int      lineNo        Starting line number in original FLT source
     * @param Bitfield bitfield      Bitfield instance to inherit from
     * @param object   addProperties Additional properties to define
     */
    constructor(lineNo = 0, bitfield = {}, addProperties = {}) {
        super(bitfield);
        Object.defineProperty(this, "lineNo", { enumerable: true, value: lineNo, writable: false });
        for (let i in addProperties)
            this.defineProperty(i, addProperties[i].offset, addProperties[i].size);

        // global flags
        if (!this.hasOwnProperty("type")) this.defineProperty("type", 0, 2);
        if (!this.hasOwnProperty("reset"))
            this.defineProperty("reset", Helpers.ffz(~Constants.L_RESET));
    }

    /**
     * Parse a line of FLT source
     *
     * @since 1.0.0
     *
     * @param int      lineNo   Starting line number in original FLT source
     * @param Bitfield bitfield Bitfield for line flags
     * @param string   content  Line content
     * @return Line Instance of a Line subclass
     */
    static parse(lineNo, bitfield, content = "") {
        // define type before instantiation, because we use it early
        bitfield.defineProperty("type", 0, 2);

        // delegate parsing to appropriate subclass
        switch (bitfield.type) {
            case 1n:
                return new TextLine(lineNo, bitfield, content);
            case 2n:
                return TypeLine.parse(lineNo, bitfield, content);
            case 3n:
                return MetaLine.parse(lineNo, bitfield, content);
            default:
                throw new Error.TypeError(`Unknown line type: ${bitfield.type}`);
        }
    }

    /**
     * Render to string
     *
     * @since 1.0.0
     *
     * @param string chain Chained data from subclass
     * @return string
     */
    toString(chain = "") {
        let output = super.toString().padStart(4, "0");
        if (chain.length) output += ` ${chain}`;

        return output;
    }
}

/**
 * A line of basic formatted text
 *
 * @since 1.0.0
 */
export class TextLine extends Line {
    /**
     * New instance
     *
     * @since 1.0.0
     *
     * @param int      lineNo   Starting line number in original FLT source
     * @param Bitfield bitfield Bitfield instance to inherit from
     * @param string   text     Text content of the line
     */
    constructor(lineNo, bitfield, text) {
        super(lineNo, bitfield);
        this.type = Constants.L_TEXT;
        let flags = {
                italic: Constants.L_ITALIC,
                bold: Constants.L_BOLD,
                underline: Constants.L_UNDERLINE,
                strikeout: Constants.L_STRIKEOUT,
                supertext: Constants.L_SUPERTEXT,
                subtext: Constants.L_SUBTEXT,
                mono: Constants.L_MONO,
            };
        for (let i in flags) this.defineProperty(i, Helpers.ffz(~flags[i]));

        Object.defineProperties(this, {
            text: { enumerable: true, get: () => text, set: (s) => (text = `${s}`) },
            length: { enumerable: true, get: () => this.text.length },
        });

        this.text = text; // coerce type
    }

    /**
     * Render to string
     *
     * @since 1.0.0
     *
     * @return string
     */
    toString() {
        return super.toString(this.text); // we're already a string ;-)
    }
}

/**
 * A typed line that does something special
 *
 * @since 1.0.0
 */
export class TypeLine extends Line {
    /**
     * New instance
     *
     * @since 1.0.0
     *
     * @param int      lineNo   Starting line number in original FLT source
     * @param int      lineType Line type
     * @param Bitfield bitfield Bitfield instance to inherit from
     * @param string   content  Content of the line
     */
    constructor(lineNo, bitfield, lineType, content = undefined) {
        super(lineNo, bitfield);
        this.type = Constants.L_TYPE;
        if (content !== undefined)
            Object.defineProperty(this, "content", { enumerable: true, value: content });
        Object.defineProperty(this, "lineType", { enumerable: true, value: lineType });

        switch (lineType) {
            case Constants.T_SECTION:
                this.defineProperty("break", Helpers.ffz(~Constants.VISUAL_BREAK));
            // fallthrough to share properties w/ paragraphs
            case Constants.T_PARAGRAPH:
                this.defineProperty("align", Helpers.ffz(~Constants.MASK_ALIGN), 2);
                break;
            case Constants.T_DESTINATION:
                this.defineProperty("destination", Helpers.ffz(~Constants.MASK_DESTINATION), 4);
                this.defineProperty("header", Helpers.ffz(~Constants.D_HEADER));
                break;
            default:
            // do nothing;
        }
    }

    /**
     * Parse a typed line from FLT source
     *
     * @since 1.0.0
     *
     * @param int      lineNo   Starting line number in original FLT source
     * @param Bitfield bitfield Bitfield for line flags
     * @param string   content  Line content
     * @return Line Instance of a Line subclass
     */
    static parse(lineNo, bitfield, content) {
        content = Helpers.splitNumPrefix(content);
        switch (content[0]) {
            case Constants.T_NOOP:
            case Constants.T_SECTION:
            case Constants.T_PARAGRAPH:
            case Constants.T_DESTINATION:
                return new TypeLine(lineNo, bitfield, content[0]);
            case Constants.T_HINT:
            case Constants.T_LINK:
            case Constants.T_ANCHOR:
            case Constants.T_IMAGE:
                return new TypeLine(lineNo, bitfield, content[0], content[1] || undefined);
            case Constants.T_TABLE:
                return new TypeLine(lineNo, bitfield, content[0], BigInt(`0x${content[1]}`));
            case Constants.T_BLOB: {
                let matches = content[1].match(/^(.+\/.+?) (.+)$/u);
                if (!matches) throw new Error.SyntaxError(lineNo, "Invalid blob definition");
                return new BlobLine(lineNo, bitfield, matches[1], matches[2]);
                break;
            }
        }
        throw new Error.TypeError(`Unknown typed line: ${content[0].toString(16)}`);
    }

    /**
     * Render to string
     *
     * @since 1.0.0
     *
     * @param string chain Chained data from subclass
     * @return string
     */
    toString(chain = "") {
        let output = this.lineType.toString(16);
        if (chain.length) output += ` ${chain}`;
        else
            switch (typeof this.content) {
                case "number":
                    if (Number.isInteger(this.content)) output += ` ${this.content.toString(16)}`;
                    else output += ` ${this.content}`;
                    break;
                case "bigint":
                    output += ` ${this.content.toString(16)}`;
                    break;
                case "object":
                    throw new Error.NotImplementedError("Unknown typed content object");
                    break;
                case "boolean":
                    output += ` ${this.content.toString()}`;
                    break;
                case "string":
                    output += ` ${this.content}`;
                    break;
            }
        return super.toString(output);
    }
}

/**
 * Blob data
 *
 * @since 1.0.0
 */
export class BlobLine extends TypeLine {
    /**
     * New instance
     *
     * @since 1.0.0
     *
     * @param int      lineNo    Starting line number in original FLT source
     * @param int      lineType  Line type
     * @param Bitfield bitfield  Bitfield instance to inherit from
     * @param string   mediaType Media type of the blob
     * @param string   data      Base64-encoded blob data
     */
    constructor(lineNo, bitfield, mediaType, data) {
        super(lineNo, bitfield, Constants.T_BLOB);
        Object.defineProperties(this, {
            mediaType: { enumerable: true, value: mediaType },
            data: { enumerable: true, value: data },
        });
    }

    /**
     * Render to string
     *
     * @since 1.0.0
     *
     * @return string
     */
    toString() {
        return super.toString(`${this.mediaType} ${this.data}`);
    }
}

export class MetaLine extends Line {
    /**
     * New instance
     *
     * @since 1.0.0
     *
     * @param int      lineNo   Starting line number in original FLT source
     * @param int      metaType Metadata type
     * @param Bitfield bitfield Bitfield instance to inherit from
     * @param string   content  Content of the line
     */
    constructor(lineNo, bitfield, metaType, content = undefined) {
        super(lineNo, bitfield);
        this.type = Constants.L_META;
        if (content !== undefined)
            Object.defineProperty(this, "content", { enumerable: true, value: content });
        Object.defineProperty(this, "metaType", { enumerable: true, value: metaType });
    }

    /**
     * Parse a metadata line
     *
     * @since 1.0.0
     *
     * @param int      lineNo   Starting line number in original FLT source
     * @param Bitfield bitfield Bitfield for line flags
     * @param string   content  Line content
     * @return Line Instance of a Line subclass
     */
    static parse(lineNo, bitfield, content) {
        content = Helpers.splitNumPrefix(content);
        switch (content[0]) {
            case Constants.M_DOCTYPE:
            case Constants.M_GENERATOR:
                return new MetaLine(lineNo, bitfield, content[0], content[1]);
            case Constants.M_VERSION:
                return new MetaLine(lineNo, bitfield, content[0], parseInt(content[1], 16));
            case Constants.M_FEATURES:
                return new MetaLine(lineNo, bitfield, content[0], new Features(content[1]));
            case Constants.M_DCMETA:
                return DCLine.parse(lineNo, bitfield, content[1]);
            default:
                throw new Error.NotImplementedError(`Unknown metadata type: ${content[0]}`);
        }
    }

    /**
     * Render to string
     *
     * @since 1.0.0
     *
     * @param string chain Chained data from subclass
     * @return string
     */
    toString(chain = "") {
        let output = this.metaType.toString(16);
        if (chain.length) output += ` ${chain}`;
        else
            switch (typeof this.content) {
                case "number":
                    if (Number.isInteger(this.content)) output += ` ${this.content.toString(16)}`;
                    else output += ` ${this.content}`;
                    break;
                case "bigint":
                    output += ` ${this.content.toString(16)}`;
                    break;
                case "object":
                    throw new Error.NotImplementedError("Unknown metadata content object");
                    break;
                case "boolean":
                    output += ` ${this.content.toString()}`;
                    break;
                case "string":
                    output += ` ${this.content}`;
                    break;
            }
        return super.toString(output);
    }
}

export class DCLine extends MetaLine {
    /**
     * New instance
     *
     * @since 1.0.0
     *
     * @param int    lineNo   Starting line number in original FLT source
     * @param int    metaType Metadata type
     * @param string term     Dublin core term
     * @param string value    Dublin core value
     */
    constructor(lineNo, bitfield, term, value) {
        super(lineNo, bitfield, Constants.M_DCMETA);
        Object.defineProperties(this, {
            term: { enumerable: true, value: term },
            value: { enumerable: true, value },
        });
    }

    /**
     * Parse a dublin core line
     *
     * @since 1.0.0
     *
     * @param int      lineNo   Starting line number in original FLT source
     * @param Bitfield bitfield Bitfield for line flags
     * @param string   content  Line content
     * @return Line Instance of a Line subclass
     */
    static parse(lineNo, bitfield, content) {
        let matches = content.match(/(\w+) (.+)/u);
        if (!matches)
            throw new Error.SyntaxError(lineNo, "Malformed dublin core metadata definition");
        if (!Constants.DC_TERMS.includes(matches[1]))
            throw new Error.DCError(`Invalid dublin core term: ${matches[1]}`);
        return new DCLine(lineNo, bitfield, matches[1], matches[2].trim());
    }

    /**
     * Render to string
     *
     * @since 1.0.0
     *
     * @return string
     */
    toString() {
        return super.toString(`${this.term} ${this.value}`);
    }
}
