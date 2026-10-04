// Perform (a - b) % c
function subModulo(a, b, c) {
  let r = a - b;
  if (r < 0) {
    r += c;
  } else if (r >= c) {
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

function statusSpanElement(scheduleArray) {
  if (scheduleArray.length !== 7) {
    throw new Error("assertError: scheduleArray.length != 7")
  }

  // Compute now in swiss local time (UTC+2:00), so we can compare it to our swiss based schedule
  const now = getDayInUTCTimeZone([1, 0], [2, 0]);
  const dayInMinutes = now.getHours() * 60 + now.getMinutes();
  const dayArray = scheduleArray[(now.getDay() + 6) % 7];

  let isOpen = false;
  let openSoon = false;
  let closeSoon = false;
  let timeDelta;

  for (const timeSpan of dayArray) {
    const active = isNowInHourSpan(dayInMinutes, timeSpan[0], timeSpan[1])

    const startMinutes = hourTupleToMinutes(timeSpan[0]);
    const endMinutes = hourTupleToMinutes(timeSpan[1]);

    if (active) {
      isOpen = true;
      timeDelta = subModulo(endMinutes, dayInMinutes, MINUTES_IN_DAY) 
      if (timeDelta <= 30) {
        closeSoon = true;
      }
    } else {
      timeDelta = subModulo(startMinutes, dayInMinutes, MINUTES_IN_DAY)
      if (timeDelta <= 30) {
        openSoon = true;
      }
    }
  }
  
  let innerText;
  let timeText;
  let class_;
  if (isOpen) {
    if (closeSoon) {
      innerText = "Ferme bientôt";
      timeText = `(${timeDelta}m)`
      class_ = "crieur-status-close-soon";
    } else {
      innerText = "Ouvert";
      class_ = "crieur-status-open";
    }
  } else {
    if (openSoon) {
      innerText = "Ouvre bientôt";
      timeText = `(${timeDelta}m)`
      class_ = "crieur-status-open-soon";
    } else {
      innerText = "Fermé";
      class_ = "crieur-status-closed";
    }
  }

  return Lit.html`<span>
    <span class="${class_}">${innerText}</span>
    ${ timeDelta && Lit.html`<span class="crieur-status-desc">${timeText}</span>` }
  </span>`;
}