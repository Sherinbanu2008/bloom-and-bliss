/* Bloom & Bliss — site behaviour (vanilla JS) */
(function () {
  "use strict";

  // Business WhatsApp number: country code + number, digits only.
  var WHATSAPP_NUMBER = "919876543210";

  var body = document.body;
  var menuToggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("primary-nav");
  var navLinks = document.querySelectorAll("[data-nav]");
  var form = document.getElementById("enquiry-form");
  var serviceSelect = document.getElementById("service");

  /* ---------- Dynamic copyright year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  menuToggle.addEventListener("click", function () {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) setMenu(false);
  });

  /* ---------- Active nav link on scroll ---------- */
  var sections = Array.prototype.map.call(navLinks, function (link) {
    return document.querySelector(link.getAttribute("href"));
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach(function (section) { if (section) observer.observe(section); });
  }

  /* ---------- Collections: preselect service in the form ---------- */
  document.querySelectorAll("[data-service]").forEach(function (link) {
    link.addEventListener("click", function () {
      serviceSelect.value = link.getAttribute("data-service");
      clearError(serviceSelect);
    });
  });

  /* ---------- Image fallback so a failed photo never leaves a hole ---------- */
  document.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () { img.style.visibility = "hidden"; });
  });

  /* ---------- Form validation ---------- */
  function fieldWrap(input) { return input.closest(".field"); }

  function showError(input, message) {
    var wrap = fieldWrap(input);
    wrap.classList.add("has-error");
    wrap.querySelector(".error").textContent = message;
    input.setAttribute("aria-invalid", "true");
  }

  function clearError(input) {
    var wrap = fieldWrap(input);
    wrap.classList.remove("has-error");
    var err = wrap.querySelector(".error");
    if (err) err.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  // Accepts 10-digit Indian mobiles (starting 6-9), optionally with +91, 91 or 0 prefix.
  function normalisePhone(raw) {
    var digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) digits = digits.slice(2);
    else if (digits.length === 11 && digits.charAt(0) === "0") digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  }

  function validate() {
    var name = form.elements.name;
    var phone = form.elements.phone;
    var valid = true;
    var firstInvalid = null;

    [name, phone, serviceSelect].forEach(clearError);

    if (!name.value.trim()) {
      showError(name, "Please enter your name.");
      valid = false; firstInvalid = firstInvalid || name;
    }

    if (!phone.value.trim()) {
      showError(phone, "Please enter your phone number.");
      valid = false; firstInvalid = firstInvalid || phone;
    } else if (!normalisePhone(phone.value)) {
      showError(phone, "Please enter a valid 10-digit mobile number.");
      valid = false; firstInvalid = firstInvalid || phone;
    }

    if (!serviceSelect.value) {
      showError(serviceSelect, "Please choose an occasion or service.");
      valid = false; firstInvalid = firstInvalid || serviceSelect;
    }

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  // Clear an error as soon as the customer corrects the field.
  ["name", "phone", "service"].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("input", function () { clearError(el); });
    el.addEventListener("change", function () { clearError(el); });
  });

  /* ---------- WhatsApp message ---------- */
  function buildMessage() {
    var phone = normalisePhone(form.elements.phone.value);
    var extra = form.elements.message.value.trim();

    var lines = [
      "Hello Bloom & Bliss,",
      "",
      "I'd like to make an enquiry.",
      "",
      "Name: " + form.elements.name.value.trim(),
      "Phone: +91 " + phone.slice(0, 5) + " " + phone.slice(5),
      "Occasion / service: " + serviceSelect.value
    ];
    if (extra) lines.push("", "Message: " + extra);
    return lines.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildMessage());
    var win = window.open(url, "_blank", "noopener");
    // If a pop-up blocker stops the new tab, fall back to the same tab.
    if (!win) window.location.href = url;
  });
})();