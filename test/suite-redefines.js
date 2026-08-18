'use strict';

/**
 * REDEFINES in every shape it appears in real programs.
 *
 * Two rules drive all of these:
 *   1. A redefining item MUST report its own position and size — programmers
 *      routinely redefine only part of the original area.
 *   2. It contributes NOTHING to its parent, and the cursor resumes at the byte
 *      after the item it redefines — not after the redefinition.
 */

const { parse, Results } = require('./harness');

function run() {
    const r = new Results('REDEFINES');

    // ------------------------------------------- the reported structure
    {
        const vars = parse(`
01  MAINGROUP.
    05  SUBGROUP1.
        10  WS-VAR1         PIC X(40).
    05  FILLER REDEFINES SUBGROUP1.
        10  WS-VAR2         PIC X(20).
        10  WS-VAR3         PIC X(10).
    05  WS-VAR3A REDEFINES SUBGROUP1.
        10  WS-VAR4         PIC X(15).
    05  SUBGROUP2.
        10  WS-VAR6         PIC X(10).
    05  WS-VAR5             PIC X(05).
`);
        r.checkVar(vars, 'SUBGROUP1', 1, 40);
        r.checkVar(vars, 'WS-VAR1', 1, 40);

        // Rule 1: the partial redefinitions report their real size.
        r.checkVar(vars, 'FILLER', 1, 30, { redefines: true });
        r.checkVar(vars, 'WS-VAR2', 1, 20);
        r.checkVar(vars, 'WS-VAR3', 21, 10);
        r.checkVar(vars, 'WS-VAR3A', 1, 15, { redefines: true });
        r.checkVar(vars, 'WS-VAR4', 1, 15);

        // Rule 2: the next real field resumes at 41, not 31 and not 16.
        r.checkVar(vars, 'SUBGROUP2', 41, 10);
        r.checkVar(vars, 'WS-VAR6', 41, 10);
        r.checkVar(vars, 'WS-VAR5', 51, 5);
        r.checkVar(vars, 'MAINGROUP', 1, 55);
    }

    // ------------------- groups nested inside a REDEFINES (the regression)
    {
        const vars = parse(`
01  A-REC.
    05  A-ORIG              PIC X(40).
    05  A-RED REDEFINES A-ORIG.
        10  A-INNER-GRP.
            15  A-F1        PIC X(10).
            15  A-F2        PIC X(5).
        10  A-INNER-GRP2.
            15  A-F3        PIC X(25).
    05  A-AFTER             PIC X(7).
`);
        // Sizes must roll up through the intermediate groups to A-RED.
        r.checkVar(vars, 'A-ORIG', 1, 40);
        r.checkVar(vars, 'A-F1', 1, 10);
        r.checkVar(vars, 'A-F2', 11, 5);
        r.checkVar(vars, 'A-INNER-GRP', 1, 15);
        r.checkVar(vars, 'A-F3', 16, 25);
        r.checkVar(vars, 'A-INNER-GRP2', 16, 25);
        r.checkVar(vars, 'A-RED', 1, 40, { redefines: true });
        r.checkVar(vars, 'A-AFTER', 41, 7);
        r.checkVar(vars, 'A-REC', 1, 47);

        r.checkAllPresent(vars, [
            'A-REC', 'A-ORIG', 'A-RED', 'A-INNER-GRP', 'A-F1', 'A-F2',
            'A-INNER-GRP2', 'A-F3', 'A-AFTER'
        ]);
    }

    // --------------------------- three levels of groups inside a REDEFINES
    {
        const vars = parse(`
01  D-REC.
    05  D-ORIG              PIC X(30).
    05  D-RED REDEFINES D-ORIG.
        10  D-L1.
            15  D-L2.
                20  D-X     PIC X(6).
                20  D-Y     PIC X(4).
    05  D-AFTER             PIC X(2).
`);
        r.checkVar(vars, 'D-X', 1, 6);
        r.checkVar(vars, 'D-Y', 7, 4);
        r.checkVar(vars, 'D-L2', 1, 10);
        r.checkVar(vars, 'D-L1', 1, 10);
        r.checkVar(vars, 'D-RED', 1, 10, { redefines: true });
        r.checkVar(vars, 'D-AFTER', 31, 2);
        r.checkVar(vars, 'D-REC', 1, 32);
    }

    // ------------------------------------------- elementary REDEFINES
    {
        const vars = parse(`
01  X-REC.
    05  X-FULL              PIC X(10).
    05  X-PART REDEFINES X-FULL PIC X(4).
    05  X-AFTER             PIC X(3).
`);
        r.checkVar(vars, 'X-FULL', 1, 10);
        r.checkVar(vars, 'X-PART', 1, 4, { redefines: true });
        r.checkVar(vars, 'X-AFTER', 11, 3);
        r.checkVar(vars, 'X-REC', 1, 13);
    }

    // ------------------------------------------ cascading redefinitions
    {
        const vars = parse(`
01  K-REC.
    05  K-ORIG              PIC X(30).
    05  K-R1 REDEFINES K-ORIG.
        10  K-R1A           PIC X(10).
        10  K-R1B           PIC X(20).
    05  K-R2 REDEFINES K-ORIG.
        10  K-R2A           PIC X(15).
    05  K-R3 REDEFINES K-ORIG PIC X(30).
    05  K-AFTER             PIC X(5).
`);
        r.checkVar(vars, 'K-ORIG', 1, 30);
        r.checkVar(vars, 'K-R1', 1, 30, { redefines: true });
        r.checkVar(vars, 'K-R1A', 1, 10);
        r.checkVar(vars, 'K-R1B', 11, 20);
        r.checkVar(vars, 'K-R2', 1, 15, { redefines: true });
        r.checkVar(vars, 'K-R2A', 1, 15);
        r.checkVar(vars, 'K-R3', 1, 30, { redefines: true });
        r.checkVar(vars, 'K-AFTER', 31, 5);
        r.checkVar(vars, 'K-REC', 1, 35);
    }

    // ------------------------------------------ OCCURS inside a REDEFINES
    {
        const vars = parse(`
01  Q-REC.
    05  Q-ORIG              PIC X(40).
    05  Q-RED REDEFINES Q-ORIG.
        10  Q-TAB OCCURS 2 TIMES.
            15  Q-A         PIC X(12).
            15  Q-B         PIC X(8).
    05  Q-AFTER             PIC X(6).
`);
        r.checkVar(vars, 'Q-A', 1, 12);
        r.checkVar(vars, 'Q-B', 13, 8);
        r.checkVar(vars, 'Q-TAB', 1, 40);          // 2 * 20
        r.checkVar(vars, 'Q-RED', 1, 40, { redefines: true });
        r.checkVar(vars, 'Q-AFTER', 41, 6);
        r.checkVar(vars, 'Q-REC', 1, 46);
    }

    // ---------------------------------- REDEFINES nested at an inner level
    {
        const vars = parse(`
01  Y-REC.
    05  Y-GRP.
        10  Y-A             PIC X(20).
        10  Y-A-RED REDEFINES Y-A.
            15  Y-A1        PIC X(8).
            15  Y-A2        PIC X(4).
        10  Y-B             PIC X(5).
    05  Y-AFTER             PIC X(2).
`);
        r.checkVar(vars, 'Y-A', 1, 20);
        r.checkVar(vars, 'Y-A-RED', 1, 12, { redefines: true });
        r.checkVar(vars, 'Y-A1', 1, 8);
        r.checkVar(vars, 'Y-A2', 9, 4);
        r.checkVar(vars, 'Y-B', 21, 5);
        r.checkVar(vars, 'Y-GRP', 1, 25);          // 20 + 5, redefinition excluded
        r.checkVar(vars, 'Y-AFTER', 26, 2);
        r.checkVar(vars, 'Y-REC', 1, 27);
    }

    // ------- a REDEFINES that is still open when an outer level arrives
    {
        const vars = parse(`
01  Z-REC.
    05  Z-G1.
        10  Z-A             PIC X(10).
        10  Z-A-RED REDEFINES Z-A.
            15  Z-A1        PIC X(6).
    05  Z-G2.
        10  Z-B             PIC X(4).
`);
        r.checkVar(vars, 'Z-A', 1, 10);
        r.checkVar(vars, 'Z-A-RED', 1, 6, { redefines: true });
        r.checkVar(vars, 'Z-G1', 1, 10);
        r.checkVar(vars, 'Z-G2', 11, 4);
        r.checkVar(vars, 'Z-B', 11, 4);
        r.checkVar(vars, 'Z-REC', 1, 14);
    }

    // ----------------------------- REDEFINES of a non-adjacent named item
    {
        const vars = parse(`
01  T-REC.
    05  T-A                 PIC X(10).
    05  T-B                 PIC X(20).
    05  T-A-RED REDEFINES T-A PIC X(10).
    05  T-AFTER             PIC X(4).
`);
        // Resolved by name: T-A sits at 1, so the redefinition sits at 1 too.
        r.checkVar(vars, 'T-A', 1, 10);
        r.checkVar(vars, 'T-B', 11, 20);
        r.checkVar(vars, 'T-A-RED', 1, 10, { redefines: true });
        r.checkVar(vars, 'T-AFTER', 31, 4);
        r.checkVar(vars, 'T-REC', 1, 34);
    }

    // ----------------------- packed / binary fields inside a REDEFINES
    {
        const vars = parse(`
01  W-REC.
    05  W-ORIG              PIC X(20).
    05  W-RED REDEFINES W-ORIG.
        10  W-C1            PIC S9(4)    COMP.
        10  W-C2            PIC S9(9)    COMP.
        10  W-P1            PIC S9(7)V99 COMP-3.
        10  W-REST          PIC X(9).
    05  W-AFTER             PIC X(3).
`);
        r.checkVar(vars, 'W-C1', 1, 2);
        r.checkVar(vars, 'W-C2', 3, 4);
        r.checkVar(vars, 'W-P1', 7, 5);
        r.checkVar(vars, 'W-REST', 12, 9);
        r.checkVar(vars, 'W-RED', 1, 20, { redefines: true });
        r.checkVar(vars, 'W-AFTER', 21, 3);
        r.checkVar(vars, 'W-REC', 1, 23);
    }

    return r;
}

module.exports = { run };
