// Test script to verify COBOL structure parsing
const CobolParser = require('./out/cobolParser').CobolParser;
const fs = require('fs');

const testFile = './sample.cbl';
const lines = fs.readFileSync(testFile, 'utf-8').split('\n');

const parser = new CobolParser();
const variables = parser.parse(lines);

console.log('Testing COBOL Structure Parsing:\n');
console.log('=====================================\n');

// Expected structure:
// 01  EMPLOYEE-RECORD            Position: 1, Length: 49
//   05  EMP-ID                   Position: 1, Length: 5
//   05  EMP-NAME                 Position: 6, Length: 30
//   05  EMP-SALARY COMP-3        Position: 36, Length: 5
//   05  EMP-HIRE-DATE            Position: 41, Length: 8
//     10  EMP-HIRE-YEAR          Position: 41, Length: 4
//     10  EMP-HIRE-MONTH         Position: 45, Length: 2
//     10  EMP-HIRE-DAY           Position: 47, Length: 2
//   05  EMP-STATUS               Position: 49, Length: 1

const expectedStructure = [
    { name: 'EMPLOYEE-RECORD', level: '01', position: 1, length: 49 },
    { name: 'EMP-ID', level: '05', position: 1, length: 5 },
    { name: 'EMP-NAME', level: '05', position: 6, length: 30 },
    { name: 'EMP-SALARY', level: '05', position: 36, length: 5 },
    { name: 'EMP-HIRE-DATE', level: '05', position: 41, length: 8 },
    { name: 'EMP-HIRE-YEAR', level: '10', position: 41, length: 4 },
    { name: 'EMP-HIRE-MONTH', level: '10', position: 45, length: 2 },
    { name: 'EMP-HIRE-DAY', level: '10', position: 47, length: 2 },
    { name: 'EMP-STATUS', level: '05', position: 49, length: 1 },
];

let passed = 0;
let failed = 0;

console.log('Parsed Variables:\n');
variables.forEach((v, idx) => {
    console.log(`${idx}: ${v.level} ${v.name.padEnd(20)} Pos: ${String(v.position).padStart(3)} Len: ${String(v.length).padStart(3)}`);
});

console.log('\n=====================================\n');
console.log('Validation:\n');

expectedStructure.forEach(expected => {
    const found = variables.find(v => v.name === expected.name && v.level === expected.level);

    if (!found) {
        console.log(`✗ FAIL: ${expected.level} ${expected.name} - NOT FOUND`);
        failed++;
        return;
    }

    const posMatch = found.position === expected.position;
    const lenMatch = found.length === expected.length;

    if (posMatch && lenMatch) {
        console.log(`✓ PASS: ${expected.level} ${expected.name.padEnd(20)} Pos: ${String(found.position).padStart(3)}, Len: ${String(found.length).padStart(3)}`);
        passed++;
    } else {
        console.log(`✗ FAIL: ${expected.level} ${expected.name}`);
        if (!posMatch) {
            console.log(`       Position - Expected: ${expected.position}, Got: ${found.position}`);
        }
        if (!lenMatch) {
            console.log(`       Length   - Expected: ${expected.length}, Got: ${found.length}`);
        }
        failed++;
    }
});

console.log('\n=====================================');
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
}
