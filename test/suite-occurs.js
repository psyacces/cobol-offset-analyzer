'use strict';

/**
 * OCCURS on elementary items, on groups, and nested inside other OCCURS.
 * A table's size is one entry multiplied by the repetition count; the entry
 * itself is reported at the position of its first occurrence.
 */

const { parse, Results } = require('./harness');

function run() {
    const r = new Results('OCCURS tables');

    // ------------------------------------------------ elementary OCCURS
    {
        const vars = parse(`
01  O-REC.
    05  O-ARR   OCCURS 22 TIMES  PIC X(254).
    05  O-TAIL                   PIC X(1).
`);
        r.checkVar(vars, 'O-ARR', 1, 5588);        // 22 * 254
        r.checkVar(vars, 'O-TAIL', 5589, 1);
        r.checkVar(vars, 'O-REC', 1, 5589);
    }

    // ------------------------------------------------------ group OCCURS
    {
        const vars = parse(`
01  C-REC.
    05  C-TAB   OCCURS 3 TIMES.
        10  C-A                  PIC X(2).
        10  C-B                  PIC X(3).
    05  C-AFTER                  PIC X(1).
`);
        // one entry = 2 + 3 = 5, table = 3 * 5 = 15
        r.checkVar(vars, 'C-A', 1, 2);
        r.checkVar(vars, 'C-B', 3, 3);
        r.checkVar(vars, 'C-TAB', 1, 15);
        r.checkVar(vars, 'C-AFTER', 16, 1);
        r.checkVar(vars, 'C-REC', 1, 16);
    }

    // ---------------------------------------------------- nested OCCURS
    {
        const vars = parse(`
01  N-REC.
    05  N-OUTER OCCURS 4 TIMES.
        10  N-KEY                PIC X(3).
        10  N-INNER OCCURS 5 TIMES.
            15  N-VAL            PIC X(2).
    05  N-AFTER                  PIC X(9).
`);
        // N-INNER = 5 * 2 = 10 ; N-OUTER entry = 3 + 10 = 13 ; table = 4 * 13 = 52
        r.checkVar(vars, 'N-KEY', 1, 3);
        r.checkVar(vars, 'N-VAL', 4, 2);
        r.checkVar(vars, 'N-INNER', 4, 10);
        r.checkVar(vars, 'N-OUTER', 1, 52);
        r.checkVar(vars, 'N-AFTER', 53, 9);
        r.checkVar(vars, 'N-REC', 1, 61);
    }

    // ------------------------------------- OCCURS with COMP-3 elements
    {
        const vars = parse(`
01  P-REC.
    05  P-TAB   OCCURS 10 TIMES.
        10  P-AMT                PIC S9(7)V99 COMP-3.
        10  P-CD                 PIC X(1).
    05  P-AFTER                  PIC X(2).
`);
        // P-AMT = FLOOR(9/2)+1 = 5 ; entry = 6 ; table = 60
        r.checkVar(vars, 'P-AMT', 1, 5);
        r.checkVar(vars, 'P-CD', 6, 1);
        r.checkVar(vars, 'P-TAB', 1, 60);
        r.checkVar(vars, 'P-AFTER', 61, 2);
        r.checkVar(vars, 'P-REC', 1, 62);
    }

    // ------------------------- OCCURS DEPENDING ON sizes with the maximum
    {
        const vars = parse(`
01  D-REC.
    05  D-CNT                    PIC 9(2).
    05  D-TAB   OCCURS 1 TO 50 TIMES DEPENDING ON D-CNT.
        10  D-ITEM               PIC X(4).
    05  D-AFTER                  PIC X(3).
`);
        r.checkVar(vars, 'D-CNT', 1, 2);
        r.checkVar(vars, 'D-TAB', 3, 200);         // 50 * 4
        r.checkVar(vars, 'D-AFTER', 203, 3);
        r.checkVar(vars, 'D-REC', 1, 205);
    }

    return r;
}

module.exports = { run };
