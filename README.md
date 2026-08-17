# COBOL Offset Analyzer

A VSCode extension that analyzes COBOL data structures and displays the offset (starting position) and length of each variable in bytes.

## Features

- ✨ Analyzes COBOL data structures (01, 05, 10... levels)
- 📍 Calculates exact byte positions (offsets) for each variable
- 📏 Shows length in bytes for each variable
- 🎯 Displays offset/length in format: `position,length` (e.g., `1,5`)
- ⌨️ One-click analysis with keyboard shortcut
- 🔍 Hover information showing variable details
- ✅ Supports PIC clauses with length calculation
- 📦 Handles COMP and COMP-3 numeric formats
- 🔄 Supports OCCURS clause for arrays
- ↔️ Handles REDEFINES clause
- 🔐 Supports SYNCHRONIZED fields

## Supported File Extensions

- `.cbl` - COBOL source files
- `.cob` - COBOL source files  
- `.cobol` - COBOL source files

## How to Use

### 1. Open a COBOL File

Open any `.cbl`, `.cob`, or `.cobol` file in VSCode.

### 2. Run the Analyzer

**Option A: Keyboard Shortcut**
- Press `Ctrl+Shift+O` (Windows/Linux) or `Cmd+Shift+O` (Mac)

**Option B: Command Palette**
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
- Search for "Analyze COBOL Structure"
- Press Enter

### 3. View Results

The extension will insert offset/length information at the end of each variable line in the format:
```
                                             position,length
```

### 4. Hover Information

Hover your mouse over any variable to see:
- Starting position (offset)
- Length in bytes
- Metadata (OCCURS, REDEFINES, SYNCHRONIZED, etc.)

## Example

**Input COBOL:**
```cobol
       01  EMPLOYEE-RECORD.
           05  EMP-ID              PIC 9(5).
           05  EMP-NAME            PIC X(30).
           05  EMP-SALARY          PIC 9(7)V99 COMP-3.
           05  EMP-HIRE-DATE.
               10  EMP-HIRE-YEAR   PIC 9(4).
               10  EMP-HIRE-MONTH  PIC 9(2).
               10  EMP-HIRE-DAY    PIC 9(2).
```

**Output (after analysis):**
```
       01  EMPLOYEE-RECORD.
           05  EMP-ID              PIC 9(5).                        1,5
           05  EMP-NAME            PIC X(30).                       6,30
           05  EMP-SALARY          PIC 9(7)V99 COMP-3.              36,5
           05  EMP-HIRE-DATE.                                       41,8
               10  EMP-HIRE-YEAR   PIC 9(4).                        41,4
               10  EMP-HIRE-MONTH  PIC 9(2).                        45,2
               10  EMP-HIRE-DAY    PIC 9(2).                        47,2
```

## Testing

A sample COBOL file is included (`sample.cbl`). You can use it to test the extension:

1. Open `sample.cbl`
2. Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac)
3. See the offset/length information inserted

## Testing

### Unit Tests - PIC Clause Calculations

Test that individual PIC clause types are calculated correctly:

```bash
node test-calculations.js
```

This tests:
- ✓ Simple numeric: `PIC 9(5)` = 5 bytes
- ✓ Alphanumeric: `PIC X(20)` = 20 bytes
- ✓ Signed numeric: `PIC S9(8)` = 8 bytes
- ✓ Decimal fields: `PIC 9(5)V99` = 7 bytes
- ✓ And more...

### Integration Tests - Full COBOL Structure

Once unit tests pass, test with complete COBOL structures:

1. Open `test-cobol-types.cbl` (contains various PIC clause types)
2. Press `Ctrl+Shift+O` to analyze
3. Hover over each variable to verify offset/length calculations

## Development

### Build from Source

```bash
npm install
npm run compile
```

### Watch for Changes

```bash
npm run watch
```

### Debug in VSCode

1. Press `F5` to open the extension in debug mode
2. A new VSCode window will open with your extension loaded
3. Open a COBOL file and test the analysis
4. Open DevTools (Help → Toggle Developer Tools) to see debug output

## Original Algorithm

This extension implements the same offset-calculation algorithm that has been running successfully on IBM Mainframe z/OS (REXX) for 20+ years. The logic is based on the proven REXX implementation and has been adapted for VSCode.

## Support

For issues or feature requests, please open an issue on the project repository.

## License

MIT
