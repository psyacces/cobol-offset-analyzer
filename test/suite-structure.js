'use strict';

/**
 * Group nesting: every level must produce a row (so hover works everywhere),
 * and each group's size must be the sum of its children.
 */

const { parse, Results } = require('./harness');

function run() {
    const r = new Results('Nested groups and hierarchy');

    // ------------------------------------------------- four levels of nesting
    {
        const vars = parse(`
01  B-REC.
    05  B-L1.
        10  B-L2.
            15  B-L3.
                20  B-F1        PIC X(4).
                20  B-F2        PIC X(6).
            15  B-L3B.
                20  B-F3        PIC X(2).
        10  B-L2B.
            15  B-F4            PIC X(5).
    05  B-AFTER                 PIC X(3).
`);
        // B-L3  = 4 + 6 = 10   at 1
        // B-L3B = 2            at 11
        // B-L2  = 10 + 2 = 12  at 1
        // B-L2B = 5            at 13
        // B-L1  = 12 + 5 = 17  at 1
        // B-REC = 17 + 3 = 20
        r.checkVar(vars, 'B-F1', 1, 4);
        r.checkVar(vars, 'B-F2', 5, 6);
        r.checkVar(vars, 'B-L3', 1, 10);
        r.checkVar(vars, 'B-F3', 11, 2);
        r.checkVar(vars, 'B-L3B', 11, 2);
        r.checkVar(vars, 'B-L2', 1, 12);
        r.checkVar(vars, 'B-F4', 13, 5);
        r.checkVar(vars, 'B-L2B', 13, 5);
        r.checkVar(vars, 'B-L1', 1, 17);
        r.checkVar(vars, 'B-AFTER', 18, 3);
        r.checkVar(vars, 'B-REC', 1, 20);

        // Every single one must be hoverable.
        r.checkAllPresent(vars, [
            'B-REC', 'B-L1', 'B-L2', 'B-L3', 'B-F1', 'B-F2',
            'B-L3B', 'B-F3', 'B-L2B', 'B-F4', 'B-AFTER'
        ]);
    }

    // ------------------------------------------------- sibling groups in a row
    {
        const vars = parse(`
01  S-REC.
    05  S-A.
        10  S-A1              PIC X(10).
        10  S-A2              PIC X(10).
    05  S-B.
        10  S-B1              PIC X(5).
    05  S-C.
        10  S-C1              PIC X(7).
    05  S-TAIL                PIC X(1).
`);
        r.checkVar(vars, 'S-A', 1, 20);
        r.checkVar(vars, 'S-B', 21, 5);
        r.checkVar(vars, 'S-C', 26, 7);
        r.checkVar(vars, 'S-TAIL', 33, 1);
        r.checkVar(vars, 'S-REC', 1, 33);
    }

    // -------------------------------------------- 88-level and 66 are storage-free
    {
        const vars = parse(`
01  C-REC.
    05  C-STATUS              PIC X(1).
        88  C-ACTIVE          VALUE 'A'.
        88  C-CLOSED          VALUE 'C'.
    05  C-NAME                PIC X(9).
`);
        r.checkVar(vars, 'C-STATUS', 1, 1);
        r.checkVar(vars, 'C-NAME', 2, 9);
        r.checkVar(vars, 'C-REC', 1, 10);
        r.check('88-levels excluded', vars.filter(v => v.level === '88').length, 0);
    }

    // ------------------------------------- 77 independent items restart at 1
    {
        const vars = parse(`
77  W-COUNTER                 PIC 9(4).
77  W-FLAG                    PIC X(1).
01  W-REC.
    05  W-DATA                PIC X(8).
`);
        r.checkVar(vars, 'W-COUNTER', 1, 4);
        r.checkVar(vars, 'W-FLAG', 1, 1);
        r.checkVar(vars, 'W-REC', 1, 8);
    }

    // ------------------------------------- consecutive 01 records restart at 1
    {
        const vars = parse(`
01  R-ONE.
    05  R-ONE-A               PIC X(12).
01  R-TWO.
    05  R-TWO-A               PIC X(3).
    05  R-TWO-B               PIC X(4).
`);
        r.checkVar(vars, 'R-ONE', 1, 12);
        r.checkVar(vars, 'R-TWO-A', 1, 3);
        r.checkVar(vars, 'R-TWO-B', 4, 4);
        r.checkVar(vars, 'R-TWO', 1, 7);
    }

    // ------------------------------------------- multiple FILLERs stay distinct
    {
        const vars = parse(`
01  F-REC.
    05  FILLER                PIC X(4).
    05  F-DATA                PIC X(6).
    05  FILLER                PIC X(2).
`);
        const fillers = vars.filter(v => v.name === 'FILLER');
        r.check('two FILLER rows', fillers.length, 2);
        r.check('FILLER #1 position', fillers[0].position, 1);
        r.check('FILLER #2 position', fillers[1].position, 11);
        r.checkVar(vars, 'F-REC', 1, 12);
    }

    return r;
}

module.exports = { run };
