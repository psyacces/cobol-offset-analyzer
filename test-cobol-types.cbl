       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PIC-TYPES.

       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  TEST-NUMERIC-SIMPLE.
           05  FIELD-1              PIC 9(5).
      *>       Expected: Position 000001, Length 000005
           05  FIELD-2              PIC 9(10).
      *>       Expected: Position 000006, Length 000010
           05  FIELD-3              PIC 9(3).
      *>       Expected: Position 000016, Length 000003

       01  TEST-ALPHANUMERIC.
           05  FIELD-4              PIC X(20).
      *>       Expected: Position 000001, Length 000020
           05  FIELD-5              PIC X(15).
      *>       Expected: Position 000021, Length 000015
           05  FIELD-6              PIC X.
      *>       Expected: Position 000036, Length 000001

       01  TEST-SIGNED-NUMERIC.
           05  FIELD-7              PIC S9(5).
      *>       Expected: Position 000001, Length 000005
           05  FIELD-8              PIC S9(8).
      *>       Expected: Position 000006, Length 000008

       01  TEST-DECIMAL.
           05  FIELD-9              PIC 9(5)V99.
      *>       Expected: Position 000001, Length 000007
           05  FIELD-10             PIC S9(4)V999.
      *>       Expected: Position 000008, Length 000007

       01  TEST-COMP3.
           05  FIELD-11             PIC 9(5) COMP-3.
      *>       Expected: Position 000001, Length 000003
           05  FIELD-12             PIC 9(7) COMP-3.
      *>       Expected: Position 000004, Length 000004

       01  TEST-OCCURS.
           05  FIELD-13             PIC 9(3) OCCURS 10 TIMES.
      *>       Expected: Position 000001, Length 000030

       PROCEDURE DIVISION.
           STOP RUN.
