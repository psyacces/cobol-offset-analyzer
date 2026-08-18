export interface ParsedVariable {
    /** 0-based line where the level number / name appears (start of the statement). */
    line: number;
    /** 0-based line where the statement's terminating period appears. */
    endLine: number;
    level: string;
    name: string;
    position: number;
    length: number;
    hasPic: boolean;
    isOccurs: boolean;
    isRedefines: boolean;
    isSynchronized: boolean;
    isComp: boolean;
    isComp3: boolean;
    rawLine: string;
    dataType: string;
    picture: string;
    usage: Usage;
    occursCount: number;
    redefinesTarget: string;
}

export type Usage =
    | 'DISPLAY'
    | 'BINARY'
    | 'PACKED'
    | 'COMP-1'
    | 'COMP-2'
    | 'INDEX'
    | 'POINTER'
    | 'NATIONAL';

interface Frame {
    level: number;
    name: string;
    startLine: number;
    endLine: number;
    position: number;
    /** Bytes contributed by direct children (one OCCURS iteration). */
    length: number;
    isRedefines: boolean;
    isOccurs: boolean;
    isSynchronized: boolean;
    occurs: number;
    /** Position to restore when a REDEFINES frame closes. */
    savedPos: number;
    redefinesTarget: string;
    rawLine: string;
}

/** Result of decoding a PICTURE character-string. */
export interface PictureInfo {
    /** Bytes the picture occupies under USAGE DISPLAY. */
    displayBytes: number;
    /** Digit positions (9, Z, *, P and friends) — drives COMP / COMP-3 sizing. */
    digits: number;
    signed: boolean;
    hasDecimal: boolean;
    category: 'numeric' | 'numeric-edited' | 'alphanumeric' | 'alphabetic' | 'national';
}

export class CobolParser {
    private pos = 1;
    private stack: Frame[] = [];
    private results: ParsedVariable[] = [];
    /** name -> position, for resolving REDEFINES targets by name. */
    private namePos = new Map<string, number>();
    /** level -> position of the most recent item at that level (REDEFINES fallback). */
    private levelPos = new Map<number, number>();

    public parse(cobolLines: string[]): ParsedVariable[] {
        this.pos = 1;
        this.stack = [];
        this.results = [];
        this.namePos.clear();
        this.levelPos.clear();

        let buffer = '';
        let startLine = -1;

        for (let lineNum = 0; lineNum < cobolLines.length; lineNum++) {
            const text = this.cleanLine(cobolLines[lineNum]);
            if (text === '') continue;

            const upper = text.toUpperCase();
            if (upper.startsWith('PROCEDURE DIVISION')) break;
            if (upper === 'EJECT' || upper === 'EJECT.' || upper.startsWith('SKIP') || upper.startsWith('++INCLUDE')) {
                continue;
            }

            if (startLine < 0) startLine = lineNum;

            if (text.endsWith('.')) {
                this.processEntry(buffer + text.substring(0, text.length - 1), startLine, lineNum);
                buffer = '';
                startLine = -1;
            } else {
                buffer += text + ' ';
            }
        }

        // Flush an unterminated trailing statement, then close every open group.
        if (buffer.trim() !== '' && startLine >= 0) {
            this.processEntry(buffer, startLine, cobolLines.length - 1);
        }
        this.closeFramesDownTo(0);

        // Emit in source order so hover lookup and test output are both predictable.
        this.results.sort((a, b) => a.line - b.line || a.level.localeCompare(b.level));
        return this.results;
    }

    // ---------------------------------------------------------------- lines

    private cleanLine(line: string): string {
        if (!line) return '';
        if (line.substring(0, 2) === '++') return '';
        if (line.substring(2, 7) === 'DUMMY') return '';

        // Fixed-format comment / continuation indicator in column 7.
        if (line.length >= 7) {
            const indicator = line[6];
            if (indicator === '*' || indicator === '/') return '';
        }
        if (line.trimStart().startsWith('*')) return '';

        // Columns 8-72 hold the code area in fixed format; fall back to the whole
        // line for free-format sources that start in column 1.
        let body = line.length >= 8 ? line.substring(7, 72) : line;
        if (body.trim() === '' && line.trim() !== '') body = line;

        let text = body.trim();
        const inlineComment = text.indexOf('*>');
        if (inlineComment >= 0) text = text.substring(0, inlineComment).trim();

        return text;
    }

    // ------------------------------------------------------------- entries

    private processEntry(data: string, startLine: number, endLine: number): void {
        data = data.replace(/\s+/g, ' ').trim();

        const levelMatch = data.match(/^(\d{1,2})(?:\s|$)/);
        if (!levelMatch) return;

        let levelNum = parseInt(levelMatch[1], 10);
        // 88 (condition names) and 66 (RENAMES) occupy no storage of their own.
        if (levelNum === 88 || levelNum === 66) return;
        // 77 is an independent elementary item — behaves like an 01.
        if (levelNum === 77) levelNum = 1;
        if (levelNum < 1 || levelNum > 49) return;

        const tokens = data.split(' ');
        const name = tokens.length > 1 ? tokens[1].toUpperCase() : 'FILLER';
        // Clause text excludes level and name, so a variable called WS-COMP-FLAG
        // can never be mistaken for USAGE COMPUTATIONAL.
        const clauses = tokens.slice(2).join(' ').toUpperCase();

        this.closeFramesDownTo(levelNum);

        if (levelNum === 1) this.pos = 1;

        const redefinesMatch = clauses.match(/\bREDEFINES\s+([A-Z0-9$#@-]+)/);
        const isRedefines = redefinesMatch !== null;
        const redefinesTarget = redefinesMatch ? redefinesMatch[1] : '';

        const savedPos = this.pos;
        if (isRedefines) {
            this.pos = this.resolveRedefinesPosition(redefinesTarget, levelNum);
        }

        const occursMatch = clauses.match(/\bOCCURS\s+(\d+)(?:\s+TO\s+(\d+))?/);
        const isOccurs = occursMatch !== null;
        // For OCCURS n TO m DEPENDING ON, size the layout with the maximum.
        const occurs = occursMatch ? parseInt(occursMatch[2] ?? occursMatch[1], 10) : 1;

        const isSynchronized = /\b(SYNCHRONIZED|SYNC)\b/.test(clauses);
        const usage = this.detectUsage(clauses);

        const picMatch = clauses.match(/\b(?:PIC|PICTURE)\b(?:\s+IS\b)?\s+(\S+)/);
        const picture = picMatch ? picMatch[1] : '';
        const hasPic = picture !== '';

        this.namePos.set(name, this.pos);
        this.levelPos.set(levelNum, this.pos);

        if (hasPic || this.isElementaryWithoutPic(usage)) {
            const pic = this.parsePicture(picture);
            let len = this.elementarySize(pic, usage);

            if (isSynchronized) this.pos = this.alignFor(this.pos, len, usage);
            // Position may have moved for alignment — re-record it.
            this.namePos.set(name, this.pos);
            this.levelPos.set(levelNum, this.pos);

            const total = len * occurs;

            this.results.push({
                line: startLine,
                endLine,
                level: this.pad2(levelNum),
                name,
                position: this.pos,
                length: total,
                hasPic,
                isOccurs,
                isRedefines,
                isSynchronized,
                isComp: usage === 'BINARY',
                isComp3: usage === 'PACKED',
                rawLine: data,
                dataType: this.describeType(pic, usage, false, isRedefines),
                picture,
                usage,
                occursCount: occurs,
                redefinesTarget
            });

            if (isRedefines) {
                // Shares storage with its target: contributes nothing, and the
                // cursor goes back to where the redefined item ended.
                this.pos = savedPos;
            } else {
                this.addToParent(total);
                this.pos += total;
            }
            return;
        }

        // Group item — its size is the sum of its children, resolved on close.
        this.stack.push({
            level: levelNum,
            name,
            startLine,
            endLine,
            position: this.pos,
            length: 0,
            isRedefines,
            isOccurs,
            isSynchronized,
            occurs,
            savedPos,
            redefinesTarget,
            rawLine: data
        });
    }

    /**
     * Pops every open group at or below `levelNum`, rolling each one's size into
     * its parent. A REDEFINES group rolls up nothing and rewinds the cursor to
     * the byte after the item it redefines.
     */
    private closeFramesDownTo(levelNum: number): void {
        while (this.stack.length > 0 && this.stack[this.stack.length - 1].level >= levelNum) {
            const frame = this.stack.pop()!;
            const total = frame.length * frame.occurs;

            this.results.push({
                line: frame.startLine,
                endLine: frame.endLine,
                level: this.pad2(frame.level),
                name: frame.name,
                position: frame.position,
                length: total,
                hasPic: false,
                isOccurs: frame.isOccurs,
                isRedefines: frame.isRedefines,
                isSynchronized: frame.isSynchronized,
                isComp: false,
                isComp3: false,
                rawLine: frame.rawLine,
                dataType: this.describeType(null, 'DISPLAY', true, frame.isRedefines),
                picture: '',
                usage: 'DISPLAY',
                occursCount: frame.occurs,
                redefinesTarget: frame.redefinesTarget
            });

            if (frame.isRedefines) {
                this.pos = frame.savedPos;
            } else {
                this.addToParent(total);
                // Re-seat the cursor: for an OCCURS group the children only walked
                // one iteration forward.
                this.pos = frame.position + total;
            }
        }
    }

    /** Only the immediate parent accumulates; sizes roll up one level at a time. */
    private addToParent(len: number): void {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].length += len;
        }
    }

    private resolveRedefinesPosition(target: string, levelNum: number): number {
        const byName = this.namePos.get(target);
        if (byName !== undefined) return byName;
        const byLevel = this.levelPos.get(levelNum);
        if (byLevel !== undefined) return byLevel;
        return this.pos;
    }

    // -------------------------------------------------------------- usage

    private detectUsage(clauses: string): Usage {
        if (/\b(COMP-3|COMPUTATIONAL-3|PACKED-DECIMAL)\b/.test(clauses)) return 'PACKED';
        if (/\b(COMP-1|COMPUTATIONAL-1)\b/.test(clauses)) return 'COMP-1';
        if (/\b(COMP-2|COMPUTATIONAL-2)\b/.test(clauses)) return 'COMP-2';
        if (/\b(COMP-5|COMPUTATIONAL-5|COMP-4|COMPUTATIONAL-4|BINARY|COMP|COMPUTATIONAL)\b/.test(clauses)) {
            return 'BINARY';
        }
        if (/\bINDEX\b/.test(clauses)) return 'INDEX';
        if (/\b(POINTER|PROCEDURE-POINTER|FUNCTION-POINTER)\b/.test(clauses)) return 'POINTER';
        if (/\bNATIONAL\b/.test(clauses)) return 'NATIONAL';
        return 'DISPLAY';
    }

    /** USAGE clauses that define storage on their own, with no PICTURE. */
    private isElementaryWithoutPic(usage: Usage): boolean {
        return usage === 'COMP-1' || usage === 'COMP-2' || usage === 'INDEX' || usage === 'POINTER';
    }

    private elementarySize(pic: PictureInfo, usage: Usage): number {
        switch (usage) {
            case 'COMP-1':
                return 4;
            case 'COMP-2':
                return 8;
            case 'INDEX':
            case 'POINTER':
                return 4;
            case 'PACKED':
                // Packed decimal: two digits per byte plus a nibble for the sign.
                return Math.floor(pic.digits / 2) + 1;
            case 'BINARY':
                return this.binarySize(pic.digits);
            case 'NATIONAL':
                return pic.displayBytes * 2;
            default:
                return pic.displayBytes;
        }
    }

    /** IBM COMP sizing: halfword / fullword / doubleword by digit count. */
    private binarySize(digits: number): number {
        if (digits <= 0) return 0;
        if (digits <= 4) return 2;
        if (digits <= 9) return 4;
        if (digits <= 18) return 8;
        return 16;
    }

    private alignFor(pos: number, len: number, usage: Usage): number {
        let boundary = 1;
        if (usage === 'BINARY' || usage === 'COMP-1' || usage === 'COMP-2' ||
            usage === 'INDEX' || usage === 'POINTER') {
            boundary = len >= 8 ? 8 : len >= 4 ? 4 : 2;
        }
        if (boundary <= 1) return pos;

        const offset = pos - 1;
        const slack = offset % boundary;
        return slack === 0 ? pos : pos + (boundary - slack);
    }

    // ------------------------------------------------------------ picture

    /**
     * Decodes a PICTURE character-string into byte count and digit count.
     * Handles repetition factors, insertion editing, floating sign/currency,
     * implied decimals (V), scaling (P) and CR/DB.
     */
    public parsePicture(rawPic: string): PictureInfo {
        const info: PictureInfo = {
            displayBytes: 0,
            digits: 0,
            signed: false,
            hasDecimal: false,
            category: 'alphanumeric'
        };
        if (!rawPic) return info;

        const pic = rawPic.trim().toUpperCase();
        let sawNumericSymbol = false;
        let sawEditSymbol = false;
        let sawAlpha = false;
        let sawAlphabetic = false;
        let sawNational = false;

        let i = 0;
        while (i < pic.length) {
            // CR / DB are two-character credit/debit symbols worth 2 bytes.
            const pair = pic.substring(i, i + 2);
            if (pair === 'CR' || pair === 'DB') {
                info.displayBytes += 2;
                sawEditSymbol = true;
                i += 2;
                continue;
            }

            const symbol = pic[i];
            i++;

            // A repetition factor in parentheses, e.g. 9(5).
            let count = 1;
            if (pic[i] === '(') {
                const close = pic.indexOf(')', i);
                if (close > i) {
                    const parsed = parseInt(pic.substring(i + 1, close), 10);
                    if (!isNaN(parsed)) count = parsed;
                    i = close + 1;
                }
            }

            switch (symbol) {
                case 'S':
                    // Sign is overpunched on a digit: no storage of its own.
                    info.signed = true;
                    sawNumericSymbol = true;
                    break;
                case 'V':
                    // Implied decimal point: no storage.
                    info.hasDecimal = true;
                    sawNumericSymbol = true;
                    break;
                case 'P':
                    // Scaling position: counts as a digit, occupies no byte.
                    info.digits += count;
                    sawNumericSymbol = true;
                    break;
                case '9':
                    info.displayBytes += count;
                    info.digits += count;
                    sawNumericSymbol = true;
                    break;
                case 'Z':
                case '*':
                    info.displayBytes += count;
                    info.digits += count;
                    sawEditSymbol = true;
                    break;
                case 'X':
                    info.displayBytes += count;
                    sawAlpha = true;
                    break;
                case 'A':
                    info.displayBytes += count;
                    sawAlphabetic = true;
                    break;
                case 'N':
                    // National / DBCS: two bytes per character position.
                    info.displayBytes += count * 2;
                    sawNational = true;
                    break;
                case 'G':
                    info.displayBytes += count * 2;
                    sawNational = true;
                    break;
                case 'B':
                case '0':
                case '/':
                case ',':
                    info.displayBytes += count;
                    sawEditSymbol = true;
                    break;
                case '.':
                    info.displayBytes += count;
                    info.hasDecimal = true;
                    sawEditSymbol = true;
                    break;
                case '+':
                case '-':
                case '$':
                    // Fixed or floating insertion: one byte per symbol written.
                    info.displayBytes += count;
                    info.signed = symbol !== '$';
                    sawEditSymbol = true;
                    break;
                case 'E':
                    info.displayBytes += count;
                    sawEditSymbol = true;
                    break;
                default:
                    break;
            }
        }

        if (sawNational) info.category = 'national';
        else if (sawAlpha) info.category = 'alphanumeric';
        else if (sawAlphabetic) info.category = 'alphabetic';
        else if (sawEditSymbol) info.category = 'numeric-edited';
        else if (sawNumericSymbol) info.category = 'numeric';

        return info;
    }

    /** Kept public for the unit tests: bytes a picture occupies under DISPLAY. */
    public calculatePicLength(pic: string): number {
        return this.parsePicture(pic).displayBytes;
    }

    /** Kept public for the unit tests: digit positions in a picture. */
    public calculatePicDigits(pic: string): number {
        return this.parsePicture(pic).digits;
    }

    // --------------------------------------------------------------- types

    private describeType(
        pic: PictureInfo | null,
        usage: Usage,
        isGroup: boolean,
        isRedefines: boolean
    ): string {
        if (isGroup) {
            return isRedefines ? 'Group/Structure (REDEFINES)' : 'Group/Structure';
        }

        switch (usage) {
            case 'PACKED':
                return 'COMP-3 (Packed Decimal)';
            case 'BINARY':
                return 'COMP (Binary)';
            case 'COMP-1':
                return 'COMP-1 (Single-Precision Float)';
            case 'COMP-2':
                return 'COMP-2 (Double-Precision Float)';
            case 'INDEX':
                return 'INDEX';
            case 'POINTER':
                return 'POINTER';
            case 'NATIONAL':
                return 'National (DBCS)';
        }

        if (!pic) return 'Alphanumeric';

        switch (pic.category) {
            case 'numeric':
                if (pic.hasDecimal) return pic.signed ? 'Signed Numeric with Decimal' : 'Numeric with Decimal';
                return pic.signed ? 'Signed Numeric' : 'Numeric';
            case 'numeric-edited':
                return 'Numeric Edited';
            case 'alphabetic':
                return 'Alphabetic';
            case 'national':
                return 'National (DBCS)';
            default:
                return 'Alphanumeric';
        }
    }

    private pad2(n: number): string {
        return n < 10 ? '0' + n : String(n);
    }
}
