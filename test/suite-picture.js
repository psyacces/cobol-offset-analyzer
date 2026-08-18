'use strict';

/**
 * PICTURE decoding under USAGE DISPLAY.
 *
 * Expected byte counts follow the IBM Enterprise COBOL rule that every symbol
 * occupying a character position costs one byte, while S, V and P cost none.
 */

const { CobolParser, Results } = require('./harness');

function run() {
    const r = new Results('PICTURE decoding (USAGE DISPLAY)');
    const p = new CobolParser();

    // [picture, expected display bytes, expected digit positions]
    const cases = [
        // --- plain numeric -------------------------------------------------
        ['9', 1, 1],
        ['9(5)', 5, 5],
        ['9(18)', 18, 18],
        ['999', 3, 3],
        ['S9(5)', 5, 5],              // S is overpunched onto a digit: 0 bytes
        ['S9', 1, 1],

        // --- implied decimal (V costs nothing) ------------------------------
        ['9(5)V99', 7, 7],
        ['S9(4)V999', 7, 7],
        ['V9(3)', 3, 3],
        ['S9(7)V99', 9, 9],
        ['9(9)V99', 11, 11],

        // --- scaling positions (P is a digit but occupies no byte) ----------
        ['9(3)PPP', 3, 6],
        ['PPP9(3)', 3, 6],
        ['9(4)P', 4, 5],

        // --- alphanumeric / alphabetic --------------------------------------
        ['X', 1, 0],
        ['X(20)', 20, 0],
        ['X(254)', 254, 0],
        ['A(10)', 10, 0],
        ['XXX', 3, 0],

        // --- national / DBCS: two bytes per character position ---------------
        ['N(5)', 10, 0],
        ['G(4)', 8, 0],

        // --- numeric edited: insertion characters each cost a byte -----------
        ['ZZ,ZZ9.99', 9, 7],          // bytes: Z Z , Z Z 9 . 9 9 ; digits: ZZ ZZ 9 99
        ['ZZZ9', 4, 4],
        ['****.**', 7, 6],            // * * * * . * *
        ['99B99', 5, 4],              // B is a blank insertion character
        ['9(4)/99/99', 10, 8],        // slashes are insertion characters
        ['+9(5)', 6, 5],              // fixed sign insertion
        ['9(5)+', 6, 5],
        ['-9(5)', 6, 5],
        ['---,--9.99', 10, 3],        // floating sign: one byte per symbol
        ['$$$,$$9.99', 10, 3],        // floating currency
        ['$9(5).99', 9, 7],
        ['$$$,$$9.99CR', 12, 3],      // CR is a two-byte credit symbol
        ['9(5)DB', 7, 5],
        ['ZZZ,ZZZ.ZZ', 10, 8]
    ];

    for (const [pic, bytes, digits] of cases) {
        r.check(`PIC ${pic} bytes`, p.calculatePicLength(pic), bytes);
        r.check(`PIC ${pic} digits`, p.calculatePicDigits(pic), digits);
    }

    return r;
}

module.exports = { run };
