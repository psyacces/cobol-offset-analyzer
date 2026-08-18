'use strict';

/**
 * Source-layout cases taken from how production copybooks are actually written.
 *
 * Everything here failed at some point against a file that the hand-written
 * fixtures in the other suites did not resemble: sequence numbers in columns
 * 1-6, lines holding nothing but a sequence number, INDEXED BY phrases carrying
 * user names, and statements pushed past column 72.
 */

const { parseRaw, Results } = require('./harness');

function run() {
    const r = new Results('Real-world source layout');

    // ------------------------------------------- sequence numbers in cols 1-6
    // A line holding only a sequence number is blank. Treating it as code makes
    // it buffer and swallow the statement that follows, which silently removed
    // every 01 group from files written this way.
    {
        const vars = parseRaw([
            '000100 IDENTIFICATION DIVISION.',
            '000200 PROGRAM-ID. SEQTEST.',
            '000300 DATA DIVISION.',
            '000400 WORKING-STORAGE SECTION.',
            '000500',
            '000600 01  WS-ACCOUNT-RECORD.',
            '000700     05  WS-ACCT-NBR             PIC 9(10).',
            '000800     05  WS-ACCT-BAL             PIC S9(13)V99 COMP-3.',
            '000900     05  WS-ACCT-CNT             PIC S9(4)     COMP.',
            '001000     05  WS-ACCT-NAME            PIC X(30).',
            '001100',
            '001200 01  WS-SECOND-RECORD.',
            '001300     05  WS-SEC-A                PIC 9(4).',
            '001400     05  WS-SEC-B                PIC X(6).',
            '001500',
            '001600 PROCEDURE DIVISION.',
            '001700     STOP RUN.'
        ].join('\n'));

        // The 01 rows must exist — this is what disappeared.
        r.checkVar(vars, 'WS-ACCOUNT-RECORD', 1, 50);   // 10 + 8 + 2 + 30
        r.checkVar(vars, 'WS-ACCT-NBR', 1, 10);
        r.checkVar(vars, 'WS-ACCT-BAL', 11, 8);         // 15 digits -> 8 bytes
        r.checkVar(vars, 'WS-ACCT-CNT', 19, 2);
        r.checkVar(vars, 'WS-ACCT-NAME', 21, 30);

        // A following 01 must restart the cursor at byte 1.
        r.checkVar(vars, 'WS-SECOND-RECORD', 1, 10);
        r.checkVar(vars, 'WS-SEC-A', 1, 4);
        r.checkVar(vars, 'WS-SEC-B', 5, 6);

        r.checkAllPresent(vars, [
            'WS-ACCOUNT-RECORD', 'WS-ACCT-NBR', 'WS-ACCT-BAL', 'WS-ACCT-CNT',
            'WS-ACCT-NAME', 'WS-SECOND-RECORD', 'WS-SEC-A', 'WS-SEC-B'
        ]);
    }

    // --------------------------------------- INDEXED BY carries a user name
    // `\bINDEX\b` matches inside WS-INDEX, which turned the group into a
    // four-byte INDEX item and orphaned all of its children.
    {
        const vars = parseRaw([
            '000100 01  WS-TABLE-AREA.',
            '000200     05  WS-ENTRY-TAB OCCURS 10 TIMES',
            '000300                      INDEXED BY WS-INDEX.',
            '000400         10  WS-ENT-CODE         PIC X(4).',
            '000500         10  WS-ENT-AMT          PIC S9(7)V99 COMP-3.',
            '000600     05  WS-TAB-COUNT            PIC 9(3).'
        ].join('\n'));

        r.checkVar(vars, 'WS-ENT-CODE', 1, 4);
        r.checkVar(vars, 'WS-ENT-AMT', 5, 5);
        r.checkVar(vars, 'WS-ENTRY-TAB', 1, 90, { type: 'Group/Structure' }); // 10 * 9
        r.checkVar(vars, 'WS-TAB-COUNT', 91, 3);
        r.checkVar(vars, 'WS-TABLE-AREA', 1, 93);
    }

    // ------------------- other clause operands must not imply a usage either
    {
        const vars = parseRaw([
            '000100 01  WS-OPERANDS.',
            '000200     05  WS-N                    PIC 9(2).',
            '000300     05  WS-T1 OCCURS 3 TIMES INDEXED BY COMP-IDX.',
            '000400         10  WS-T1-A             PIC X(5).',
            '000500     05  WS-T2 OCCURS 1 TO 4 TIMES DEPENDING ON WS-N',
            '000600                      INDEXED BY BINARY-IDX.',
            '000700         10  WS-T2-A             PIC X(2).',
            '000800     05  WS-TAIL                 PIC X(1).'
        ].join('\n'));

        r.checkVar(vars, 'WS-N', 1, 2);
        r.checkVar(vars, 'WS-T1', 3, 15, { type: 'Group/Structure' });
        r.checkVar(vars, 'WS-T2', 18, 8, { type: 'Group/Structure' });
        r.checkVar(vars, 'WS-TAIL', 26, 1);
        r.checkVar(vars, 'WS-OPERANDS', 1, 26);
    }

    // ------------------------------------------------ SIGN IS ... SEPARATE
    // A separate sign is stored in a byte of its own.
    {
        const vars = parseRaw([
            '000100 01  WS-SIGNS.',
            '000200     05  WS-A  PIC S9(5) SIGN IS LEADING SEPARATE.',
            '000300     05  WS-B  PIC S9(5) SIGN IS TRAILING SEPARATE.',
            '000400     05  WS-C  PIC S9(5).',
            '000500     05  WS-D  PIC S9(5) SIGN IS LEADING.'
        ].join('\n'));

        r.checkVar(vars, 'WS-A', 1, 6);
        r.checkVar(vars, 'WS-B', 7, 6);
        r.checkVar(vars, 'WS-C', 13, 5);   // overpunched sign: no extra byte
        r.checkVar(vars, 'WS-D', 18, 5);   // not SEPARATE: no extra byte
        r.checkVar(vars, 'WS-SIGNS', 1, 22);
    }

    // ------------------------------- a statement pushed past column 72
    // Columns 73-80 are the identification area, so an overrun loses the
    // terminating period. The following entry must still be recovered rather
    // than being absorbed into the unterminated one.
    {
        const overflow =
            '000200     05  WS-ERR-CNT              PIC S9(5) SIGN IS LEADING SEPARATE.';
        r.check('fixture really overflows column 72', overflow.length > 72, true);

        const vars = parseRaw([
            '000100 01  WS-COUNTERS.',
            overflow,
            '000300 01  WS-FLAGS.',
            '000400     05  WS-EOF-FLAG             PIC X.',
            '000500     05  WS-AMT-EDIT             PIC ZZZ,ZZ9.99.'
        ].join('\n'));

        // WS-FLAGS is the entry that used to vanish.
        r.checkVar(vars, 'WS-FLAGS', 1, 11);
        r.checkVar(vars, 'WS-EOF-FLAG', 1, 1);
        r.checkVar(vars, 'WS-AMT-EDIT', 2, 10);
        r.checkAllPresent(vars, ['WS-COUNTERS', 'WS-ERR-CNT', 'WS-FLAGS', 'WS-EOF-FLAG', 'WS-AMT-EDIT']);
    }

    // ------------- a genuine continuation starting with digits is not split
    // `OCCURS` at the end of a line means the next line's `10 TIMES` is its
    // operand, not a new level-10 item.
    {
        const vars = parseRaw([
            '000100 01  WS-CONT.',
            '000200     05  WS-TAB OCCURS',
            '000300              10 TIMES.',
            '000400         10  WS-TAB-A            PIC X(3).',
            '000500     05  WS-AFTER                PIC X(2).'
        ].join('\n'));

        r.checkVar(vars, 'WS-TAB', 1, 30, { type: 'Group/Structure' });
        r.checkVar(vars, 'WS-TAB-A', 1, 3);
        r.checkVar(vars, 'WS-AFTER', 31, 2);
        r.checkVar(vars, 'WS-CONT', 1, 32);
        r.check('TIMES not read as a data item', vars.some(v => v.name === 'TIMES'), false);
    }

    // ---------------------------------------- comment lines in column 7
    {
        const vars = parseRaw([
            '000100 01  WS-COMMENTED.',
            '000200*    05  WS-HIDDEN               PIC X(99).',
            '000300     05  WS-REAL                 PIC X(4).',
            '000400*> inline style comment line',
            '000500     05  WS-REAL2                PIC X(6).'
        ].join('\n'));

        r.check('commented-out field ignored', vars.some(v => v.name === 'WS-HIDDEN'), false);
        r.checkVar(vars, 'WS-REAL', 1, 4);
        r.checkVar(vars, 'WS-REAL2', 5, 6);
        r.checkVar(vars, 'WS-COMMENTED', 1, 10);
    }

    // -------------------------------------------- free-format source, column 1
    {
        const vars = parseRaw([
            '01 WS-FREE.',
            '   05 WS-F-A PIC 9(4).',
            '   05 WS-F-B PIC X(8).',
            '   05 WS-F-C PIC S9(7)V99 COMP-3.'
        ].join('\n'));

        r.checkVar(vars, 'WS-F-A', 1, 4);
        r.checkVar(vars, 'WS-F-B', 5, 8);
        r.checkVar(vars, 'WS-F-C', 13, 5);
        r.checkVar(vars, 'WS-FREE', 1, 17);
    }

    // ------------------------------------------------- lowercase source text
    {
        const vars = parseRaw([
            '       01 maingroup.',
            '          05 subgroup1.',
            '              10 ws-var1 pic x(40).',
            '          05 filler redefines subgroup1.',
            '               10 ws-var2 pic x(20).',
            '          05 subgroup2.',
            '               10 ws-var6 pic x(10).',
            '          05 ws-var5 pic x(05).'
        ].join('\n'));

        r.checkVar(vars, 'SUBGROUP1', 1, 40);
        r.checkVar(vars, 'FILLER', 1, 20, { redefines: true });
        r.checkVar(vars, 'SUBGROUP2', 41, 10);
        r.checkVar(vars, 'WS-VAR5', 51, 5);
        r.checkVar(vars, 'MAINGROUP', 1, 55);
    }

    // --------------- every entry in a realistic record must be hoverable
    {
        const vars = parseRaw([
            '000100 01  WS-MIXED-RECORD.',
            '000200     05  WS-KEY.',
            '000300         10  WS-KEY-PRE          PIC X(3).',
            '000400         10  WS-KEY-NUM          PIC 9(9).',
            '000500     05  WS-AMOUNTS.',
            '000600         10  WS-GROSS            PIC S9(9)V99 COMP-3.',
            '000700         10  WS-NET              PIC S9(9)V99 COMP-3.',
            '000800     05  WS-COUNTS.',
            '000900         10  WS-QTY              PIC S9(4)    COMP.',
            '001000         10  WS-SEQ              PIC S9(9)    COMP.',
            '001100     05  WS-TEXT                 PIC X(20).'
        ].join('\n'));

        r.checkVar(vars, 'WS-KEY-PRE', 1, 3);
        r.checkVar(vars, 'WS-KEY-NUM', 4, 9);
        r.checkVar(vars, 'WS-KEY', 1, 12);
        r.checkVar(vars, 'WS-GROSS', 13, 6);      // 11 digits -> 6 bytes
        r.checkVar(vars, 'WS-NET', 19, 6);
        r.checkVar(vars, 'WS-AMOUNTS', 13, 12);
        r.checkVar(vars, 'WS-QTY', 25, 2);
        r.checkVar(vars, 'WS-SEQ', 27, 4);
        r.checkVar(vars, 'WS-COUNTS', 25, 6);
        r.checkVar(vars, 'WS-TEXT', 31, 20);
        r.checkVar(vars, 'WS-MIXED-RECORD', 1, 50);

        r.checkAllPresent(vars, [
            'WS-MIXED-RECORD', 'WS-KEY', 'WS-KEY-PRE', 'WS-KEY-NUM',
            'WS-AMOUNTS', 'WS-GROSS', 'WS-NET',
            'WS-COUNTS', 'WS-QTY', 'WS-SEQ', 'WS-TEXT'
        ]);
    }

    return r;
}

module.exports = { run };
