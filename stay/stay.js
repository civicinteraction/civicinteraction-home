/* Stay in touch pages (thread ST-1, 9 Oct 2026; amendment 2, MB22, thread ST-2, 10 Oct 2026). One small first-party script: no cookies, no
   storage, no analytics, nothing loaded from anywhere else (F2).
   - Carries the copy code (?c=Q017) from the page the QR opened through every link and form (S2).
   - Checks the required fields; an empty one gets one plain line under it and nothing is sent (D).
   - Sends each form to the Stay Worker and then opens the page that follows.
   The Worker's address lives here and nowhere else. deploy.sh prints the live address; HQ pastes
   it below before the site push. */
(function () {
  "use strict";
  var ENDPOINT = "https://ci-stay.adammichaelgoldberg.workers.dev/send";

  var LINE_EMPTY = "Please fill this in.";
  var LINE_FAILED = "This didn’t send. Please try again in a little while.";
  var LINE_PICTURE = "That picture is too large to send. Please try a smaller one.";

  // The code as carried: letters and digits only, at most 8, upper case. A code nobody printed is
  // still carried (the Worker marks it "not recognized"); only the shape is cleaned here.
  // Card copy codes (CC8, 12 Oct 2026): a 12 Oct code is carried hyphenated, K7-AT-001, and not cut at 8, exactly as the
  // Worker's normCode stores it (gate CC holds the two to the same answers).
  function cleanCode(raw) {
    var s = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    var x = !/^TEST/.test(s) && s.match(/^([A-HJKMNP-Z2-9]{2})([A-HJKMNP-Z]{2,})(\d{3})$/);
    return x ? x[1] + "-" + x[2] + "-" + x[3] : s.slice(0, 8);
  }
  var code = "";
  try { code = cleanCode(new URLSearchParams(location.search).get("c")); } catch (e) { code = ""; }
  function withCode(path) { return code ? path + (path.indexOf("?") < 0 ? "?" : "&") + "c=" + encodeURIComponent(code) : path; }

  // The one-tap sign-up page (/stay/join/; J4 and J5 of '2026-10-13 One-tap sign-up page - for Code.md', thread ST-3, 13 Oct
  // 2026). copyOf reads the copy a code names from cleanCode's answer, so the page has no second reader of a code's shape: a
  // Stay card's 12 Oct code K7-AT-021 gives its card letters AT and the short code AT21 (a copy at 100 or above keeps its
  // three digits: K7-AT-100 gives AT100); a code that is already letters then digits (AT21, Q017) is its own short code.
  // Anything else, or no code, is null.
  function copyOf(raw) {
    var c = cleanCode(raw), p = c.split("-"), m;
    if (p.length === 3) return { code: c, letters: p[1], short: p[1] + (Number(p[2]) < 100 ? p[2].slice(1) : p[2]) };
    m = /^([A-Z]+)(\d+)$/.exec(c);
    return m ? { code: c, letters: m[1], short: c } : null;
  }
  // The text the button opens, from the page's wording file: "Hi Adam, sign me up (AT21)"; "Hi, sign me up (Q017)" for a copy
  // whose card has no first name; "Hi, sign me up" with no code or one that names no copy.
  function prefill(copy, W) {
    if (!copy) return W.prefillNoCode;
    var name = Object.prototype.hasOwnProperty.call(W.firstNames, copy.letters) ? W.firstNames[copy.letters] : "";
    return (name ? W.prefillNamed.split("{name}").join(name) : W.prefillNoName).split("{code}").join(copy.short);
  }
  // The body as the Text us button writes it (amendment 1, M2: sms:+1...?&body=...), every character outside A-Z a-z 0-9 - _ . ~
  // percent-encoded: the space as %20, the comma %2C, the parentheses %28 and %29.
  function smsBody(text) {
    return encodeURIComponent(text).replace(/[!'()*]/g, function (ch) { return "%" + ch.charCodeAt(0).toString(16).toUpperCase(); });
  }
  function smsHref(number, text) { return number + "?&body=" + smsBody(text); }
  // Fills the page from STAY_JOIN_WORDING (/stay/join/wording.js), points the button at the text, and on the tap shows step 2.
  // The tap is not stopped (no preventDefault): the phone opens the text, and step 2 is waiting when the person comes back.
  // Nothing is sent from the page: no request, no storage (gate E4).
  function wireJoin(root, W) {
    var els = root.querySelectorAll("[data-w]");
    for (var i = 0; i < els.length; i++) {
      var v = W[els[i].getAttribute("data-w")];
      if (Object.prototype.toString.call(v) === "[object Array]") {
        els[i].textContent = "";
        for (var j = 0; j < v.length; j++) { if (j) els[i].appendChild(document.createElement("br")); els[i].appendChild(document.createTextNode(v[j])); }
      } else els[i].textContent = v;
    }
    document.title = W.heading + " \u00b7 Civic Interaction";
    var btn = root.querySelector("a[data-sms]"), one = root.querySelector('[data-step="1"]'), two = root.querySelector('[data-step="2"]');
    btn.setAttribute("href", smsHref(btn.getAttribute("href").split("?")[0], prefill(copyOf(code), W)));
    function step(n) { one.hidden = n !== 1; two.hidden = n !== 2; }
    btn.addEventListener("click", function () { step(2); });
    root.querySelector("[data-back]").addEventListener("click", function (ev) { ev.preventDefault(); step(1); });
  }

  function carryLinks() {
    if (!code) return;
    var links = document.querySelectorAll('a[href^="/stay/"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      if (/\/$/.test(href)) links[i].setAttribute("href", withCode(href));   // pages only; /stay/contact.vcf stays as it is
    }
  }

  function lineUnder(el, text) {
    var after = el.closest("label.file") || el;
    var line = document.createElement("p");
    line.className = "err";
    line.setAttribute("role", "alert");
    line.textContent = text;
    after.insertAdjacentElement("afterend", line);
    return line;
  }
  function clearLines(form) {
    var old = form.querySelectorAll(".err");
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
  }

  // A picture is redrawn to at most 1600 px on its long edge as a JPEG before it is sent: it keeps a
  // phone photo under the Worker's limit and drops the photo's embedded data (its location included).
  var MAX_EDGE = 1600, MAX_BYTES = 1500000;
  function shrink(file) {
    return new Promise(function (resolve) {
      if (!file || !file.size) return resolve(null);
      if (!window.createImageBitmap || !HTMLCanvasElement.prototype.toBlob) return resolve(file);
      createImageBitmap(file).then(function (bmp) {
        var k = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
        var cv = document.createElement("canvas");
        cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
        cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
        cv.toBlob(function (blob) { resolve(blob ? new File([blob], "picture.jpg", { type: "image/jpeg" }) : file); }, "image/jpeg", 0.85);
      }, function () { resolve(file); });
    });
  }

  function wireFile(form) {
    var input = form.querySelector('input[type=file]');
    if (!input) return;
    input.addEventListener("change", function () {
      var label = input.closest("label.file"), shown = form.querySelector(".picked");
      if (shown) shown.parentNode.removeChild(shown);
      if (input.files && input.files[0]) {
        var p = document.createElement("p");
        p.className = "picked";
        p.textContent = input.files[0].name;
        label.insertAdjacentElement("afterend", p);
      }
    });
  }

  // Amendment 2 (10 Oct, MB22, and Adam's ruling 2): the contact field is two optional fields, Email and Cell. "How should
  // we reply?" appears only when both are filled in, and is switched off (not sent) otherwise. The Worker decides again
  // from which fields hold something.
  function wirePref(form) {
    var email = form.querySelector('input[name="email"]'), cell = form.querySelector('input[name="cell"]'), box = form.querySelector(".pref");
    if (!email || !cell || !box) return;
    function show() {
      var both = email.value.trim() !== "" && cell.value.trim() !== "";
      box.hidden = !both;
      box.disabled = !both;
    }
    var fields = [email, cell];
    for (var i = 0; i < fields.length; i++) { fields[i].addEventListener("input", show); fields[i].addEventListener("change", show); }
    show();
  }

  // The fields a person left empty: every [data-required] one, and, for a group marked data-one-of (the check form's Email
  // and Cell: at least one), the last of the group when none of them has anything in it.
  function findMissing(form) {
    var missing = [], req = form.querySelectorAll("[data-required]");
    for (var i = 0; i < req.length; i++) if (!req[i].value.trim()) missing.push(req[i]);
    var group = form.querySelectorAll("[data-one-of]"), any = false;
    for (var k = 0; k < group.length; k++) if (group[k].value.trim()) any = true;
    if (group.length && !any) missing.push(group[group.length - 1]);
    return missing;
  }

  function wireForm(form) {
    wireFile(form);
    wirePref(form);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      clearLines(form);
      var missing = findMissing(form);
      if (missing.length) {
        for (var j = 0; j < missing.length; j++) lineUnder(missing[j], LINE_EMPTY);
        var firstOne = form.querySelector("[data-one-of]");
        (missing[0].hasAttribute("data-one-of") && firstOne ? firstOne : missing[0]).focus();
        return;
      }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      var data = new FormData(form);
      data.set("kind", form.getAttribute("data-kind"));
      data.set("c", code);
      var fileInput = form.querySelector('input[type=file]');
      var pick = fileInput && fileInput.files && fileInput.files[0];
      data.delete("picture");
      shrink(pick).then(function (pic) {
        if (pic) {
          if (pic.size > MAX_BYTES) { btn.disabled = false; lineUnder(fileInput, LINE_PICTURE); return null; }
          data.set("picture", pic, pic.name || "picture");
        }
        return fetch(ENDPOINT, { method: "POST", body: data, mode: "cors", credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" })
          .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, body: j }; }); })
          .then(function (res) {
            if (res.body && res.body.ok) { location.href = withCode(form.getAttribute("data-next")); return; }
            btn.disabled = false;
            var field = res.body && res.body.field && form.querySelector('[name="' + res.body.field + '"]');
            if (field && res.status === 400) lineUnder(field, LINE_EMPTY);
            else if (res.status === 413 && fileInput) lineUnder(fileInput, LINE_PICTURE);
            else lineUnder(btn, LINE_FAILED);
          });
      }).catch(function () { btn.disabled = false; lineUnder(btn, LINE_FAILED); });
    });
  }

  function start() {
    var join = document.querySelector("[data-join]");
    if (join && window.STAY_JOIN_WORDING) wireJoin(join, window.STAY_JOIN_WORDING);
    carryLinks();
    var forms = document.querySelectorAll("form[data-kind]");
    for (var i = 0; i < forms.length; i++) wireForm(forms[i]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
