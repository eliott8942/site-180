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

function applyStatus(spanID, scheduleArray) {
  let span = document.getElementById(spanID)
  if (span == undefined) {
    console.log("Warning : the id points to nothing")
    return;
  }

  if (scheduleArray.length != 7) {
    throw "assertError : scheduleArray.length != 7"
  }
  
  let now = getDayInTimeOffset([1, 0]);
  let day = now.getDay()
  let hour = now.getHours()
  let minutes = now.getMinutes()
  let dayInMinutes = hour * 60 + minutes;

  let dayArray = scheduleArray[day]

  let isOpen = false;
  let openSoon = false;
  let closeSoon = false;
  for (let index = 0; index < dayArray.length; index++) {
    const timeSpan = dayArray[index];
    
    let startMinutes = hourTupleToMinutes(timeSpan[0]);
    let endMinutes = hourTupleToMinutes(timeSpan[1]);

    if (startMinutes > endMinutes) {
      if ((startMinutes <= dayInMinutes && dayInMinutes < 1440) || (dayInMinutes <= endMinutes)) {
        isOpen = true;
      }
    } else {
      if (startMinutes <= dayInMinutes && dayInMinutes <= endMinutes) {
        isOpen = true;
      }
    }

    if (subModulo(startMinutes, dayInMinutes, 1440) <= 30) {
      openSoon = true;
    }
    if (subModulo(endMinutes, dayInMinutes, 1440) <= 30) {
      closeSoon = true;
    }
  }

  if (isOpen) {
    if (closeSoon) {
      span.innerText = "Ferme bientot";
      span.classList.add("crieur-status-close-soon");
    } else {
      span.innerText = "Ouvert";
      span.classList.add("crieur-status-open");
    }
  } else {
    if (openSoon) {
      span.innerText = "Ouvre bientot";
      span.classList.add("crieur-status-open-soon");
    } else {
      span.innerText = "Fermé";
      span.classList.add("crieur-status-closed");
    }
  }
}