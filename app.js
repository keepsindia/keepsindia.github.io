const cfg = window.KEEPS_CONFIG || {};

let booked = new Set();
let selected = null;

// Start calendar at the current month
let now = new Date();
let view = new Date(now.getFullYear(), now.getMonth(), 1);

const pad = n => String(n).padStart(2, "0");

const key = d =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;


// -----------------------------
// LOAD CONFIRMED DATES
// -----------------------------

async function loadAvailability() {
  if (!cfg.API_URL) return;

  try {
    const r = await fetch(
      `${cfg.API_URL}?action=availability&t=${Date.now()}`
    );

    const j = await r.json();

    if (j.success && Array.isArray(j.confirmedDates)) {
      booked = new Set(j.confirmedDates);
    }

    render();

  } catch (e) {
    console.warn("Availability service unavailable.", e);
  }
}


// -----------------------------
// CALENDAR
// -----------------------------

function render() {
  const y = view.getFullYear();
  const m = view.getMonth();

  const label = document.getElementById("monthLabel");
  const cal = document.getElementById("calendar");

  label.textContent = view.toLocaleString("en-IN", {
    month: "long",
    year: "numeric"
  });

  cal.innerHTML = "";

  // Blank spaces before first day
  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) {
    const blank = document.createElement("button");
    blank.className = "day blank";
    blank.disabled = true;
    cal.appendChild(blank);
  }

  const days = new Date(y, m + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let n = 1; n <= days; n++) {

    const d = new Date(y, m, n);
    const k = key(d);

    const button = document.createElement("button");

    button.className = "day";
    button.textContent = n;

    // Past dates
    if (d < today) {
      button.disabled = true;
      button.classList.add("unavailable");
      button.title = "Unavailable";
    }

    // Confirmed booking
    else if (booked.has(k)) {
      button.disabled = true;
      button.classList.add("booked");
      button.title = "Booked";
    }

    // Available date
    else {
      button.onclick = () => selectDate(k);

      if (selected === k) {
        button.classList.add("selected");
      }
    }

    cal.appendChild(button);
  }
}


// -----------------------------
// SELECT DATE
// -----------------------------

function selectDate(k) {
  selected = k;

  document.getElementById("eventDate").value = k;

  const prettyDate = new Date(
    k + "T00:00:00"
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const continueBtn =
    document.getElementById("continueBtn");

  continueBtn.textContent =
    `Continue with ${prettyDate} →`;

  continueBtn.classList.remove("disabled");

  continueBtn.setAttribute(
    "aria-disabled",
    "false"
  );

  render();
}


// -----------------------------
// MONTH BUTTONS
// -----------------------------

document.getElementById("prevMonth").onclick = () => {

  const currentMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const previous = new Date(
    view.getFullYear(),
    view.getMonth() - 1,
    1
  );

  if (previous >= currentMonth) {
    view = previous;
  }

  render();
};


document.getElementById("nextMonth").onclick = () => {

  view = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    1
  );

  render();
};


// -----------------------------
// MANUAL DATE FIELD
// -----------------------------

document
  .getElementById("eventDate")
  .addEventListener("change", e => {

    if (booked.has(e.target.value)) {

      alert(
        "That date has already been confirmed as booked. Please choose another date."
      );

      e.target.value = "";
      selected = null;

      return;
    }

    selected = e.target.value || null;

    render();
  });


// -----------------------------
// MOBILE MENU
// -----------------------------

document.querySelector(".menu").onclick = e => {

  const nav = document.querySelector("nav");

  nav.classList.toggle("open");

  e.currentTarget.setAttribute(
    "aria-expanded",
    nav.classList.contains("open")
  );
};


// -----------------------------
// BOOKING FORM
// -----------------------------

document
  .getElementById("bookingForm")
  .addEventListener("submit", async e => {

    e.preventDefault();

    const status =
      document.getElementById("formStatus");

    const fd =
      new FormData(e.currentTarget);

    const data =
      Object.fromEntries(fd.entries());


    // Check locally first
    if (booked.has(data.eventDate)) {

      status.className =
        "form-status full error";

      status.textContent =
        "That date has just been booked. Please choose another date.";

      return;
    }


    if (!cfg.API_URL) {

      status.className =
        "form-status full error";

      status.textContent =
        "Booking service is currently unavailable.";

      return;
    }


    status.className =
      "form-status full";

    status.textContent =
      "Sending your inquiry…";


    try {

      const r = await fetch(cfg.API_URL, {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body: JSON.stringify({
          action: "submitInquiry",
          ...data
        })
      });


      const j = await r.json();


      // Apps Script returns success
      if (!j.success) {
        throw new Error(
          j.error ||
          j.message ||
          "Could not submit"
        );
      }


      status.className =
        "form-status full success";

      status.textContent =
        j.message ||
        "We got your request ♡ Your date isn’t reserved just yet. A KEEPS team member will contact you on WhatsApp to confirm availability and finalize your booking.";


      e.currentTarget.reset();

      selected = null;

      render();

      await loadAvailability();


    } catch (err) {

      console.error(err);

      status.className =
        "form-status full error";

      status.textContent =
        err.message ||
        "Something went wrong. Please try again.";
    }

  });


// -----------------------------
// START
// -----------------------------

render();
loadAvailability();
