/* Stay in touch pages (thread ST-1, 9 Oct 2026). One small first-party script: no cookies, no
   storage, no analytics, nothing loaded from anywhere else (F2).
   - Carries the copy code (?c=B000) from the page the QR opened through every link and form (S2).
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
  function cleanCode(raw) {
    var c = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    return c;
  }
  var code = "";
  try { code = cleanCode(new URLSearchParams(location.search).get("c")); } catch (e) { code = ""; }
  function withCode(path) { return code ? path + (path.indexOf("?") < 0 ? "?" : "&") + "c=" + encodeURIComponent(code) : path; }

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

  function wireForm(form) {
    wireFile(form);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      clearLines(form);
      var missing = [];
      var req = form.querySelectorAll("[data-required]");
      for (var i = 0; i < req.length; i++) if (!req[i].value.trim()) missing.push(req[i]);
      if (missing.length) {
        for (var j = 0; j < missing.length; j++) lineUnder(missing[j], LINE_EMPTY);
        missing[0].focus();
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
    carryLinks();
    var forms = document.querySelectorAll("form[data-kind]");
    for (var i = 0; i < forms.length; i++) wireForm(forms[i]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
