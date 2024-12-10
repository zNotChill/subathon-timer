
let configSettings = [
  {
    title: "Client Settings",
    options: [
      {
        text: "ID",
        input: {
          type: "input",
          value: data.config.client.id,
          disabled: false
        }
      }
    ]
  },
  {
    title: "Authentication",
    options: [
      {
        text: "Username",
        input: {
          type: "input",
          value: data.config.expected_user.name,
          disabled: false
        }
      },
      {
        text: "User ID",
        input: {
          type: "input",
          value: data.config.expected_user.id,
          disabled: false
        }
      },
      {
        text: "Broadcaster Username",
        input: {
          type: "input",
          value: data.config.channel.name,
          disabled: false
        }
      },
      {
        text: "Broadcaster ID",
        input: {
          type: "input",
          value: data.config.channel.id,
          disabled: false
        }
      }
    ]
  },
  {
    title: "Ngrok Hosting",
    options: [
      {
        text: "Using Ngrok?",
        input: {
          type: "switch",
          value: data.config.use_ngrok,
          disabled: false
        }
      },
      {
        text: "Ngrok URL",
        input: {
          type: "input",
          value: data.config.ngrok_url,
          disabled: !data.config.use_ngrok
        }
      }
    ]
  },
  {
    title: "Data Safety",
    options: [
      {
        text: "Backup Frequency",
        input: {
          type: "time_input",
          value: data.config.backup_frequency,
          disabled: false
        }
      },
      {
        text: "Verify Signature",
        input: {
          type: "switch",
          value: data.config.verify_signature,
          disabled: false
        }
      }
    ]
  }
]

function renderSettings(tab) {
  let usedSettings;

  if (tab === "config") {
    usedSettings = configSettings;
  }

  // Causes sliders to not animate
  // but who cares rn
  const settings = document.querySelector(".settings-container");
  settings.innerHTML = "";
  
  usedSettings.forEach((setting) => {
    const settings = document.querySelector(".settings-container");
    const settingSection = document.createElement("div");
    settingSection.classList.add("setting-section");

    const sectionTitle = document.createElement("div");
    sectionTitle.classList.add("settings-section_title");
    sectionTitle.innerText = setting.title;
    settingSection.appendChild(sectionTitle);

    setting.options.forEach((option) => {
      const optionContainer = document.createElement("div");
      optionContainer.classList.add("settings-option");

      const optionText = document.createElement("div");
      optionText.classList.add("setting_text");
      optionText.innerText = option.text;
      optionContainer.appendChild(optionText);

      const optionInputContainer = document.createElement("div");
      optionInputContainer.classList.add("setting_input");
      optionContainer.appendChild(optionInputContainer);

      // const optionInput = document.createElement(option.input.type);
      // optionInput.value = option.input.value;
      // optionInput.disabled = option.input.disabled;
      // optionInputContainer.appendChild(optionInput);
      switch (option.input.type) {
        case "input": {
          const optionInput = document.createElement("input");
          optionInput.value = option.input.value;
          optionInput.disabled = option.input.disabled;
          optionInputContainer.appendChild(optionInput);
          break;
        }
        case "switch": {
          const optionSwitch = document.createElement("label");
          optionSwitch.classList.add("switch");
          const optionSwitchInput = document.createElement("input");
          optionSwitchInput.type = "checkbox";
          optionSwitchInput.checked = option.input.value;
          optionSwitchInput.disabled = option.input.disabled;
          const optionSwitchSpan = document.createElement("span");
          optionSwitchSpan.classList.add("slider", "round");
          optionSwitch.appendChild(optionSwitchInput);
          optionSwitch.appendChild(optionSwitchSpan);
          optionInputContainer.appendChild(optionSwitch);

          optionSwitchInput.addEventListener("change", () => {
            option.input.value = optionSwitchInput.checked;
            renderSettings("config");
          });
          break;
        }
      }

      settingSection.appendChild(optionContainer);
    });
    
    settings.appendChild(settingSection);
  });
}

renderSettings("config");