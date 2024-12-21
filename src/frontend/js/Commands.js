
setOptionActive("commands", true);
const prefix = commands.prefix;

const crossIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2"><path d="M18 6l-12 12"></path><path d="M6 6l12 12"></path></svg>`;
const tickIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2"><path d="M5 12l5 5l10 -10"></path></svg>`;

function renderCommands() {
  const tableData = document.querySelector(".table-data");

  const header = [
    "<tr>",
      "<th>Command</th>",
      "<th>Description</th>",
      "<th>Usage</th>",
      "<th>Usable without Auth?</th>",
    "</tr>",
  ].join("");

  tableData.innerHTML = header;

  // sort the commands based on if they are mod only or not
  const commandsSorted = Object.keys(commands.commands).sort((a, b) => {
    const cmdA = commands.commands[a];
    const cmdB = commands.commands[b];

    if (cmdA.auth && !cmdB.auth) return 1;
    if (!cmdA.auth && cmdB.auth) return -1;
    return 0;
  });

  commandsSorted.forEach((command) => {
    const cmd = commands.commands[command];

    const commandContainer = document.createElement("tr");

    const commandName = document.createElement("td");
    commandName.textContent = prefix + cmd.name;
    commandContainer.appendChild(commandName);

    const commandDescription = document.createElement("td");
    commandDescription.textContent = cmd.description;
    commandContainer.appendChild(commandDescription);

    const commandUsage = document.createElement("td");
    const paramLayout = "<{NAME}{REQUIRED} = {DEFAULT}>";

    commandUsage.innerHTML = `${prefix}${cmd.name} ` + cmd.parameters.map((param) => {
      const element = document.createElement("span");
      element.classList.add("command-param");

      const name = document.createElement("span");
      name.textContent = paramLayout
        .replace("{NAME}", param.name)
        .replace("{REQUIRED}", param.required ? "" : "?")
        .replace(" = {DEFAULT}", param.default ? `(${param.default})` : "");
        
      console.log("adding event listeners");
      
      element.addEventListener("mouseover", () => {
        console.log("showing tooltip");
        
        showTooltip(param.description, element);
      });
        
      element.addEventListener("mouseout", () => {
        if (currentTooltip) {
          currentTooltip.remove();
        }
      });
      
      element.appendChild(name);

      return element.outerHTML;
    }).join(" ");
    
    commandContainer.appendChild(commandUsage);
    
    const commandAuth = document.createElement("td");
    commandAuth.classList.add("center");
    const iconContainer = document.createElement("icon");
    iconContainer.innerHTML = cmd.auth ? crossIcon : tickIcon;

    if (cmd.auth) {
      iconContainer.classList.add("red");
    } else {
      iconContainer.classList.add("green");
    }

    commandAuth.appendChild(iconContainer);
    commandContainer.appendChild(commandAuth);

    tableData.appendChild(commandContainer);
  });
}

renderCommands();