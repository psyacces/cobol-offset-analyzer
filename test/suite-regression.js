'use strict';

/**
 * Regression lock on the sample files that were verified by hand in earlier
 * rounds. These numbers are documented in README.md and must never drift.
 */

const fs = require('fs');
const path = require('path');
const { CobolParser, Results } = require('./harness');

function parseFile(name) {
    const file = path.join(__dirname, '..', name);
    return new CobolParser().parse(fs.readFileSync(file, 'utf-8').split('\n'));
}

function run() {
    const r = new Results('Regression: sample.cbl and test-redefines.cbl');

    // ------------------------------------------------------- sample.cbl
    // Values published in README.md.
    {
        const vars = parseFile('sample.cbl');
        r.checkVar(vars, 'EMP-ID', 1, 5, { type: 'Numeric' });
        r.checkVar(vars, 'EMP-NAME', 6, 30, { type: 'Alphanumeric' });
        r.checkVar(vars, 'EMP-SALARY', 36, 5, { type: 'COMP-3 (Packed Decimal)' });
        r.checkVar(vars, 'EMP-HIRE-DATE', 41, 8, { type: 'Group/Structure' });
        r.checkVar(vars, 'EMP-HIRE-YEAR', 41, 4);
        r.checkVar(vars, 'EMP-HIRE-MONTH', 45, 2);
        r.checkVar(vars, 'EMP-HIRE-DAY', 47, 2);
        r.checkVar(vars, 'EMP-CTRL', 47, 2);
        r.checkVar(vars, 'EMP-STATUS', 49, 1, { type: 'Alphanumeric' });
        r.checkVar(vars, 'EMPLOYEE-RECORD', 1, 49);

        // The REDEFINES group covers the 8 bytes of the hire date.
        const red = vars.find(v => v.isRedefines && v.name === 'FILLER');
        r.check('sample REDEFINES present', red !== undefined, true);
        if (red) {
            r.check('sample REDEFINES position', red.position, 41);
            r.check('sample REDEFINES length', red.length, 8);
        }
    }

    // ------------------------------------------------ test-redefines.cbl
    {
        const vars = parseFile('test-redefines.cbl');
        r.checkVar(vars, 'AA-VAR', 1, 5588);        // 22 * 254
        r.checkVar(vars, 'A-GROUP', 1, 5588);
        r.checkVar(vars, 'BB-VAR', 5589, 3510);     // 65 * 54
        r.checkVar(vars, 'B-GROUP', 5589, 3510);
        r.checkVar(vars, 'CC-VAR1', 5589, 2);       // PIC 9(4) COMP -> halfword
        r.checkVar(vars, 'CC-VAR2', 5591, 2);
        r.checkVar(vars, 'EMP-STATUS', 9099, 1);
        r.checkVar(vars, 'MAIN', 1, 9099);          // 5588 + 3510 + 1

        // The redefining FILLER reports its own extent but adds nothing to MAIN.
        const red = vars.find(v => v.isRedefines && v.name === 'FILLER');
        r.check('redefining FILLER present', red !== undefined, true);
        if (red) {
            r.check('redefining FILLER position', red.position, 5589);
            r.check('redefining FILLER length', red.length, 16510); // 2 + 2 + 16506
        }
    }

    // ---------------------------------------------- test-cobol-types.cbl
    // Each expectation below is written in a comment beside the field in the
    // source file itself.
    {
        const vars = parseFile('test-cobol-types.cbl');
        const expected = [
            ['FIELD-1', 1, 5],
            ['FIELD-2', 6, 10],
            ['FIELD-3', 16, 3],
            ['FIELD-4', 1, 20],
            ['FIELD-5', 21, 15],
            ['FIELD-6', 36, 1],
            ['FIELD-7', 1, 5],
            ['FIELD-8', 6, 8],
            ['FIELD-9', 1, 7],
            ['FIELD-10', 8, 7],
            ['FIELD-11', 1, 3],
            ['FIELD-12', 4, 4],
            ['FIELD-13', 1, 30]
        ];
        for (const [name, pos, len] of expected) {
            r.checkVar(vars, name, pos, len);
        }
    }

    return r;
}

module.exports = { run };
