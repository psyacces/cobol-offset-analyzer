#!/usr/bin/env node
'use strict';

/**
 * Integration test plan for the COBOL Offset Analyzer.
 *
 *   1. PICTURE      — byte and digit counting for every picture symbol
 *   2. USAGE        — COMP / COMP-3 / COMP-1 / COMP-2 / INDEX / POINTER sizing
 *   3. Structure    — nested groups; every level must be hoverable
 *   4. OCCURS       — elementary, group, nested and DEPENDING ON tables
 *   5. REDEFINES    — partial redefinitions, nesting, cascading, cursor rewind
 *   6. Multi-line   — statements spanning lines anchor to the name line
 *   7. Real-world   — sequence numbers, INDEXED BY, column-72 overrun, casing
 *   8. Regression   — the hand-verified sample files must not drift
 *
 * Run with: npm test
 */

const suites = [
    require('./suite-picture'),
    require('./suite-usage'),
    require('./suite-structure'),
    require('./suite-occurs'),
    require('./suite-redefines'),
    require('./suite-multiline'),
    require('./suite-realworld'),
    require('./suite-regression')
];

console.log('');
console.log('COBOL Offset Analyzer — integration test plan');
console.log('='.repeat(72));
console.log('');

let allOk = true;
let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
    const result = suite.run();
    if (!result.report()) allOk = false;
    totalPassed += result.passed;
    totalFailed += result.failed;
}

console.log('');
console.log('='.repeat(72));
console.log(`${totalPassed} assertions passed, ${totalFailed} failed`);

if (allOk) {
    console.log('');
    console.log('✅ All suites green.');
    process.exit(0);
} else {
    console.log('');
    console.log('❌ Failures above.');
    process.exit(1);
}
