"use strict";

export class FLTError extends Error {}

export class PluginError extends FLTError {}

export class InternalSyntaxError extends FLTError {}

export class NotImplementedError extends FLTError {}

export class TodoError extends NotImplementedError {}

export class LineError extends FLTError {
    constructor(lineNo, msg, ...args) {
        super(`Line ${lineNo}: ${msg}`, ...args);
    }
}

export class SyntaxError extends LineError {}

export class TypeError extends LineError {}

export class DCError extends FLTError {}
