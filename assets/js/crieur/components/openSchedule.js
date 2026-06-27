// extends the end hour by 24 hours if the timeSpan crosses midnight
function _denormalizeHourTime(timeSpan) {
  const start = hourTupleToMinutes(timeSpan[0])
  const end = hourTupleToMinutes(timeSpan[1])

  if (end < start) {
    return [Array.from(timeSpan[0]), [timeSpan[1][0] + 24, timeSpan[1][1]]]
  } else {
    return timeSpan
  }
}

function _getTimespanInformation(scheduleData) {
  const startMinutes = Math.min(...scheduleData.flat().map(timeSpan => hourTupleToMinutes(timeSpan[0])))
  const endMinutes = Math.max(...scheduleData.flat().map(timeSpan => hourTupleToMinutes(_denormalizeHourTime(timeSpan)[1])))

  const duration = endMinutes - startMinutes;

  let step;
  if (duration <= 60)        step = 15;   // 1h        → every 15 min
  else if (duration <= 120)  step = 30;   // 1h–2h     → every 30 min
  else if (duration <= 360)  step = 60;   // 2h–6h     → every 1h
  else if (duration <= 720)  step = 120;  // 6h–12h    → every 2h
  else                       step = 360;  // 12h–24h   → every 6h

  const snappedStart = Math.floor(startMinutes / step) * step;

  const ticks = [];
  for (let t = snappedStart + step / 2; t <= endMinutes; t += step) {
    ticks.push(t);
  }
  
  return { ticks, startMinutes: snappedStart, endMinutes };
}

function _computeHourBarsLengthAndSpace(dayData, timespanInfo) {
  const hourBarsLength = []
  let lastEnd = timespanInfo.startMinutes
  for (const openTimeSpan of dayData) {
    const spaceWidth = differenceBetweenHoursInMinutes(lastEnd, openTimeSpan[0]) / (timespanInfo.endMinutes - timespanInfo.startMinutes) * 100
    const timeSpanWidth = differenceBetweenHoursInMinutes(openTimeSpan[0], _denormalizeHourTime(openTimeSpan)[1]) / (timespanInfo.endMinutes - timespanInfo.startMinutes) * 100

    hourBarsLength.push({ spaceWidth, timeSpanWidth })
    lastEnd = _denormalizeHourTime(openTimeSpan)[1]
  }

  return hourBarsLength
}

function formatHour([hours, minutes]) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const _calendarIconSvg = () => Lit.html`
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
`

const _scheduleRowElement = (i, dayData, timespanInfo, now, strings) => {
  const isActiveDay = (now.getDay() + 6) % 7 === i
  const showNowBar = (now.getDay() + 6) % 7 >= i
  
  const _dayTagElement = (dayTag) => Lit.html`
    <div class="shrink-0 text-sm sticky left-0.5 self-start bg-white rounded-full p-1 leading-none flex items-center justify-center m-0.5 shadow-md w-8 aspect-square ${isActiveDay ? "font-bold text-red-500 border-2 border-red-500" : "border"}">${dayTag}</div>
  `
  
  const _hourBarsElement = () => {
    const _spaceElement = (width) => Lit.html`<div style="width:${width}%"></div>`

    const _barElement = (width, active) => {
      if (active) {
        return Lit.html`
          <div style="width:${width}%" class="h-3 rounded-full shadow-inner shadow-white/50 bg-gradient-to-b from-red-300 to-red-500 border border-red-300/50"></div>
        `
      } else {
        return Lit.html`
          <div style="width:${width}%" class="h-3 rounded-full bg-gray-300 border border-gray-400/50"></div>
        `
      }
    }

    const _nowBarElement = () => {
      const offset = (hourTupleToMinutes([now.getHours(), now.getMinutes()]) - timespanInfo.startMinutes) / (timespanInfo.endMinutes - timespanInfo.startMinutes) * 100
      if (offset <= 0 || offset >= 100) {
        return Lit.nothing
      }
      
      return Lit.html`<div class="absolute -translate-x-1/2 h-full ${isActiveDay ? "bg-red-500 w-[2px]" : "bg-red-400/75 w-px"}" style="left:${offset}%"></div>`
    }

    const hourBarsInfo = _computeHourBarsLengthAndSpace(dayData, timespanInfo)
    
    return Lit.html`
      <div class="relative grow h-full flex flex-row items-center">
        ${
          hourBarsInfo.map(info => Lit.html`
            ${info.spaceWidth == 0 ? Lit.nothing : _spaceElement(info.spaceWidth)}
            ${_barElement(info.timeSpanWidth, isActiveDay)}
          `)
        }
        ${
          showNowBar ? _nowBarElement() : Lit.nothing
        }
      </div>
    `
  }

  const _hoursTextElement = () => {
    if (dayData.length == 0) {
      return Lit.html`<div class="w-20 text-xs flex flex-col items-center ${isActiveDay ? "font-bold" : ""}">${strings.closedMessage}</div>`
    }

    let todayInMinutes = hourTupleToMinutes([now.getHours(), now.getMinutes()])
    
    return Lit.html`
      <div class="w-20 text-xs flex flex-col items-center">
        ${
          dayData.map(([start, end]) => {
            const isActive = isNowInHourSpan(todayInMinutes, start, end) && isActiveDay;
            
            return Lit.html`<span class="${isActive ? "font-bold" : ""}">${formatHour(start)}-${formatHour(end)}</span>`
          })
        }
      </div>
    `
  }

  return Lit.html`
    <div class="grow flex flex-row w-full items-center h-8 ${isActiveDay ? "bg-red-500/15" : "odd:bg-black/5"}">
      ${_dayTagElement(strings.dayPrefixes[i])}
      ${_hourBarsElement()}
      ${_hoursTextElement()}
    </div>
  `
}

const _hourBarsOverlayElement = (timespanInfo, now) => {
  const nowHourElement = () => {
    const offset = (hourTupleToMinutes([now.getHours(), now.getMinutes()]) - timespanInfo.startMinutes) / (timespanInfo.endMinutes - timespanInfo.startMinutes) * 100
    if (offset <= 0 || offset >= 100) {
      return Lit.nothing
    }

    return Lit.html`
      <div class="absolute w-full h-full z-10">
        <div class="absolute text-xs -translate-x-1/2 text-red-500 leading-none font-bold shadow-[0_0_5px_2.5px_white] bg-white px-1" style="left:${offset}%"> 
          ${formatHour([now.getHours(), now.getMinutes()])}
        </div>
      </div>
    `
  }
  
  return Lit.html`
    <div class="relative w-full h-full">
      ${timespanInfo.ticks.map(tick => {
        const hour = Math.floor(tick / 60)
        const minutes = tick % 60
        const offset = (tick - timespanInfo.startMinutes) / (timespanInfo.endMinutes - timespanInfo.startMinutes) * 100
    
        return Lit.html`
            <div class="absolute flex flex-col h-full items-center -translate-x-1/2" style="left:${offset}%">
              <div class="leading-none text-xs">${formatHour([hour, minutes])}</div>
              <div class="w-px grow bg-black/15"></div>
            </div>
          `
        })
      }
      ${ nowHourElement() }
    </div>
  `
}

const scheduleElement = (scheduleData) => {
  const dayPrefixes = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]
  const closedMessage = "Fermé"

  const timespanInfo = _getTimespanInformation(scheduleData)
  // Compute now in swiss local time (UTC+2:00), so we can compare it to our swiss based schedule
  const now = getDayInUTCTimeZone([1, 0], [2, 0]);

  const strings = {
    dayPrefixes,
    closedMessage
  }
  
  return Lit.html`
    <div class="text-wrap">
      <div class="flex flex-row p-2">
        ${_calendarIconSvg()}
      
        <div class="font-bold ml-1"> Horaires </div>
      </div>
  
      <div class="w-full relative">
        <div class="absolute w-full h-full z-0">
          <div class="flex flex-row h-full">
            <div class="w-9"></div>
            <div class="grow">
              ${_hourBarsOverlayElement(timespanInfo, now)}
            </div>
            <div class="w-20"></div>
          </div>
        </div>
      
        <div class="h-4"></div>
        <div class="flex flex-col relative z-10 h-64">
          ${
            scheduleData.map((dayData, index) => _scheduleRowElement(index, dayData, timespanInfo, now, strings))
          }
        </div>
      </div>
    </div>
  `
}