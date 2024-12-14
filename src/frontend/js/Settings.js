let currentTooltip = null;
let currentModal = null;

const configSettings = [
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
        description: "When authenticating, this is the username that will be used to authenticate, and any other attempts will be blocked.",
        input: {
          type: "input",
          value: data.config.expected_user.name,
          disabled: false
        }
      },
      {
        text: "User ID",
        description: "The ID of the user that is expected to authenticate.",
        input: {
          type: "input",
          value: data.config.expected_user.id,
          disabled: false
        }
      },
      {
        text: "Broadcaster Username",
        description: "The username of the broadcaster that the server is listening to.",
        input: {
          type: "input",
          value: data.config.channel.name,
          disabled: false
        }
      },
      {
        text: "Broadcaster ID",
        description: "The ID of the broadcaster that the server is listening to.",
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
        description: "Ngrok is a service that allows you to host a server on your local machine and have it accessible from the internet. This is useful for testing webhooks locally.",
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
        description: "How often the server should backup data",
        input: {
          type: "time_input",
          value: data.config.backup_frequency,
          disabled: false
        }
      },
      {
        text: "Verify Signature",
        description: "Verify the signature of the incoming requests to ensure they are from Twitch. Disabling this allows for anyone to send data to the server.",
        confirm_disable: true,
        confirmation_disable_message: [
          "Are you sure you want to disable signature verification?",
          "Disabling this allows for anyone to send Twitch data to the server."
        ],
        input: {
          type: "switch",
          value: data.config.verify_signature,
          disabled: false
        }
      }
    ]
  }
]

const subathonSettings = [
  {
    title: "General Settings",
    options: [
      {
        text: "Currency",
        description: "The currency that is used globally for the subathon.",
        input: {
          type: "input",
          value: data.config.currency,
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
  } else if (tab === "subathon") {
    usedSettings = subathonSettings;
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

      if (option.description) {
        const optionQuestion = document.createElement("div");
        optionQuestion.classList.add("setting_question");
        optionQuestion.innerText = "?";
        optionQuestion.addEventListener("mouseover", () => {
          showTooltip(option.description, optionQuestion);
        });
        optionQuestion.addEventListener("mouseout", () => {
          if (currentTooltip) {
            currentTooltip.remove();
          }
        });
        optionText.appendChild(optionQuestion);
      }

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
            if (option.confirm_disable && !optionSwitchInput.checked) {
              optionSwitchInput.checked = true;
              confirmationModal("Confirm?", option.confirmation_disable_message.join("\n"), (response) => {
                if (response === "confirm") {
                  optionSwitchInput.checked = false;
                  option.input.value = optionSwitchInput.checked;
                  renderSettings("config");
                } else {
                  optionSwitchInput.checked = true;
                }
              });
            }

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
setOptionActive("settings", true);

document.querySelectorAll(".sidebar-option").forEach((tab) => {
  if (!tab.hasAttribute("tab")) return;
  const tabName = tab.attributes["tab"].value;
  if(!tabName) return;
  tab.addEventListener("click", () => {
    renderSettings(tabName, "subathon");

    document.querySelectorAll(".sidebar-option[tab]").forEach((tab) => {
      tab.classList.remove("active");
    });
    tab.classList.add("active");
  });
});

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

function confirmationModal(text, description, confirmCallback) {
  if (currentModal) {
    currentModal.remove();
  }
  const modal = document.createElement("div");
  modal.classList.add("modal");

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  const modalText = document.createElement("div");
  modalText.classList.add("modal-text");
  modalText.innerText = text;
  modalContent.appendChild(modalText);

  const modalDescription = document.createElement("div");
  modalDescription.classList.add("modal-description");
  modalDescription.innerText = description;
  modalContent.appendChild(modalDescription);

  const modalButtons = document.createElement("div");
  modalButtons.classList.add("modal-buttons");

  const modalConfirm = document.createElement("button");
  modalConfirm.classList.add("modal-button");
  modalConfirm.classList.add("no-round");
  modalConfirm.classList.add("button-red");
  modalConfirm.innerText = "Confirm";
  modalConfirm.addEventListener("click", () => {
    confirmCallback("confirm");
    modal.remove();
  });
  modalButtons.appendChild(modalConfirm);

  const modalCancel = document.createElement("button");
  modalCancel.classList.add("modal-button");
  modalCancel.innerText = "Cancel";
  modalCancel.classList.add("no-round");
  modalCancel.addEventListener("click", () => {
    confirmCallback("cancel");
    modal.remove();
  });
  modalButtons.appendChild(modalCancel);

  modalContent.appendChild(modalButtons);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  currentModal = modal;
}