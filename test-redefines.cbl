       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-REDEFINES.

       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  MAIN.
           05  A-GROUP.
               10  AA-VAR OCCURS 22 TIMES PIC X(254).
      *>       Expected: 22 * 254 = 5,588 bytes
           05  B-GROUP.
               10  BB-VAR OCCURS 65 TIMES PIC X(54).
      *>       Expected: 65 * 54 = 3,510 bytes
           05  FILLER REDEFINES BB-VAR.
      *>       This REDEFINES does NOT add bytes
      *>       It reuses the same 3,510 bytes as BB-VAR
               10  CC-VAR1        PIC 9(004) COMP.
               10  CC-VAR2       PIC 9(004) COMP.
               10  FILLER          PIC X(16506).
           05  EMP-STATUS          PIC X(1).
      *>       Expected: 1 byte

      *>   MAIN-01 Total: 5,588 + 3,510 + 1 = 9,099 bytes
      *>   (NOT 5,588 + 3,510 + 2 + 2 + 16,506 + 1 = 25,609)

       PROCEDURE DIVISION.
           STOP RUN.
