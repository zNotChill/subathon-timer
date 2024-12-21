document.querySelector(".sidebar-option[value='leaderboard']").classList.add("active");

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

if (top_donators.length < 10) {
  for (let i = top_donators.length; i < 10; i++) {
    top_donators.push(["-", 0]);
  }
}

if (top_time_adders.length < 10) {
  for (let i = top_time_adders.length; i < 10; i++) {
    top_time_adders.push(["-", 0]);
  }
}


const currencySymbol = currencies[currency];

function renderLeaderboard(type) {
  let data;
  let tableHeaders;

  if (type === "money") {
    data = top_donators;
    tableHeaders = `
      <tr>
        <th>Placement</th>
        <th>Username</th>
        <th>Total Money Contributed</th>
      </tr>
    `;
  } else if (type === "time") {
    data = top_time_adders;
    tableHeaders = `
      <tr>
        <th>Placement</th>
        <th>Username</th>
        <th>Total Time Contributed</th>
      </tr>
    `;
  }

  document.querySelectorAll(".sidebar-option").forEach((option) => {
    if (option.dataset.tab) {
      option.classList.remove("active");
    }
  });
  document.querySelector(`.sidebar-option[tab='${type}']`).classList.add("active");

  const table = document.querySelector("table");
  table.innerHTML = tableHeaders;

  const tbody = document.querySelector("tbody");

  data.forEach((entry) => {
    const entryContainer = document.createElement("tr");

    const placement = document.createElement("td");
    const placementIndex = data.indexOf(entry) + 1;
    placement.classList.add("center");
    placement.textContent = "#" + placementIndex;

    if (placementIndex === 1) {
      placement.classList.add("gold");
    } else if (placementIndex === 2) {
      placement.classList.add("silver");
    } else if (placementIndex === 3) {
      placement.classList.add("brown");
    } else {
      placement.classList.add("dark");
    }

    entryContainer.appendChild(placement);

    const username = document.createElement("td");
    username.textContent = entry[0];
    entryContainer.appendChild(username);

    const total = document.createElement("td");
    total.textContent = type === "money" ? currencySymbol + formatNumber(entry[1]) : convertSecondsToTimeStr(entry[1]);
    entryContainer.appendChild(total);

    tbody.appendChild(entryContainer);
  });
}

renderLeaderboard("money");

function convertSecondsToTimeStr(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let finalStr = "";
  if (hours > 0) {
    finalStr += hours + "h ";
  }

  if (minutes > 0) {
    finalStr += minutes + "m ";
  }

  if (secs > 0) {
    finalStr += Math.floor(secs) + "s";
  }

  return finalStr;
}

document.querySelectorAll(".sidebar-option").forEach((tab) => {
  if (!tab.hasAttribute("tab")) return;
  const tabName = tab.attributes["tab"].value;
  if(!tabName) return;
  tab.addEventListener("click", () => {
    renderLeaderboard(tabName);

    document.querySelectorAll(".sidebar-option[tab]").forEach((tab) => {
      tab.classList.remove("active");
    });
    tab.classList.add("active");
  });
});