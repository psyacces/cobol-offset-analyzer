# VSCode Marketplace Documentation

## Visual Overview

### 1. Extension Active by Default ✅

When you install COBOL Offset Analyzer, it's **automatically active**. Look at the status bar (bottom-right):

```
✅ COBOL Offset: ON  [clickable]
```

### 2. Hover Tooltips - The Main Feature

This is how the extension works - **NO file modifications**, everything is in tooltips:

**When you hover over a COBOL variable:**

```cobol
       01  EMPLOYEE-RECORD.
           05  EMP-ID              PIC 9(5).
           ↑ (hover here)
```

**A tooltip appears showing:**

```
Position:   000001
Length:     000005 bytes
Type:       Numeric
```

### 3. All Variables Display Hover Info

- **Level 01 Groups** ✓ Shows total size
- **Level 05 Groups** ✓ Shows subgroup size
- **Level 10+ Fields** ✓ Shows individual field size
- **Fields with PIC** ✓ Shows data type
- **OCCURS Arrays** ✓ Shows total size (repetitions × size)
- **REDEFINES Fields** ✓ Shows shared memory correctly

### 4. Status Bar Indicator

**Bottom-right of VSCode:**

Active:
```
[✅ COBOL Offset: ON]  ← Green indicator, click to toggle
```

Inactive:
```
[❌ COBOL Offset: OFF] ← Red indicator, click to toggle
```

### 5. Toggle Active/Inactive

**Three ways:**

1. **Keyboard:** `Ctrl+Shift+O` (Windows/Linux) or `Cmd+Shift+O` (Mac)
2. **Click:** The status bar indicator at the bottom-right
3. **Command Palette:** Search "Toggle" in Ctrl+Shift+P menu

The setting is **saved automatically** between sessions.

## Before vs After

### Before Installing

```cobol
01  EMPLOYEE-RECORD.
    05  EMP-ID              PIC 9(5).
    05  EMP-NAME            PIC X(30).
    05  EMP-SALARY          PIC 9(7)V99 COMP-3.
    05  EMP-STATUS          PIC X(1).
```

**No information visible**

### After Installing (COBOL Offset Analyzer)

```cobol
01  EMPLOYEE-RECORD.
    05  EMP-ID              PIC 9(5).
    ↑ (hover here)
    
    ┌─────────────────────────────────────┐
    │ Position:   000001                  │
    │ Length:     000005 bytes             │
    │ Type:       Numeric                 │
    └─────────────────────────────────────┘
```

**Hover on any variable to see position, length, and data type!**

## Supported COBOL Features

✅ **All COBOL data types:**
- Numeric (9), Alphanumeric (X), Signed (S9)
- Decimal (9V9), COMP (Binary), COMP-3 (Packed)
- Numeric Edited (Z, *, $, +, -)

✅ **COBOL clauses:**
- OCCURS (arrays/tables)
- REDEFINES (memory reuse - correctly calculated)
- SYNCHRONIZED (field alignment)
- PIC clause parsing

✅ **Nested structures:**
- Group headers (01, 05, 10... levels)
- Subgroups with automatic size calculation
- Correct byte calculations including nesting

## Why This Extension?

1. **Fast Development** - Instantly see variable offsets without jumping through debuggers
2. **Accurate Calculations** - 20+ years of REXX algorithm, proven on mainframes
3. **Non-Intrusive** - Hover tooltips don't modify your code
4. **Zero Setup** - Active by default, just hover and see
5. **Professional** - Shows Type information for each variable

## Installation

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search: "COBOL Offset Analyzer"
4. Click Install
5. **It's automatically active!** Open any `.cbl`, `.cob`, or `.cobol` file and hover over variables

## Usage

```
1. Open a COBOL file
2. Hover over any variable
3. See offset, length, and type in tooltip
4. Click status bar to toggle active/inactive
```

That's it! 🎉

## Support

For issues, features, or contributions:
https://github.com/psyacces/cobol-offset-analyzer
