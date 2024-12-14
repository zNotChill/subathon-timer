
setOptionActive("commands", true);

let commands = {};

fetch("/api/commands")
  .then((response) => response.json())
  .then((data) => {
    commands = data;
    renderCommands();
  });

function renderCommands() {
  const commandSection = document.querySelector(".commands");
  commandSection.innerHTML = "";

  Object.keys(commands).forEach((command) => {
    const commandContainer = document.createElement("div");
    commandContainer.classList.add("command");

    const commandName = document.createElement("h3");
    commandName.textContent = command.name;
    commandContainer.appendChild(commandName);

    const commandDescription = document.createElement("p");
    commandDescription.textContent = commands[command].description;
    commandContainer.appendChild(commandDescription);

    const commandUsage = document.createElement("p");
    commandUsage.textContent = `Usage: ${commands[command].usage}`;
    commandContainer.appendChild(commandUsage);

    commandSection.appendChild(commandContainer);
  });
}