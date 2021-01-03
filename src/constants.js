"use strict";

export class Constants {}

const values = {
    // general info
    MEDIA_TYPE: "text/vnd.ficlab.flt", // FLT media type
    MIN_VERSION: 1n, // min format version understood by this library
    MAX_VERSION: 1n, // max format version understood by this library
    DEFAULT_VERSION: 1n, // default format version for new documents
    DEFAULT_FEATURES: 0x0001n, // default document features
    DEFAULT_GENERATOR: "https://github.com/ficlabapp/flt", // document generator
    // default HTML source
    DEFAULT_HTML:
        "<!DOCTYPE html><html><head><style>.underline {text-decoration: underline;} .m" +
        "ono {font-family: monospace;} .align-center {text-align: center;} .align-righ" +
        "t {text-align: right;} .align-left {text-align: left;} </style></head></html>",

    // formatting
    MAX_LINE_LENGTH: 78n, // max number of characters in a line, excluding the final newline

    // masks
    MASK_LINE_TYPE: 0x0003n,
    MASK_LINE_FORMAT: 0x0ff0n,
    MASK_ALIGN: 0x0030n,
    MASK_DESTINATION: 0x00f0n,

    // line flags
    FORMAT_FLAGS: [
        "L_RESET",
        "L_ITALIC",
        "L_BOLD",
        "L_UNDERLINE",
        "L_STRIKEOUT",
        "L_SUPERTEXT",
        "L_SUBTEXT",
        "L_MONO",
    ],
    L_TEXT: 0x0001n, // text content
    L_TYPE: 0x0002n, // typed content
    L_META: 0x0003n, // metadata entry
    L_RESET: 0x0004n, // reset carried state
    //           0x0008, // RESERVED
    L_ITALIC: 0x0010n, // italic text
    L_BOLD: 0x0020n, // bold text
    L_UNDERLINE: 0x0040n, // underlined text
    L_STRIKEOUT: 0x0080n, // struck-out text
    L_SUPERTEXT: 0x0100n, // supertext
    L_SUBTEXT: 0x0200n, // subtext
    L_MONO: 0x0400n, // monospaced text
    //           0x0800, // RESERVED
    //           0x1000, // UNASSIGNED
    //           0x2000, // UNASSIGNED
    //           0x4000, // UNASSIGNED
    //           0x8000, // UNASSIGNED

    // metadata types
    M_DOCTYPE: 0n, // FLT doctype declaration
    M_VERSION: 1n, // FLT version used in this document
    M_FEATURES: 2n, // FLT features used in this document
    M_DCMETA: 3n, // dublin core metadata entry
    M_GENERATOR: 4n, // software used to generate the document

    // typed lines
    T_NOOP: 0n, // noop
    T_SECTION: 1n, // section break
    T_PARAGRAPH: 2n, // paragraph break
    T_HINT: 3n, // hint / tooltip
    T_LINK: 4n, // link URL
    T_ANCHOR: 5n, // internal link anchor
    T_BLOB: 6n, // base64-encoded binary data
    T_IMAGE: 7n, // image
    T_TABLE: 8n, // table
    T_DESTINATION: 9n, // output destination

    // alignment
    ALIGN_LEFT: 1n, // center-align section text
    ALIGN_CENTER: 2n, // right-align section text
    ALIGN_RIGHT: 3n, // fully-justify section text

    // section flags
    VISUAL_BREAK: 0x0040n, // include a visual break after previous section

    // feature flags
    FEATURE_FLAGS: ["F_DCMETA"],
    F_DCMETA: 0x0001n, // dublin core metadata

    // destinations
    D_BODY: 0n, // document body
    D_NOTE: 1n, // aside / note
    D_CELL: 2n, // table cell

    // destination flags
    DESTINATION_FLAGS: ["D_HEADER"],
    D_HEADER: 0x0100n, // destination is a header (only used for table cells)

    // dublin core terms
    DC_TERMS: [
        "abstract",
        "accessRights",
        "accrualMethod",
        "accrualPeriodicity",
        "accrualPolicy",
        "alternative",
        "audience",
        "available",
        "bibliographicCitation",
        "conformsTo",
        "contributor",
        "coverage",
        "created",
        "creator",
        "date",
        "dateAccepted",
        "dateCopyrighted",
        "dateSubmitted",
        "description",
        "educationLevel",
        "extent",
        "format",
        "hasFormat",
        "hasPart",
        "hasVersion",
        "identifier",
        "instructionalMethod",
        "isFormatOf",
        "isPartOf",
        "isReferencedBy",
        "isReplacedBy",
        "isRequiredBy",
        "issued",
        "isVersionOf",
        "language",
        "license",
        "mediator",
        "medium",
        "modified",
        "provenance",
        "publisher",
        "references",
        "relation",
        "replaces",
        "requires",
        "rights",
        "rightsHolder",
        "source",
        "spatial",
        "subject",
        "tableOfContents",
        "temporal",
        "title",
        "type",
        "valid",
    ],
};
[values.LINE_FLAGS, values.FEATURE_FLAGS, values.DC_TERMS, values.DESTINATION_FLAGS].forEach((o) =>
    Object.seal(o)
);

for (let key in values) {
    Object.defineProperty(Constants, key, {
        get: () => values[key],
        enumerable: true,
    });
}
Object.seal(Constants);
