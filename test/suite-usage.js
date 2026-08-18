'use strict';

/**
 * The complete USAGE universe.
 *
 * COMP  (binary):  1-4 digits = 2 bytes, 5-9 = 4 bytes, 10-18 = 8 bytes.
 * COMP-3 (packed): FLOOR(digits / 2) + 1 bytes.
 * COMP-1 = 4, COMP-2 = 8, INDEX = 4, POINTER = 4.
 */

const { parse, Results } = require('./harness');

/** Builds a record of one field per case and returns the parsed rows. */
function layout(fields) {
    const src = '\n01  T-REC.\n' +
        fields.map((f, i) => `    05  F${String(i).padStart(2, '0')}  ${f}.`).join('\n') + '\n';
    return parse(src);
}

function run() {
    const r = new Results('USAGE sizing (COMP / COMP-3 / COMP-1 / COMP-2 / INDEX / POINTER)');

    // ---------------------------------------------------------------- COMP-3
    // FLOOR(digits/2) + 1
    const packed = [
        ['PIC 9(1)  COMP-3', 1],
        ['PIC 9(2)  COMP-3', 2],
        ['PIC 9(3)  COMP-3', 2],
        ['PIC 9(4)  COMP-3', 3],
        ['PIC 9(5)  COMP-3', 3],
        ['PIC 9(6)  COMP-3', 4],
        ['PIC 9(7)  COMP-3', 4],
        ['PIC 9(8)  COMP-3', 5],
        ['PIC 9(9)  COMP-3', 5],
        ['PIC 9(10) COMP-3', 6],
        ['PIC 9(11) COMP-3', 6],
        ['PIC 9(12) COMP-3', 7],
        ['PIC 9(13) COMP-3', 7],
        ['PIC 9(14) COMP-3', 8],
        ['PIC 9(15) COMP-3', 8],
        ['PIC 9(16) COMP-3', 9],
        ['PIC 9(17) COMP-3', 9],
        ['PIC 9(18) COMP-3', 10],
        // signed and decimal variants: S and V add no digits of their own
        ['PIC S9(5) COMP-3', 3],
        ['PIC S9(7)V99 COMP-3', 5],       // 9 digits
        ['PIC S9(9)V99 COMP-3', 6],       // 11 digits
        ['PIC 9(5)V999 COMP-3', 5],       // 8 digits
        ['PIC S9(3)V9(2) COMP-3', 3],     // 5 digits
        ['PIC 9(4)PPP COMP-3', 4],        // 7 digit positions
        // spelling variants must size identically
        ['PIC S9(7)V99 COMPUTATIONAL-3', 5],
        ['PIC S9(7)V99 PACKED-DECIMAL', 5],
        ['PIC S9(7)V99 USAGE IS COMP-3', 5],
        ['USAGE COMP-3 PIC S9(7)V99', 5]
    ];
    {
        const vars = layout(packed.map(c => c[0]));
        packed.forEach(([decl, expected], i) => {
            const v = vars.find(x => x.name === `F${String(i).padStart(2, '0')}`);
            r.check(`${decl}`, v ? v.length : 'MISSING', expected);
            if (v) r.check(`${decl} type`, v.dataType, 'COMP-3 (Packed Decimal)');
        });
    }

    // ------------------------------------------------------------------ COMP
    const binary = [
        ['PIC 9(1)  COMP', 2],
        ['PIC 9(4)  COMP', 2],
        ['PIC S9(4) COMP', 2],
        ['PIC 9(5)  COMP', 4],
        ['PIC 9(9)  COMP', 4],
        ['PIC S9(9) COMP', 4],
        ['PIC 9(10) COMP', 8],
        ['PIC 9(18) COMP', 8],
        ['PIC S9(18) COMP', 8],
        ['PIC S9(7)V99 COMP', 4],         // 9 digits -> fullword
        ['PIC S9(9)V99 COMP', 8],         // 11 digits -> doubleword
        // spelling variants
        ['PIC 9(4) COMPUTATIONAL', 2],
        ['PIC 9(4) COMP-4', 2],
        ['PIC 9(4) COMPUTATIONAL-4', 2],
        ['PIC 9(4) BINARY', 2],
        ['PIC 9(4) COMP-5', 2],
        ['PIC 9(9) USAGE IS COMP', 4]
    ];
    {
        const vars = layout(binary.map(c => c[0]));
        binary.forEach(([decl, expected], i) => {
            const v = vars.find(x => x.name === `F${String(i).padStart(2, '0')}`);
            r.check(`${decl}`, v ? v.length : 'MISSING', expected);
        });
    }

    // -------------------------------------------- COMP-1 / COMP-2 / INDEX / PTR
    const noPic = [
        ['COMP-1', 4, 'COMP-1 (Single-Precision Float)'],
        ['COMPUTATIONAL-1', 4, 'COMP-1 (Single-Precision Float)'],
        ['COMP-2', 8, 'COMP-2 (Double-Precision Float)'],
        ['COMPUTATIONAL-2', 8, 'COMP-2 (Double-Precision Float)'],
        ['USAGE IS INDEX', 4, 'INDEX'],
        ['USAGE IS POINTER', 4, 'POINTER']
    ];
    {
        const vars = layout(noPic.map(c => c[0]));
        noPic.forEach(([decl, expected, type], i) => {
            const v = vars.find(x => x.name === `F${String(i).padStart(2, '0')}`);
            r.check(`${decl}`, v ? v.length : 'MISSING', expected);
            if (v) r.check(`${decl} type`, v.dataType, type);
        });
    }

    // --------------------------------------------------- DISPLAY is the default
    const display = [
        ['PIC 9(5)', 5, 'Numeric'],
        ['PIC S9(5)', 5, 'Signed Numeric'],
        ['PIC 9(5)V99', 7, 'Numeric with Decimal'],
        ['PIC X(30)', 30, 'Alphanumeric'],
        ['PIC A(8)', 8, 'Alphabetic'],
        ['PIC ZZ,ZZ9.99', 9, 'Numeric Edited'],
        ['PIC 9(5) USAGE IS DISPLAY', 5, 'Numeric'],
        ['PIC N(5)', 10, 'National (DBCS)']
    ];
    {
        const vars = layout(display.map(c => c[0]));
        display.forEach(([decl, expected, type], i) => {
            const v = vars.find(x => x.name === `F${String(i).padStart(2, '0')}`);
            r.check(`${decl}`, v ? v.length : 'MISSING', expected);
            if (v) r.check(`${decl} type`, v.dataType, type);
        });
    }

    // ------------------------------------------ names must not imply a usage
    // A field named WS-COMP-FLAG is DISPLAY, not binary; likewise for a field
    // whose name merely contains BINARY or POINTER.
    {
        const vars = parse(`
01  N-REC.
    05  WS-COMP-FLAG        PIC X(3).
    05  WS-COMPUTED-VALUE   PIC 9(5).
    05  BINARY-SEARCH-KEY   PIC X(4).
    05  WS-POINTER-NAME     PIC X(6).
    05  WS-INDEX-TEXT       PIC X(2).
`);
        r.checkVar(vars, 'WS-COMP-FLAG', 1, 3, { type: 'Alphanumeric' });
        r.checkVar(vars, 'WS-COMPUTED-VALUE', 4, 5, { type: 'Numeric' });
        r.checkVar(vars, 'BINARY-SEARCH-KEY', 9, 4, { type: 'Alphanumeric' });
        r.checkVar(vars, 'WS-POINTER-NAME', 13, 6, { type: 'Alphanumeric' });
        r.checkVar(vars, 'WS-INDEX-TEXT', 19, 2, { type: 'Alphanumeric' });
        r.checkVar(vars, 'N-REC', 1, 20);
    }

    // ------------------------------------------------ mixed usages in a record
    // 5 + 3 + 2 + 4 + 8 + 4 = 26
    {
        const vars = parse(`
01  M-REC.
    05  M-DISP              PIC X(5).
    05  M-PACK              PIC S9(5)   COMP-3.
    05  M-BIN2              PIC S9(4)   COMP.
    05  M-BIN4              PIC S9(9)   COMP.
    05  M-BIN8              PIC S9(18)  COMP.
    05  M-FLOAT             COMP-1.
`);
        r.checkVar(vars, 'M-DISP', 1, 5);
        r.checkVar(vars, 'M-PACK', 6, 3);
        r.checkVar(vars, 'M-BIN2', 9, 2);
        r.checkVar(vars, 'M-BIN4', 11, 4);
        r.checkVar(vars, 'M-BIN8', 15, 8);
        r.checkVar(vars, 'M-FLOAT', 23, 4);
        r.checkVar(vars, 'M-REC', 1, 26);
    }

    return r;
}

module.exports = { run };
