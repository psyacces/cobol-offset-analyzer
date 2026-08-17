       IDENTIFICATION DIVISION.
       PROGRAM-ID. SAMPLE-COBOL.

       DATA DIVISION.
       WORKING-STORAGE SECTION.

       01  EMPLOYEE-RECORD.
           05  EMP-ID              PIC 9(5).
           05  EMP-NAME            PIC X(30).
           05  EMP-SALARY          PIC 9(7)V99 COMP-3.
           05  EMP-HIRE-DATE.
               10  EMP-HIRE-YEAR   PIC 9(4).
               10  EMP-HIRE-MONTH  PIC 9(2).
               10  EMP-HIRE-DAY    PIC 9(2).
           05  EMP-STATUS          PIC X(1).
               88  ACTIVE          VALUE 'A'.
               88  INACTIVE        VALUE 'I'.

       PROCEDURE DIVISION.
           STOP RUN.
