/* The one-tap sign-up page's words (J3 of '2026-10-13 One-tap sign-up page - for Code.md'; thread ST-3, 13 Oct 2026).
   Every string the page shows is here and nowhere else, so Adam's rewrite is an edit to this one file. Placeholder v0.1,
   Adam's specification, copied from the spec's section C (straight apostrophes as the spec writes them). stay.js fills the
   page from it; gate W (checks/gates.py) holds it to the spec's section C.
     back            J5's small "Back" link (written as the Keep in touch page writes its own: "‹ Back")
     prefill...      J4: the text the Sign me up button opens. {name} is the card owner's first name (firstNames, by the
                     card letters of the copy code), {code} the copy's short code (AT21). prefillNoName is used for a copy
                     whose card has no first name below (a Q copy); prefillNoCode for no code or one that is not a copy's.
     firstNames      J4 and CC8: card letters -> the card owner's first name. AT is Adam (notes/print/copy-register.md). */
var STAY_JOIN_WORDING = {
  heading: "Stay in touch",
  lede: "Now and then over the next year, we'll text you a question or two: what stuck with you, what happened after. Answer or don't.",
  promises: [
    "We never ask for money.",
    "We never sell or share your number.",
    "Your number goes only to our coordinator.",
    "No name needed.",
    "Reply STOP and we'll stop.",
  ],
  button: "Sign me up",
  under: "This opens a text. Nothing is sent until you press send.",
  linkForm: "Rather not text? Leave your number or email ›",
  linkLanding: "More from Civic Interaction ›",
  back: "‹ Back",
  step2: "Sent? One more tap:",
  save: "Save our number",
  step2Why: "So our texts don't end up in your filtered messages.",
  prefillNamed: "Hi {name}, sign me up ({code})",
  prefillNoName: "Hi, sign me up ({code})",
  prefillNoCode: "Hi, sign me up",
  firstNames: {"AT": "Adam"}
};
