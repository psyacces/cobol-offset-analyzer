export interface ParsedVariable {
    line: number;
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
}

interface GroupInfo {
    level: string;
    position: number;
    length: number;
    line: number;
    name: string;
    isRedefines?: boolean;
}

export class CobolParser {
    private pos: number = 1;
    private plv: string = '00';
    private occ: number = 0;
    private red: number = 0;
    private sync: boolean = false;
    private slv: string = '00';

    private lposMap: Map<string, number> = new Map();
    private groupStack: GroupInfo[] = [];
    private results: ParsedVariable[] = [];
    private olevArray: string[] = [];
    private onumArray: number[] = [];
    private rlevArray: string[] = [];
    private rposArray: number[] = [];

    public parse(cobolLines: string[]): ParsedVariable[] {
        const results: ParsedVariable[] = [];
        let data = '';
        this.pos = 1;
        this.plv = '00';
        this.lposMap.clear();
        this.groupStack = [];
        this.results = [];
        this.olevArray = [];
        this.onumArray = [];
        this.rlevArray = [];
        this.rposArray = [];

        for (let lineNum = 0; lineNum < cobolLines.length; lineNum++) {
            let datl = this.cleanLine(cobolLines[lineNum]);

            if (datl === '' || datl === 'EJECT' || datl.startsWith('SKIP') || datl.startsWith('++INCLUDE') || datl.startsWith('PROCEDURE')) {
                continue;
            }

            // Handle line continuation
            if (datl.endsWith('.')) {
                data += datl.substring(0, datl.length - 1);
                this.processLine(data, lineNum, results);
                data = '';
            } else {
                data += datl + ' ';
                continue;
            }
        }

        // Close all remaining groups
        this.closeGroupsUntil('00', results);

        return results;
    }

    private cleanLine(line: string): string {
        if (line.length < 8) return '';
        if (line.substring(0, 2) === '++') return '';
        if (line.substring(2, 7) === 'DUMMY') return '';
        if (line.substring(6, 7) === '*') return '';

        const cleaned = line.substring(7, 72).trim();
        return cleaned;
    }

    private processLine(data: string, lineNum: number, results: ParsedVariable[]): void {
        const level = this.extractLevel(data);
        if (!level) return;

        if (level === '88' || level === '66') return;

        let lev = level;
        if (level === '77') lev = '01';

        // Close groups that are deeper than current level
        this.closeGroupsUntil(lev, results);

        // Handle REDEFINES
        if (data.includes('REDEFINES')) {
            this.red++;
            this.rlevArray[this.red] = lev;
            this.rposArray[this.red] = this.pos;
            const redefinedPos = this.lposMap.get(lev);
            this.pos = (redefinedPos !== undefined) ? redefinedPos : 1;
        }

        // Handle OCCURS
        let occursCount = 1;
        if (data.includes('OCCURS')) {
            this.occ++;
            this.olevArray[this.occ] = lev;
            const occMatch = data.match(/OCCURS\s+(\d+)/);
            occursCount = occMatch ? parseInt(occMatch[1]) : 1;
            this.onumArray[this.occ] = occursCount;
        }

        if (lev === '01') {
            this.pos = 1;
        }

        // Handle SYNCHRONIZED
        const isSynchronized = data.includes('SYNCHRONIZED') || data.includes('SYNC');
        if (isSynchronized) {
            this.slv = lev;
            this.sync = true;
        }

        let len = 0;
        const hasPic = data.includes('PIC') || data.includes('PICTURE');
        const isComp = data.includes('COMP') && !data.includes('COMP-3');
        const isComp3 = data.includes('COMP-3') || data.includes('COMPUTATIONAL-3');

        if (hasPic) {
            const picMatch = data.match(/PIC\s+S?([X9A-Za-z()\d]+)/);
            if (picMatch) {
                len = this.calculatePicLength(picMatch[1]);

                if (isComp3) {
                    len = Math.floor(len / 2) + 1;
                } else if (isComp) {
                    len = (Math.floor((len + 3) / 4)) * 2;
                    if (this.sync && lev >= this.slv) {
                        if (len <= 4 && ((this.pos - 1) % 2) > 0) {
                            this.pos++;
                        } else if (len > 4 && ((this.pos - 1) % 4) > 0) {
                            this.pos += 4 - ((this.pos - 1) % 4);
                        }
                    }
                }

                // Apply OCCURS multiplier if at correct level
                if (this.olevArray[this.occ] === lev) {
                    len = len * occursCount;
                }
            }
        }

        this.lposMap.set(lev, this.pos);

        if (hasPic && len > 0) {
            // Field with PIC - add to results and update groups
            const picMatch = data.match(/PIC\s+S?([X9A-Za-z()\d]+)/);
            const dataType = this.determineDataType(picMatch ? picMatch[1] : '', isComp, isComp3);

            const result: ParsedVariable = {
                line: lineNum,
                level: lev,
                name: this.extractName(data),
                position: this.pos,
                length: len,
                hasPic: true,
                isOccurs: data.includes('OCCURS'),
                isRedefines: data.includes('REDEFINES'),
                isSynchronized: isSynchronized,
                isComp: isComp,
                isComp3: isComp3,
                rawLine: data,
                dataType: dataType
            };

            results.push(result);

            // Update parent group lengths ONLY if NOT REDEFINES
            // and if NOT inside a REDEFINES group
            // REDEFINES occupies same memory space, doesn't add bytes
            const isInsideRedefinesGroup = this.groupStack.some(g => g.isRedefines);

            if (!data.includes('REDEFINES') && !isInsideRedefinesGroup) {
                for (let i = 0; i < this.groupStack.length; i++) {
                    this.groupStack[i].length += len;
                }
                this.pos += len;
            }

            this.plv = lev;

        } else if (!hasPic) {
            // Group header (no PIC) - push to group stack
            const groupInfo: GroupInfo = {
                level: lev,
                position: this.pos,
                length: 0,
                line: lineNum,
                name: this.extractName(data),
                isRedefines: data.includes('REDEFINES')
            };

            this.groupStack.push(groupInfo);
            this.plv = lev;
        }
    }

    private closeGroupsUntil(targetLevel: string, results: ParsedVariable[]): void {
        // Close all groups deeper than or equal to target level (when new field at same level)
        while (this.groupStack.length > 0) {
            const lastGroup = this.groupStack[this.groupStack.length - 1];

            // Close group if it's deeper than target, OR at same level (sibling)
            if (lastGroup.level < targetLevel) {
                break;
            }

            // Pop and create result for this group
            this.groupStack.pop();

            if (lastGroup.length > 0) {
                const result: ParsedVariable = {
                    line: lastGroup.line,
                    level: lastGroup.level,
                    name: this.extractGroupName(lastGroup),
                    position: lastGroup.position,
                    length: lastGroup.length,
                    hasPic: false,
                    isOccurs: false,
                    isRedefines: false,
                    isSynchronized: false,
                    isComp: false,
                    isComp3: false,
                    rawLine: '',
                    dataType: 'Group/Structure'
                };

                results.push(result);

                // Note: Do NOT update parent groups here!
                // The child fields already updated parent groups when they were processed
            }
        }
    }

    private extractLevel(data: string): string | null {
        const match = data.match(/^(\d{2})\s/);
        if (match && /^\d+$/.test(match[1])) {
            return match[1];
        }
        return null;
    }

    private extractName(data: string): string {
        const parts = data.split(/\s+/);
        if (parts.length > 1) {
            return parts[1];
        }
        return '';
    }

    private extractGroupName(group: GroupInfo): string {
        return group.name;
    }

    public calculatePicLength(pic: string): number {
        pic = pic.trim().toUpperCase();

        // Remove leading S (sign)
        if (pic.startsWith('S')) {
            pic = pic.substring(1);
        }

        let length = 0;

        // Handle V for decimal point
        const vIndex = pic.indexOf('V');
        let intPart = vIndex > 0 ? pic.substring(0, vIndex) : pic;
        let decPart = vIndex > 0 ? pic.substring(vIndex + 1) : '';

        // Calculate integer part
        length += this.calculateSinglePicPart(intPart);

        // Calculate decimal part if exists
        if (decPart.length > 0) {
            length += this.calculateSinglePicPart(decPart);
        }

        return length;
    }

    private calculateSinglePicPart(part: string): number {
        let length = 0;
        let i = 0;

        while (i < part.length) {
            const char = part[i];

            if (char === '(') {
                // Skip opening paren
                i++;
            } else if (char === ')') {
                // Skip closing paren
                i++;
            } else if (char === '.' || char === ' ') {
                // Skip period and spaces
                i++;
            } else {
                // This is a picture character (9, X, A, Z, etc)
                // Check if next char is '('
                if (i + 1 < part.length && part[i + 1] === '(') {
                    // Extract the count: 9(5) -> count is 5
                    const closeIdx = part.indexOf(')', i + 1);
                    if (closeIdx > i + 1) {
                        const countStr = part.substring(i + 2, closeIdx);
                        const count = parseInt(countStr);
                        if (!isNaN(count)) {
                            length += count;
                        }
                        i = closeIdx + 1;
                    } else {
                        i++;
                    }
                } else {
                    // Single character without repetition (9, X, A, etc)
                    length += 1;
                    i++;
                }
            }
        }

        return length;
    }

    private determineDataType(pic: string, isComp: boolean, isComp3: boolean): string {
        pic = pic.trim().toUpperCase();

        if (isComp3) {
            return 'COMP-3 (Packed Decimal)';
        }

        if (isComp) {
            return 'COMP (Binary)';
        }

        if (!pic) {
            return 'Alphanumeric';
        }

        // Remove leading S (sign)
        if (pic.startsWith('S')) {
            pic = pic.substring(1);
        }

        // Check first character
        const firstChar = pic.charAt(0);

        switch (firstChar) {
            case 'X':
            case 'A':
            case 'B':
                return 'Alphanumeric';
            case '9':
                if (pic.includes('V')) {
                    return 'Numeric with Decimal';
                }
                return 'Numeric';
            case 'Z':
            case '*':
                return 'Numeric Edited';
            case '$':
            case '+':
            case '-':
                return 'Numeric Edited';
            default:
                return 'Alphanumeric';
        }
    }
}
