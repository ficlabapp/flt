text/vnd.ficlab.flt
===================

This format is a line-based rich text format intended for use with FicLab ebook
software.

The current version of the format specification is `1`.

## Conventions & Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in [RFC 2119][1].

[1]: https://tools.ietf.org/html/rfc2119

## Definitions

### FLT Document

An FLT document is a text document complying with the `text/vnd.ficlab.flt`
media type. Such a document MUST comply with the following characteristics:

## Encoding

All textual content MUST use UTF-8 encoding.

All numeric and bitmask content MUST be encoded as hexadecimal (base-16).

## Line-Based

The FLT document is comprised of one or more lines. Each line MUST be no more
than 78 characters in length, with the final character being a newline (0x0A).
The final line of a document MAY omit the terminating newline.

Lines are formatted as a hex-encoded bitmask, then a space (0x20), then the line
content. Both the space and the trailing newline MUST NOT be treated as part of
the line content.

The document MAY contain empty lines consisting entirely of whitespace, or
comment lines starting with a single `#` character. All such lines MUST be
ignored by the parser. The first line of the document MUST NOT be such a line.

It is RECOMMENDED that leading bitmasks be presented as four octets, with
leading zeros, in order to facilitate human readability.

If a line would not otherwise fit within the 78 character maximum length, it
MUST be split into multiple lines. When a line is split, the additional lines
thus generated MUST use a leading bitmask of zero.

## Header

Each FLT document MUST start with a META line of type DOCTYPE, followed by a
META line of type VERSION, followed by a META line of type FEATURES.

## Line Flags

Each line begins with a bitmask, which contains one or more of the following
flags. Typed data lines may elect to use flags matching the mask `0x0FF0` for
other purposes specific to that particular type.

| Value  | Name      | Description         |
| ------ | --------- | ------------------- |
| 0x0001 | TEXT      | Text content        |
| 0x0002 | TYPE      | Typed data          |
| 0x0003 | META      | Document metadata   |
| 0x0004 | RESET     | Reset carried state |
| 0x0008 |           | RESERVED            |
| 0x0010 | ITALIC    | Italic text         |
| 0x0020 | BOLD      | Bold text           |
| 0x0040 | UNDERLINE | Underlined text     |
| 0x0080 | STRIKEOUT | Struck-out text     |
| 0x0100 | SUPERTEXT | Supertext           |
| 0x0200 | SUBTEXT   | Subtext             |
| 0x0400 | MONO      | Monospaced text     |
| 0x0800 |           | RESERVED            |

### RESET

Resets any persistent state (e.g. links, tooltips) that may otherwise apply to
this line. This flag MUST be applied first, before any other flags are
processed.

## Metadata

Metadata lines MUST consist of a type number, then a space, then type-dependent
content.

### Metadata Types

| Number | Type      | Description                            |
| -----: | --------- | -------------------------------------- |
|      0 | DOCTYPE   | Document type                          |
|      1 | VERSION   | Format version                         |
|      2 | FEATURES  | Feature bitmask                        |
|      3 | DCMETA    | Dublin core metadata                   |
|      4 | GENERATOR | Software used to generate the document |

#### DOCTYPE

MUST contain the string `text/vnd.ficlab.flt`, and nothing else. The line flags
MUST be set to 0x0003.

#### VERSION

Contains the version number of the FLT format used in the document. The line
flags MUST be set to 0x0003.

#### FEATURES

Contains a bitmask that declares all features used in the document.

|  Value | Feature | Description          |
| -----: | ------- | -------------------- |
| 0x0001 | DCMETA  | Dublin core metadata |

#### DCMETA

Contains a [Dublin Core][2] metadata field. The content MUST consist of any
Dublin Core term in the `/terms/` namespace, followed by a space, followed by
the data for that term.

[2]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/

## Typed Data

Typed data lines MUST consist of a type number, then type-dependent content.

| Number | Type        | Description                                 |
| -----: | ----------- | ------------------------------------------- |
|      0 | NOOP        | Null operation                              |
|      1 | SECTION     | New section                                 |
|      2 | PARAGRAPH   | New paragraph                               |
|      3 | HINT        | Hint / tooltip for subsequent content       |
|      4 | LINK        | URL to which subsequent content should link |
|      5 | ANCHOR      | Named anchor for internal linking           |
|      6 | BLOB        | Base64-encoded binary data                  |
|      7 | IMAGE       | Image                                       |
|      8 | TABLE       | New table                                   |
|      9 | DESTINATION | Content destination                         |

### SECTION

Begin a new section. If the section begins with paragraph content, then this
will also implicitly open a new paragraph and set the destination to `BODY`.

#### Flags
| Number | Type         | Description                             |
| -----: | ------------ | --------------------------------------- |
| 0x0010 | ALIGN_LEFT   | Section text should be centred          |
| 0x0020 | ALIGN_CENTER | Section text should be right-aligned    |
| 0x0030 | ALIGN_RIGHT  | Section text should be fully justified  |
| 0x0040 | VISUAL_BREAK | Visual separator after previous section |

### PARAGRAPH

Begin a new paragraph. Implicitly sets the destination to `BODY`.

#### Flags
| Number | Type         | Description                             |
| -----: | ------------ | --------------------------------------- |
| 0x0010 | ALIGN_LEFT   | Section text should be centred          |
| 0x0020 | ALIGN_CENTER | Section text should be right-aligned    |
| 0x0030 | ALIGN_RIGHT  | Section text should be fully justified  |

### HINT

The next structural element to follow this line (e.g. link, image) SHOULD
display the text defined in this line as a hint, tooltip or caption.

### LINK

MUST contain either a URL, or a hash (`#`) followed by the name of an anchor.
All following content SHOULD link to this URL or anchor. If a line with a RESET
flag is encountered, or the output destination changes (e.g. from body to
footnote), or a new paragraph or section is started, then any further content
MUST NOT continue to link to this URL.

### ANCHOR

Declares an anchor name. The anchor name MUST NOT contain any whitespace.

### BLOB

MUST contain an [RFC 6838][3] media type, then a space, then the data encoded
as [RFC 4648][4] base64.

[3]: https://tools.ietf.org/html/rfc6838
[4]: https://tools.ietf.org/html/rfc4648

### IMAGE

Defines an image. The image format MUST be either `image/jpeg`, `image/png`,
`image/svg` or `image/webp`. This line MUST contain a URL pointing to the
image, or nothing. If the line is empty, then the line MUST be preceded by a
typed `BLOB` line containing the image.

### TABLE

MUST contain a single number, and nothing else. This defines the number of
columns in the table.

Content is inserted by setting the destination to cell.

### DESTINATION

Contains no content. The destination is set using bits 5-8 of the line flags
(`0x00f0`).

| Number | Destination | Description          |
| -----: | ----------- | -------------------- |
| 0x0000 | BODY        | Main document body   |
| 0x0010 | NOTE        | Aside or footer note |
| 0x0020 | CELL        | Table cell           |

If the destination is a table cell, a new cell is created every time this line
is present.

#### Flags

| Number | Name   | Description                        |
| -----: | -------| ---------------------------------- |
| 0x0100 | HEADER | Cell destination is a table header |
