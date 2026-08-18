# COBOL Offset Analyzer

A VSCode extension that analyzes COBOL data structures and displays the offset (starting position) and length of each variable in bytes using **hover tooltips**.

## ✨ Features

- 🟢 **Auto-Active by Default** - Starts active when installed, no setup needed
- 📍 **Automatic Offset Calculation** - Hover over any COBOL variable to see position and length
- 📏 **Shows Length in Bytes** - Display format: Position and Length in `NNNNNN` format
- 🎯 **Type Detection** - Identifies Numeric, Alphanumeric, COMP, COMP-3, Group/Structure, etc.
- 💾 **Persistent State** - Remembers if extension is active/inactive between sessions
- 🔄 **Toggle On/Off** - Easy enable/disable with Ctrl+Shift+O or status bar click
- ✅ **Supports All COBOL Features:**
  - Full PICTURE decoding, including edited pictures (`ZZ,ZZ9.99`, `$$$,$$9.99CR`, `----9.99`), `V`, `S` and `P`
  - Every USAGE: `DISPLAY`, `COMP`/`COMP-4`/`BINARY`/`COMP-5`, `COMP-1`, `COMP-2`, `COMP-3`/`PACKED-DECIMAL`, `INDEX`, `POINTER`, `NATIONAL`
  - OCCURS on elementary items **and on groups**, nested tables, and `OCCURS ... DEPENDING ON`
  - **REDEFINES** - Shows redefined field positions/lengths AND correctly excludes redefined bytes from parent totals
  - SYNCHRONIZED alignment on halfword/fullword/doubleword boundaries
  - Nested groups and subgroups to any depth
  - Definitions that wrap across multiple source lines

### Byte-Size Rules

| Usage | Size |
|-------|------|
| `DISPLAY` | one byte per character position (`S`, `V` and `P` take none) |
| `COMP` / `COMP-4` / `BINARY` / `COMP-5` | 1-4 digits → 2 bytes, 5-9 → 4 bytes, 10-18 → 8 bytes |
| `COMP-3` / `PACKED-DECIMAL` | `FLOOR(digits / 2) + 1` bytes |
| `COMP-1` | 4 bytes | 
| `COMP-2` | 8 bytes |
| `INDEX` / `POINTER` | 4 bytes |
| `NATIONAL` / `PIC N` | 2 bytes per character position |

## Supported File Extensions

- `.cbl` - COBOL source files
- `.cob` - COBOL source files  
- `.cobol` - COBOL source files

## How to Use

### 1. Open a COBOL File

Open any `.cbl`, `.cob`, or `.cobol` file in VSCode. The extension is **ACTIVE by default**.

### 2. Hover Over Variables

Simply **hover your mouse** over any variable or group header to see:

```
Position:   000001
Length:     000005 bytes
Type:       Numeric
```

### 3. Status Indicator

Look at the **bottom-right corner** of VSCode (status bar):
- **✅ COBOL Offset: ON** - Extension is active
- **❌ COBOL Offset: OFF** - Extension is inactive

Click it to toggle, or press **Ctrl+Shift+O** (Mac: **Cmd+Shift+O**)

### 4. Deactivate/Reactivate

**Press Ctrl+Shift+O** (or Cmd+Shift+O on Mac) to:
- Disable the extension (status shows RED ❌)
- Re-enable the extension (status shows GREEN ✅)

The state is saved and persists between sessions.

## Example

**When you hover over a COBOL variable:**

```cobol
01  EMPLOYEE-RECORD.
    05  EMP-ID              PIC 9(5).
    05  EMP-NAME            PIC X(30).
    05  EMP-SALARY          PIC 9(7)V99 COMP-3.
    05  EMP-HIRE-DATE.
        10  EMP-HIRE-YEAR   PIC 9(4).
        10  EMP-HIRE-MONTH  PIC 9(2).
        10  EMP-HIRE-DAY    PIC 9(2).
    05  EMP-STATUS          PIC X(1).
```

**Hover Information:**
- **EMP-ID:** Position 000001, Length 000005 bytes, Type: Numeric
- **EMP-NAME:** Position 000006, Length 000030 bytes, Type: Alphanumeric
- **EMP-SALARY:** Position 000036, Length 000005 bytes, Type: COMP-3 (Packed Decimal)
- **EMP-HIRE-DATE:** Position 000041, Length 000008 bytes, Type: Group/Structure
- **EMP-HIRE-YEAR:** Position 000041, Length 000004 bytes, Type: Numeric
- **EMP-HIRE-MONTH:** Position 000045, Length 000002 bytes, Type: Numeric
- **EMP-HIRE-DAY:** Position 000047, Length 000002 bytes, Type: Numeric
- **EMP-STATUS:** Position 000049, Length 000001 bytes, Type: Alphanumeric

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| COBOL Offset: Toggle Active/Inactive | `Ctrl+Shift+O` | Enable/disable the extension |
| COBOL Offset: Manually Trigger Analysis | `Ctrl+Shift+P` → "Analyze COBOL" | Force re-analysis (optional) |

## Testing

A sample COBOL file is included (`sample.cbl`). To test:

1. Open `sample.cbl`
2. Hover over any variable
3. See the offset/length information in the tooltip

## Test Suite

```bash
npm test
```

Runs the full integration plan in [test/](test/) — 595 assertions across seven suites:

| Suite | Covers |
|-------|--------|
| `suite-picture.js` | Byte and digit counting for every PICTURE symbol |
| `suite-usage.js` | `COMP`, `COMP-3`, `COMP-1`, `COMP-2`, `INDEX`, `POINTER` sizing and all spelling variants |
| `suite-structure.js` | Nested groups; every level must produce a hover |
| `suite-occurs.js` | Elementary, group, nested and `DEPENDING ON` tables |
| `suite-redefines.js` | Partial redefinitions, nesting, cascading, cursor rewind |
| `suite-multiline.js` | Statements spanning lines anchor to the name line |
| `suite-regression.js` | The hand-verified sample files must not drift |

Every expected value is written by hand from IBM Enterprise COBOL storage rules —
never copied back out of parser output.

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

1. Press `F5` to start debugging
2. A new VSCode window opens with your extension loaded
3. Open a COBOL file and test the hover functionality

## Original Algorithm

This extension implements the same offset-calculation algorithm that has been running successfully on IBM Mainframe z/OS (REXX) for 20+ years. The logic is based on the proven REXX implementation and has been adapted for VSCode.

## License

MIT
