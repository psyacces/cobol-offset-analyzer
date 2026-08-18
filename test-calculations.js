// Test script to verify PIC calculations
const CobolParser = require('./out/cobolParser').CobolParser;

const testCases = [
    { pic: '9(5)', expected: 5, description: 'Simple numeric 5 digits' },
    { pic: '9(10)', expected: 10, description: 'Numeric 10 digits' },
    { pic: 'X(20)', expected: 20, description: 'Alphanumeric 20 chars' },
    { pic: 'X(15)', expected: 15, description: 'Alphanumeric 15 chars' },
    { pic: 'X', expected: 1, description: 'Single alphanumeric' },
    { pic: 'S9(5)', expected: 5, description: 'Signed numeric 5 digits' },
    { pic: 'S9(8)', expected: 8, description: 'Signed numeric 8 digits' },
    { pic: '9(5)V99', expected: 7, description: 'Numeric with decimal (5 integer + 2 decimal)' },
    { pic: 'S9(4)V999', expected: 7, description: 'Signed numeric with decimal (4 integer + 3 decimal)' },
];

console.log('Testing PIC clause length calculations:\n');
console.log('=====================================\n');

let passed = 0;
let failed = 0;

testCases.forEach(test => {
    const parser = new CobolParser();
    const result = parser.calculatePicLength(test.pic);
    const isCorrect = result === test.expected;

    const status = isCorrect ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: PIC ${test.pic}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Expected: ${test.expected}, Got: ${result}`);

    if (isCorrect) {
        passed++;
    } else {
        failed++;
    }
    console.log();
});

console.log('=====================================');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
}
