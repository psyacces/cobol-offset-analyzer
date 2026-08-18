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
  - PIC clause length calculation
  - COMP and COMP-3 numeric formats
  - OCCURS clause for arrays
  - **REDEFINES clause** - Shows redefined field positions/lengths AND correctly excludes redefined bytes from parent totals
  - SYNCHRONIZED fields
  - Nested groups and subgroups
  - Complex scenarios (cascading REDEFINES, REDEFINES with OCCURS, field-level REDEFINES)

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

## Unit Tests

Test individual PIC clause calculations:
```bash
node test-calculations.js
```

Test complete COBOL structure parsing:
```bash
node test-structure.js
```

Test REDEFINES handling:
```bash
node test-redefines-validation.js
```

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
3. Open a COBOL file and test the hover functionality on each variable


## License

MIT
