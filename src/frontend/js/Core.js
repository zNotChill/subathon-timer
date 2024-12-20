// deno-lint-ignore-file

let currentlyActiveOption = null;

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