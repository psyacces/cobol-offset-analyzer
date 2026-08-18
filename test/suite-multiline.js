'use strict';

/**
 * Statements that wrap across several source lines.
 *
 * The row must be anchored to the line carrying the level number and the name —
 * the line the programmer points at — not the line where the clause happens to
 * finish. `endLine` then extends the hover across the rest of the statement so
 * pointing anywhere in the definition still works.
 */

const { parse, Results } = require('./harness');

function run() {
    const r = new Results('Multi-line definitions and hover anchoring');

    // ---------------------- REDEFINES wrapped onto the following lines
    {
        //  1 (blank)
        //  2  01  E-REC.
        //  3      05  E-ORIG          PIC X(20).
        //  4      05  E-RED                        <-- name lives here
        //  5              REDEFINES E-ORIG
        //  6                          PIC X(20).
        //  7      05  E-AFTER         PIC X(5).
        const vars = parse(`
01  E-REC.
    05  E-ORIG          PIC X(20).
    05  E-RED
            REDEFINES E-ORIG
                        PIC X(20).
    05  E-AFTER         PIC X(5).
`);
        r.checkVar(vars, 'E-ORIG', 1, 20, { line: 3 });
        r.checkVar(vars, 'E-RED', 1, 20, { redefines: true, line: 4 });
        r.checkVar(vars, 'E-AFTER', 21, 5, { line: 7 });
        r.checkVar(vars, 'E-REC', 1, 25, { line: 2 });

        // The hover must span every line of the wrapped statement.
        const red = vars.find(v => v.name === 'E-RED');
        r.check('E-RED endLine', red.endLine + 1, 6);
        r.check('E-RED covers line 4', 3 >= red.line && 3 <= red.endLine, true);
        r.check('E-RED covers line 5', 4 >= red.line && 4 <= red.endLine, true);
        r.check('E-RED covers line 6', 5 >= red.line && 5 <= red.endLine, true);
    }

    // ------------------ a wrapped FILLER REDEFINES group (valid COBOL)
    {
        //  1 (blank)
        //  2  01  G-REC.
        //  3      05  G-ORIG          PIC X(30).
        //  4      05  FILLER                       <-- anchor here
        //  5              REDEFINES G-ORIG.
        //  6          10  G-A         PIC X(12).
        //  7          10  G-B         PIC X(18).
        //  8      05  G-AFTER         PIC X(4).
        const vars = parse(`
01  G-REC.
    05  G-ORIG          PIC X(30).
    05  FILLER
            REDEFINES G-ORIG.
        10  G-A         PIC X(12).
        10  G-B         PIC X(18).
    05  G-AFTER         PIC X(4).
`);
        const filler = vars.find(v => v.name === 'FILLER' && v.isRedefines);
        r.check('wrapped FILLER found', filler !== undefined, true);
        if (filler) {
            r.check('FILLER anchored on the name line', filler.line + 1, 4);
            r.check('FILLER endLine', filler.endLine + 1, 5);
            r.check('FILLER position', filler.position, 1);
            r.check('FILLER length', filler.length, 30);
        }
        r.checkVar(vars, 'G-A', 1, 12, { line: 6 });
        r.checkVar(vars, 'G-B', 13, 18, { line: 7 });
        r.checkVar(vars, 'G-AFTER', 31, 4, { line: 8 });
        r.checkVar(vars, 'G-REC', 1, 34);
    }

    // ------------------------- a wrapped PICTURE on an ordinary field
    {
        //  1 (blank)
        //  2  01  H-REC.
        //  3      05  H-LONG-FIELD-NAME            <-- anchor here
        //  4              PIC X(15).
        //  5      05  H-AFTER     PIC X(5).
        const vars = parse(`
01  H-REC.
    05  H-LONG-FIELD-NAME
            PIC X(15).
    05  H-AFTER     PIC X(5).
`);
        r.checkVar(vars, 'H-LONG-FIELD-NAME', 1, 15, { line: 3 });
        r.checkVar(vars, 'H-AFTER', 16, 5, { line: 5 });
        r.checkVar(vars, 'H-REC', 1, 20);
    }

    // --------------------- wrapped OCCURS clause on a group definition
    {
        //  1 (blank)
        //  2  01  J-REC.
        //  3      05  J-TAB                        <-- anchor here
        //  4              OCCURS 4 TIMES.
        //  5          10  J-A     PIC X(3).
        //  6      05  J-AFTER     PIC X(2).
        const vars = parse(`
01  J-REC.
    05  J-TAB
            OCCURS 4 TIMES.
        10  J-A     PIC X(3).
    05  J-AFTER     PIC X(2).
`);
        r.checkVar(vars, 'J-TAB', 1, 12, { line: 3 });
        r.checkVar(vars, 'J-A', 1, 3, { line: 5 });
        r.checkVar(vars, 'J-AFTER', 13, 2, { line: 6 });
        r.checkVar(vars, 'J-REC', 1, 14);
    }

    // ----------------- no two rows may claim the same source line
    {
        const vars = parse(`
01  L-REC.
    05  L-A
            REDEFINES-NOT-HERE-JUST-TEXT
            PIC X(4).
    05  L-B         PIC X(6).
`);
        const seen = new Map();
        let overlaps = 0;
        for (const v of vars) {
            for (let ln = v.line; ln <= v.endLine; ln++) {
                if (seen.has(ln)) overlaps++;
                seen.set(ln, v.name);
            }
        }
        r.check('no overlapping line ranges', overlaps, 0);
    }

    return r;
}

module.exports = { run };
