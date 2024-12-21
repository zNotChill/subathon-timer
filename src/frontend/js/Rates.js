document.querySelector(".sidebar-option[value='rates']").classList.add("active");

const currencies = {
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  "JPY": "¥",
  "CNY": "¥",
  "RUB": "₽",
  "KRW": "₩",
  "INR": "₹",
  "BRL": "R$",
  "CAD": "$",
  "AUD": "$",
  "MXN": "$",
  "IDR": "Rp",
  "TRY": "₺",
  "ZAR": "R",
  "HKD": "$",
  "PHP": "₱",
}

const currencySymbol = currencies[currency];

rates.forEach((rate) => {
  const rateContainer = document.createElement("div");
  rateContainer.classList.add("rate-container");

  const leftDiv = document.createElement("div");
  leftDiv.classList.add("left");

  const rateSymbol = document.createElement("div");
  rateSymbol.classList.add("rate-symbol");

  const symbolDiv = document.createElement("div");
  symbolDiv.classList.add("inherit");

  let title = "";
  let symbol = "";

  let baseRateValues = {
    money: rate.money_per || 0,
    time: rate.time_per || rate.duration,
  }
  let currentRateValues = {
    money: rate.money_per || 0,
    time: rate.time_per * subathonData.multiplier * subathonData.base_rate || rate.duration,
  }

  switch (rate.type) {
    case "channel.subscribe":
      if (rate.value === 1) {
        symbolDiv.classList.add("purple");

        title = "Tier 1 Sub";
        symbol = "1 sub";
      }
      if (rate.value === 2) {
        symbolDiv.classList.add("blue");

        title = "Tier 2 Sub";
        symbol = "1 sub";
      }
      if (rate.value === 3) {
        symbolDiv.classList.add("gold");

        title = "Tier 3 Sub";
        symbol = "1 sub";
      }

      symbolDiv.innerHTML = `<icon>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" stroke-width="2">
          <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z"></path>
          <path d="M12 8l0 13"></path>
          <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7"></path>
          <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5"></path>
        </svg>
      <icon>`;
      break;
    case "donation":
      symbolDiv.classList.add("green");
      symbolDiv.textContent = currencySymbol;

      title = "Donation";
      symbol = "1€";
      break;
    case "channel.cheer":
      symbolDiv.innerHTML = `
        <img style="width: 50px; height: 50px;" src="https://static-cdn.jtvnw.net/bits/light/animated/blue/4" alt="Cheer">
      `
      title = "Cheer";
      symbol = "100 bits";

      baseRateValues.money *= 100;
      baseRateValues.time *= 100;
      currentRateValues.money *= 100;
      currentRateValues.time *= 100;
      break;
    case "channel.raid":
      symbolDiv.innerHTML = `
        <icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" stroke-width="2">
          <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
          <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
        </svg>
      </icon>`;
      title = "Raid";
      symbol = "1 viewer";
      break;
  }

  rateSymbol.appendChild(symbolDiv);
  leftDiv.appendChild(rateSymbol);
  rateContainer.appendChild(leftDiv);

  const centerDiv = document.createElement("div");
  centerDiv.classList.add("center");

  const rateTitle = document.createElement("div");
  rateTitle.classList.add("rate-title");

  const textDiv = document.createElement("div");
  textDiv.id = "text";
  textDiv.textContent = title;

  rateTitle.appendChild(textDiv);
  centerDiv.appendChild(rateTitle);

  const gridDiv = document.createElement("div");
  gridDiv.classList.add("grid");

  const gridElement1 = document.createElement("div");
  gridElement1.classList.add("grid-element");

  const currentRateTitle = document.createElement("div");
  currentRateTitle.classList.add("current_rate_color", "rate-grid-title");
  currentRateTitle.textContent = `Current Rate (${subathonData.multiplier}x)`;

  const currentRate = document.createElement("div");
  currentRate.classList.add("current_rate");
  currentRate.innerHTML = `
    ${symbol} = <span class="current_rate_color_brighter">+${convertSecondsToTimeStr(currentRateValues.time)}</span>${rate.money_per ? `, +${currentRateValues.money}${currencySymbol} counter` : ""}
  `;

  gridElement1.appendChild(currentRateTitle);
  gridElement1.appendChild(currentRate);
  gridDiv.appendChild(gridElement1);

  const gridElement2 = document.createElement("div");
  gridElement2.classList.add("grid-element");

  const baseRateTitle = document.createElement("div");
  baseRateTitle.classList.add("base_rate_color", "rate-grid-title");
  baseRateTitle.textContent = "Base Rate";

  const baseRate = document.createElement("div");
  baseRate.classList.add("base_rate");
  baseRate.innerHTML = `
    ${symbol} = <span class="base_rate_color_brighter">+${convertSecondsToTimeStr(baseRateValues.time)}</span>${rate.money_per ? `, +${baseRateValues.money}${currencySymbol} counter` : ""}
  `;
  gridElement2.appendChild(baseRateTitle);
  gridElement2.appendChild(baseRate);
  gridDiv.appendChild(gridElement2);

  centerDiv.appendChild(gridDiv);
  rateContainer.appendChild(centerDiv);

  document.querySelector(".rates.settings-container").appendChild(rateContainer);
});

function convertSecondsToTimeStr(seconds) {
  if (seconds < 60) {
    return seconds + " secs";
  } else {
    return Math.floor(seconds / 60) + " mins";
  }
}

const time_remaining_element = document.querySelector(".time_remaining");
setInterval(() => {
  if (subathonData.multiplier_countdown <= 0 && subathonData.multiplier > 1) {
    time_remaining_element.textContent = `Multiplier expired`;
    return;
  } else if (subathonData.multiplier === 1) {
    time_remaining_element.textContent = `Multiplier inactive (1x)`;
    return;
  }
  subathonData.multiplier_countdown--;
  time_remaining_element.textContent = `Time remaining of ${subathonData.multiplier}x multiplier: ${convertSecondsToTimeStr(subathonData.multiplier_countdown)}`;
}, 1000);