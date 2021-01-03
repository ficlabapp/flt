"use strict";

import { Bitfield } from "@ficlabapp/bitfield";

import { Constants } from "./constants.js";
import { Helpers } from "./helpers.js";

export class Features extends Bitfield {
    constructor(value = Constants.DEFAULT_FEATURES) {
        super(
            {
                DCMETA: { offset: Helpers.ffz(~Constants.F_DCMETA) },
            },
            value
        );
    }
}
