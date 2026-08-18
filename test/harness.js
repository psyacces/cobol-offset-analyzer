'use strict';

/**
 * Shared test harness.
 *
 * Suites declare COBOL source plus the exact rows they expect. Every expectation
 * is written by hand from IBM Enterprise COBOL storage rules, never copied back
 * out of parser output.
 */

const { CobolParser } = require('../out/cobolParser');

const COL8 = '       '; // columns 1-7 blank, code area starts at column 8

/** Indents bare COBOL text into fixed-format columns 8-72. */
function fixed(source) {
    return source
        .split('\n')
        .map(line => (line.trim() === '' ? '' : COL8 + line))
        .join('\n')
        .split('\n');
}

function parse(source) {
    return new CobolParser().parse(fixed(source));
}

class Results {
    constructor(name) {
        this.name = name;
        this.passed = 0;
        this.failed = 0;
        this.failures = [];
    }

    check(label, actual, expected) {
        if (actual === expected) {
            this.passed++;
            return true;
        }
        this.failed++;
        this.failures.push(`${label}: expected ${expected}, got ${actual}`);
        return false;
    }

    /** Asserts position and length for one named variable. */
    checkVar(vars, name, expectedPos, expectedLen, opts = {}) {
        const matches = vars.filter(v => v.name === name &&
            (opts.level === undefined || v.level === opts.level) &&
            (opts.redefines === undefined || v.isRedefines === opts.redefines));

        if (matches.length === 0) {
            this.failed++;
            this.failures.push(`${name}: NOT FOUND (no hover would be shown)`);
            return;
        }
        const v = opts.index !== undefined ? matches[opts.index] : matches[0];

        this.check(`${name}.position`, v.position, expectedPos);
        this.check(`${name}.length`, v.length, expectedLen);
        if (opts.type !== undefined) this.check(`${name}.dataType`, v.dataType, opts.type);
        if (opts.line !== undefined) this.check(`${name}.line`, v.line + 1, opts.line);
    }

    /** Asserts that every listed name produced a row (i.e. hover works). */
    checkAllPresent(vars, names) {
        const present = new Set(vars.map(v => v.name));
        for (const n of names) {
            if (present.has(n)) {
                this.passed++;
            } else {
                this.failed++;
                this.failures.push(`${n}: NOT FOUND (nested variable missing from hover)`);
            }
        }
    }

    report() {
        const status = this.failed === 0 ? 'PASS' : 'FAIL';
        const icon = this.failed === 0 ? '✅' : '❌';
        console.log(`${icon} ${status}  ${this.name}  (${this.passed} assertions${this.failed ? `, ${this.failed} FAILED` : ''})`);
        for (const f of this.failures) {
            console.log(`        - ${f}`);
        }
        return this.failed === 0;
    }
}

/** Prints a parse as a table — used by the dump helper for eyeballing. */
function dump(vars) {
    console.log('  line lvl name                      pos    len  type');
    for (const v of vars) {
        console.log(
            '  ' + String(v.line + 1).padStart(4),
            v.level,
            v.name.padEnd(24),
            String(v.position).padStart(5),
            String(v.length).padStart(6),
            v.dataType + (v.isRedefines ? ' [REDEFINES]' : '') + (v.isOccurs ? ` [OCCURS ${v.occursCount}]` : '')
        );
    }
}

module.exports = { CobolParser, parse, fixed, Results, dump };
