// Perform (a - b) % c
function subModulo(a, b, c) {
  let r = a - b;
  if (r < 0) {
    r += c;
  } else if (r > c) {
    r %= c;
  }

  return r
}

function isNowInHourSpan(nowInMinutes, start, end) {
  const startMinutes = hourTupleToMinutes(start);
  const endMinutes = hourTupleToMinutes(end);
  const spanning = startMinutes > endMinutes;

  return spanning
    ? nowInMinutes >= startMinutes || nowInMinutes <= endMinutes
    : nowInMinutes >= startMinutes && nowInMinutes <= endMinutes;
}

function createStatusSpan(scheduleArray) {
  if (scheduleArray.length !== 7) {
    throw new Error("assertError: scheduleArray.length != 7")
  }

  // Compute now in swiss local time (UTC+2:00), so we can compare it to our swiss based schedule
  const now = getDayInUTCTimeZone([1, 0], [2, 0]);
  console.log(now)
  const dayInMinutes = now.getHours() * 60 + now.getMinutes();
  const dayArray = scheduleArray[(now.getDay() + 6) % 7];

  let isOpen = false;
  let openSoon = false;
  let closeSoon = false;

  for (const timeSpan of dayArray) {
    const active = isNowInHourSpan(dayInMinutes, timeSpan[0], timeSpan[1])

    const startMinutes = hourTupleToMinutes(timeSpan[0]);
    const endMinutes = hourTupleToMinutes(timeSpan[1]);

    if (active) {
      isOpen = true;
      if (subModulo(endMinutes, dayInMinutes, MINUTES_IN_DAY) <= 30) {
        closeSoon = true;
      }
    } else {
      if (subModulo(startMinutes, dayInMinutes, MINUTES_IN_DAY) <= 30) {
        openSoon = true;
      }
    }
  }

  const spanEl = span([]);
  if (isOpen) {
    if (closeSoon) {
      spanEl.innerText = "Ferme bientôt";
      spanEl.classList.add("crieur-status-close-soon");
    } else {
      spanEl.innerText = "Ouvert";
      spanEl.classList.add("crieur-status-open");
    }
  } else {
    if (openSoon) {
      spanEl.innerText = "Ouvre bientôt";
      spanEl.classList.add("crieur-status-open-soon");
    } else {
      spanEl.innerText = "Fermé";
      spanEl.classList.add("crieur-status-closed");
    }
  }

  return spanEl;
}