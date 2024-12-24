// deno-lint-ignore-file

let currentlyActiveOption = null;
let currentTooltip = null;

function setOptionActive(option, active) {
  const element = document.querySelector(`.sidebar-option[value="${option}"]`);
  if (!element) return;

  element.classList.remove("active");
  if (active) {
    element.classList.add("active");
    currentlyActiveOption = option;
  } else {
    element.classList.remove("active");
    currentlyActiveOption = null;
  }
}

function purify(html) {
  return html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatNumber(number) {
  return parseFloat(number).toFixed(2);
}

function showTooltip(text, element) {
  if (currentTooltip) {
    currentTooltip.remove();
  }

  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");

  tooltip.innerText = text;
  element.appendChild(tooltip);
  currentTooltip = tooltip;
}

// if the screen is smaller than 900px, whenever a sidebar option is hovered, the tooltip will be shown
document.querySelectorAll(".sidebar-option").forEach((option) => {
  option.addEventListener("mouseover", () => {
    if (window.innerWidth < 900) {
      let value = option.getAttribute("value");

      if (!value) value = option.getAttribute("tab");

      value = value.charAt(0).toUpperCase() + value.slice(1);

      showTooltip(value, option);
    }
  });

  option.addEventListener("mouseout", () => {
    if (currentTooltip) {
      currentTooltip.remove();
      currentTooltip = null;
    }
  });
});