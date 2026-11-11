(function () {
  var STATES = ["Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Ireland","Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden"];
  var sel = document.getElementById("rf-state");
  STATES.forEach(function (s) { var o = document.createElement("option"); o.textContent = s; sel.appendChild(o); });

  function slug(s) {
    return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/ß/g, "ss").replace(/[æÆ]/g, "ae").replace(/[øØ]/g, "o").replace(/[łŁ]/g, "l").replace(/[đĐ]/g, "d")
      .replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function handle(first, last) {
    var a = slug(first), b = slug(last);
    return [a, b].filter(Boolean).join("-");
  }

  /* Hero handle builder */
  var hbFirst = document.getElementById("hb-first"), hbLast = document.getElementById("hb-last"), hbSlug = document.getElementById("hb-slug");
  function updHero() { hbSlug.textContent = handle(hbFirst.value, hbLast.value) || "firstname-lastname"; }
  hbFirst.addEventListener("input", updHero); hbLast.addEventListener("input", updHero); updHero();

  /* Reserve form */
  var rf = document.getElementById("reserve-form");
  var rfFirst = document.getElementById("rf-first"), rfLast = document.getElementById("rf-last"), rfHandle = document.getElementById("rf-handle");
  function updForm() { var h = handle(rfFirst.value, rfLast.value); rfHandle.textContent = "@" + (h || "firstname-lastname") + ".rostrum.eu"; }
  rfFirst.addEventListener("input", updForm); rfLast.addEventListener("input", updForm);

  document.getElementById("hb").addEventListener("submit", function (e) {
    e.preventDefault();
    rfFirst.value = hbFirst.value; rfLast.value = hbLast.value; updForm();
    document.getElementById("reserve").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(function () { document.getElementById("rf-email").focus({ preventScroll: true }); }, 450);
  });

  function setErr(input, msg) {
    var el = document.getElementById(input.id + "-err");
    if (msg) { input.setAttribute("aria-invalid", "true"); el.textContent = msg; el.hidden = false; }
    else { input.removeAttribute("aria-invalid"); el.hidden = true; el.textContent = ""; }
    return !msg;
  }
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  rf.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("rf-email"), consent = document.getElementById("rf-consent");
    var ok = true, first = null;
    function check(input, msg) { var r = setErr(input, msg); if (!r && !first) first = input; ok = ok && r; }
    check(rfFirst, rfFirst.value.trim() ? "" : "Enter your first name.");
    check(rfLast, rfLast.value.trim() ? "" : "Enter your last name.");
    var ev = email.value.trim();
    check(email, !ev ? "Enter your Parliament email address." : !emailRe.test(ev) ? "Enter an email address like name@europarl.europa.eu." : !/@europarl\.europa\.eu$/i.test(ev) ? "Use your official address ending in @europarl.europa.eu, so we can confirm it's you." : "");
    check(sel, sel.value ? "" : "Select your member state.");
    check(consent, consent.checked ? "" : "Tick this box so we can hold your handle.");
    if (!ok) { first.focus(); return; }
    document.getElementById("rf-fields").hidden = true;
    document.getElementById("rf-success-handle").textContent = rfHandle.textContent;
    document.getElementById("rf-success-email").textContent = ev;
    var s = document.getElementById("rf-success"); s.hidden = false; s.focus();
  });

  var bf = document.getElementById("briefing");
  bf.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = document.getElementById("bf-name"), r = document.getElementById("bf-role"), m = document.getElementById("bf-email");
    var ok = true, first = null;
    function check(input, msg) { var x = setErr(input, msg); if (!x && !first) first = input; ok = ok && x; }
    check(n, n.value.trim() ? "" : "Enter your name.");
    check(r, r.value ? "" : "Select your role.");
    check(m, !m.value.trim() ? "Enter your office email address." : !emailRe.test(m.value.trim()) ? "Enter a valid email address, like name@example.eu." : "");
    if (!ok) { first.focus(); return; }
    document.getElementById("bf-fields").hidden = true;
    var s = document.getElementById("bf-success"); s.hidden = false; s.focus();
  });

  /* Hemicycle: 720 seats in concentric rows, one lit as "your seat" */
  var svg = document.getElementById("hemicycle"), NS = "http://www.w3.org/2000/svg";
  var N = 720, ROWS = 14, cx = 500, cy = 500, r0 = 180, r1 = 470;
  var radii = [], sum = 0;
  for (var i = 0; i < ROWS; i++) { var r = r0 + (r1 - r0) * i / (ROWS - 1); radii.push(r); sum += r; }
  var counts = radii.map(function (r) { return Math.floor(N * r / sum); });
  var rem = N - counts.reduce(function (a, b) { return a + b; }, 0);
  for (var k = ROWS - 1; rem > 0; k--, rem--) counts[(k + ROWS) % ROWS]++;
  var seats = [];
  radii.forEach(function (r, row) {
    var n = counts[row];
    for (var j = 0; j < n; j++) {
      var t = Math.PI - (Math.PI * (j + .5) / n);
      seats.push({ x: cx + r * Math.cos(t), y: cy - r * Math.sin(t), t: t });
    }
  });
  seats.sort(function (a, b) { return b.t - a.t; });
  var rad = Math.min(9, (r1 - r0) / (ROWS - 1) * .36);
  var frag = document.createDocumentFragment();
  var yourIndex = Math.round(N * 0.62);
  seats.forEach(function (s, idx) {
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", s.x.toFixed(1)); c.setAttribute("cy", s.y.toFixed(1)); c.setAttribute("r", rad.toFixed(1));
    c.setAttribute("class", "seat" + (idx === yourIndex ? " lit" : ""));
    frag.appendChild(c);
  });
  var you = seats[yourIndex];
  var ring = document.createElementNS(NS, "circle");
  ring.setAttribute("cx", you.x.toFixed(1)); ring.setAttribute("cy", you.y.toFixed(1)); ring.setAttribute("r", (rad * 2.4).toFixed(1)); ring.setAttribute("class", "you-ring");
  frag.appendChild(ring);
  var lab = document.createElementNS(NS, "text");
  lab.setAttribute("x", (you.x + rad * 3.2).toFixed(1)); lab.setAttribute("y", (you.y - rad * 2.6).toFixed(1));
  lab.textContent = "Your seat";
  frag.appendChild(lab);
  var lectern = document.createElementNS(NS, "rect");
  lectern.setAttribute("x", cx - 34); lectern.setAttribute("y", cy - 40); lectern.setAttribute("width", 68); lectern.setAttribute("height", 30); lectern.setAttribute("rx", 4);
  lectern.setAttribute("fill", "#2337C6");
  frag.appendChild(lectern);
  svg.appendChild(frag);
})();
