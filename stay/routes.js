/* The Stay routing table (J7 of '2026-10-13 One-tap sign-up page - for Code.md'; thread ST-3, 13 Oct 2026).
   The home site's catch page (404.html) loads this file before it routes a /c/ code, and sends a Stay in touch copy to
   the page its line names:
     landing   /stay/         the Stay in touch landing page
     join      /stay/join/    the one-tap sign-up page
   One line per block of copies: the copies, then the page. Copies are one code (Q017) or one card's range (AT01-AT20).
   A Stay card's 12 Oct code reads as its card letters and copy number, so K7-AT-021 falls under the AT21 line.
   When two lines cover a copy, the lower one wins. A copy in no line opens /stay/, as it did before this table.
   Only codes that open a Stay page anyway are read here (Q codes and the Stay cards' letters in 404.html's STAY_CARDS):
   a line can never move a Prop 40 card's code (A001, K7-AB-007) off its card page.
   Checked by gate CC (checks/catch_codes.py): every printed copy (Q001-Q100, AT01-AT20) must stay on landing. */
var STAY_ROUTES = `
Q001-Q100    landing
AT01-AT20    landing
AT21-AT999   join
`;
