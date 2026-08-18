// Test REDEFINES bug fix
const CobolParser = require('./out/cobolParser').CobolParser;
const fs = require('fs');

const testFile = './test-redefines.cbl';
const lines = fs.readFileSync(testFile, 'utf-8').split('\n');

const parser = new CobolParser();
const variables = parser.parse(lines);

console.log('Testing REDEFINES Bug Fix:\n');
console.log('=====================================\n');

// Expected results:
// 01  MAIN                       Position: 1, Length: 9,099
// 05  A-GROUP                    Position: 1, Length: 5,588
// 10  AA-VAR OCCURS 22 X(254)    Position: 1, Length: 5,588
// 05  B-GROUP                    Position: 5,589, Length: 3,510
// 10  BB-VAR OCCURS 65 X(54)     Position: 5,589, Length: 3,510
// 05  FILLER REDEFINES (skip, doesn't add bytes)
// 10  CC-VAR1 PIC 9(4) COMP      Position: 5,589, Length: 2
// 10  CC-VAR2 PIC 9(4) COMP      Position: 5,591, Length: 2
// 10  FILLER PIC X(16506)        Position: 5,593, Length: 16,506
// 05  EMP-STATUS PIC X(1)        Position: 9,099, Length: 1

const expectedStructure = [
    { name: 'MAIN', level: '01', expectedLength: 9099 },
    { name: 'A-GROUP', level: '05', expectedLength: 5588 },
    { name: 'AA-VAR', level: '10', expectedLength: 5588 },
    { name: 'B-GROUP', level: '05', expectedLength: 3510 },
    { name: 'BB-VAR', level: '10', expectedLength: 3510 },
    // FILLER with REDEFINES should not appear or should have length 0
    { name: 'EMP-STATUS', level: '05', expectedLength: 1 },
];

let passed = 0;
let failed = 0;

console.log('Parsed Variables:\n');
variables.forEach((v, idx) => {
    console.log(`${idx}: ${v.level} ${v.name.padEnd(20)} Pos: ${String(v.position).padStart(5)} Len: ${String(v.length).padStart(6)}${v.isRedefines ? ' [REDEFINES]' : ''}`);
});

console.log('\n=====================================\n');
console.log('Validation:\n');

// Special check for MAIN
const mainVar = variables.find(v => v.name === 'MAIN' && v.level === '01');
if (mainVar) {
    if (mainVar.length === 9099) {
        console.log(`✓ PASS: MAIN has correct total length: ${mainVar.length} bytes`);
        passed++;
    } else {
        console.log(`✗ FAIL: MAIN length should be 9,099 but got ${mainVar.length}`);
        console.log(`   Difference: ${mainVar.length - 9099} bytes (REDEFINES group counted incorrectly)`);
        failed++;
    }
} else {
    console.log(`✗ FAIL: MAIN variable not found`);
    failed++;
}

console.log();

// Check other variables
expectedStructure.forEach(expected => {
    const found = variables.find(v => v.name === expected.name && v.level === expected.level);

    if (!found) {
        console.log(`⚠ INFO: ${expected.level} ${expected.name} - Not found (may be inside REDEFINES)`);
        return;
    }

    if (found.length === expected.expectedLength) {
        console.log(`✓ PASS: ${expected.level} ${expected.name.padEnd(20)} Length: ${String(found.length).padStart(6)}`);
        passed++;
    } else {
        console.log(`✗ FAIL: ${expected.level} ${expected.name}`);
        console.log(`       Expected: ${expected.expectedLength}, Got: ${found.length}`);
        failed++;
    }
});

console.log('\n=====================================');
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    console.log('🐛 BUG DETECTED: REDEFINES groups are still being counted in parent totals!');
    process.exit(1);
} else {
    console.log('✅ REDEFINES bug fix SUCCESSFUL!');
}
