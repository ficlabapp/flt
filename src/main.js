"use strict";

import { Bitfield } from "@ficlabapp/bitfield";
import { Constants } from "./constants.js";
import { Features } from "./features.js";
import { Line, TypeLine, MetaLine, DCLine } from "./line.js";
import { Plugin } from "./plugin.js";
import * as Error from "./error.js";

export * from "./line.js"; // re-export all line types for end users
export { Constants } from "./constants.js";

/**
 * Main FLT document class
 *
 * @since 1.0.0
 */
export class Document {
    /**
     * New instance
     *
     * @since 1.0.0
     *
     * @param string source FLT source to parse
     */
    constructor(source = null) {
        // main document properties
        Object.defineProperties(this, {
            version: { enumerable: true, value: Constants.DEFAULT_VERSION, writable: true },
            doctype: { enumerable: true, value: Constants.MEDIA_TYPE },
            features: { enumerable: true, value: new Features(), writable: false },
            generator: { enumerable: true, value: Constants.DEFAULT_GENERATOR, writable: true },
            lines: {
                enumerable: true,
                value: source ? Document.parse(source) : [],
                writable: true,
            },
        });

        // apply metadata provided from the document & remove corresponding lines
        this.lines = this.lines.filter((l) => {
            if (l.type != Constants.L_META) return true;
            switch (l.metaType) {
                case Constants.M_DOCTYPE:
                    if (l.content != this.doctype) throw new Error.FLTError("Not an FLT document");
                    return false;
                case Constants.M_VERSION:
                    this.version = l.content;
                    return false;
                case Constants.M_FEATURES:
                    this.features._value = l.content._value;
                    return false;
                case Constants.M_DCMETA:
                    if (!this.features.DCMETA)
                        throw new Error.FLTError(
                            "Dublin core metadata is present, but not enabled for this document"
                        );
                    return true;
                case Constants.M_GENERATOR:
                    this.generator = l.content;
                    return false;
            }
            return true;
        });
    }

    /**
     * Parse FLT source into lines
     *
     * @since 1.0.0
     *
     * @param string source FLT source
     * @return Line[]
     */
    static parse(source) {
        return source
            .split(/\r*\n\r*/u)
            .map((l, i) => ({ no: i + 1, data: l }))
            .filter((l) => !l.data.match(/^\s*(?:(?:#|\/\/).*)?$/u))
            .map((l) => {
                let matches = l.data.match(/^\s*([0-9a-f]+)(?: (.*))?$/iu);
                if (!matches) {
                    console.log(l.data);
                    throw new Error.SyntaxError(l.no, "Malformed line structure");
                }
                return {
                    no: l.no,
                    bitfield: new Bitfield({}, `0x${matches[1]}`),
                    content: matches[2],
                };
            })
            .reduce((c, l) => {
                if (!c.length || l.bitfield > 0n) c.push(l);
                else c[c.length - 1].content += l.content;

                return c;
            }, [])
            .map((l) => {
                try {
                    // unescape content
                    l.content = l.content.replace(/\\[\\n]/gu, (m) => {
                        switch (m) {
                            case "\\\\":
                                return "\\";
                            case "\\n":
                                return "\n";
                        }
                        return m;
                    });
                    return Line.parse(l.no, l.bitfield, l.content);
                } catch (e) {
                    console.log(`Line ${l.no}: ${l.content}`);
                    throw e;
                }
            });
    }

    /**
     * Render to FLT source
     *
     * @since 1.0.0
     *
     * @return string
     */
    toString() {
        let lines = [];
        lines.push(new MetaLine(0, {}, Constants.M_DOCTYPE, this.doctype));
        lines.push(new MetaLine(0, {}, Constants.M_VERSION, this.version));
        lines.push(new MetaLine(0, {}, Constants.M_FEATURES, this.features.toString()));
        lines.push(new MetaLine(0, {}, Constants.M_GENERATOR, Constants.DEFAULT_GENERATOR));
        lines = lines
            .concat(this.lines.filter((l) => l instanceof MetaLine && !(l instanceof DCLine)))
            .concat(
                this.lines
                    .filter((l) => l instanceof DCLine)
                    .sort((a, b) => {
                        if (a.term > b.term) return 1;
                        if (a.term < b.term) return -1;
                        return 0;
                    })
            )
            .concat(this.lines.filter((l) => !(l instanceof MetaLine)));
        return lines
            .map((l) => {
                l = l
                    .toString()
                    // escape content
                    .replace(/[\\\n]/gu, (m) => {
                        switch (m) {
                            case "\\":
                                return "\\\\";
                            case "\n":
                                return "\\n";
                        }
                        return m;
                    });
                if (l.length > Constants.MAX_LINE_LENGTH) {
                    let r = new RegExp(`.{1,${Constants.MAX_LINE_LENGTH}}`, "g");
                    l = l.match(r);
                    l = [l[0]].concat(l.slice(1).map((s) => `0000 ${s}`));
                }
                return l;
            })
            .filter((l) => l)
            .reduce((c, l) => {
                if (typeof l === "string") c.push(l);
                else for (let s of l) c.push(s);
                return c;
            }, [])
            .join("\n");
    }

    /**
     * Add a dublin core metadata item
     *
     * @since 1.0.0
     *
     * @param string term  Dublin core term
     * @param string value Value to add
     * @return void
     */
    addDC(term, value = undefined) {
        if (!this.features.DCMETA)
            throw new Error.FLTError("Dublin core metadata is not enabled for this document");
        if (!Constants.DC_TERMS.includes(term))
            throw new Error.DCError(`Invalid dublin core term: ${term}`);
        if (value !== undefined) {
            this.lines.push(new DCLine(undefined, undefined, term, value));
        }
    }

    /**
     * Replace all dublin core metadata items for the given term
     *
     * @since 1.0.0
     *
     * @param string          term   Dublin core term
     * @param string|string[] values Value(s) to set
     * @return void
     */
    setDC(term, values = []) {
        if (typeof values === "string") values = [values];
        else if (values === null) values = []; // treat null as undefined
        this.lines = this.lines.filter((l) => !(l instanceof DCLine && l.term === term));
        for (let value of values) this.addDC(term, value);
    }

    /**
     * Return all values for the requested dublin core term
     *
     * @since 1.0.0
     *
     * @param string term Dublin core term to return values for
     * @return string[]
     */
    getDC(term) {
        if (!this.features.DCMETA)
            throw new Error.FLTError("Dublin core metadata is not enabled for this document");
        if (!Constants.DC_TERMS.includes(term))
            throw new Error.DCError(`Invalid dublin core term: ${term}`);

        // naive implementation that requires a full document scan on every read
        // TODO add some sort of indexing here
        return this.lines.filter((l) => l instanceof DCLine && l.term === term).map((l) => l.value);
    }

    /**
     * Use a plugin
     *
     * @since 1.1.0
     *
     * @param Plugin pluginClass Plugin class to attach
     * @param array  setup       Args to pass to plugin _setup() method
     * @return void
     */
    use(pluginClass, ...setup) {
        for (let method of pluginClass._register()) {
            Object.defineProperty(this, method, {
                enumerable: true,
                value: (...args) => pluginClass[method].apply(this, args)
            });
            // run setup hook
            if (pluginClass._setup) pluginClass._setup.apply(this, setup);
        }
    }
}
