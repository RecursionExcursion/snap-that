const downloadFlagKey = "dl";

const localStore = chrome.storage.local;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector("#popupContainer") as HTMLDivElement;
  const snapButton = document.querySelector("#snapButton") as HTMLButtonElement;
  const modeLabel = document.querySelector("#modeLabel") as HTMLLabelElement;
  const modeInput = document.querySelector("#modeInput") as HTMLInputElement;
  const messageLabel = document.querySelector(
    "#messageLabel"
  ) as HTMLLabelElement;

  /** @param {boolean} modeIsCopy  */
  const setInputMode = (modeIsCopy: boolean) => {
    modeInput.checked = modeIsCopy;
    saveDownloadModeFlag(!modeIsCopy);
  };

  const updateModeLabel = () => {
    modeLabel.textContent = modeInput.checked ? "COPY" : "DOWNLOAD";
  };
  
//   modeInput.hidden = true
  modeInput.checked = !(await isDownloadMode());
  messageLabel.hidden = true;
  updateModeLabel();
  container.style.display = "";

  snapButton.onclick = async () => {
    chrome.tabs.captureVisibleTab({ format: "png" }, async function (dataUrl) {
      let downloadModeToggled = await isDownloadMode();

      if (downloadModeToggled) {
        download(dataUrl);
      } else {
        try {
          copyToClipboard(dataUrl);
        } catch (err) {
          //If an error is throw or permission is not allowed, dl image
          setInputMode(false);
          downloadModeToggled = true;
          download(dataUrl);
          alert("Clipboard unsupported, image downloaded instead 📸");
        }
      }

      messageLabel.textContent = `Viewport ${
        downloadModeToggled ? "downloaded" : "copied"
      }!`;

      messageLabel.hidden = false;

      setTimeout(() => {
        messageLabel.hidden = true;
      }, 5000);
    });
  };

  modeInput.addEventListener("change", () => {
    updateModeLabel();
    setInputMode(modeInput.checked);
  });
});

function saveDownloadModeFlag(set: boolean) {
  if (set) {
    localStore.set({ [downloadFlagKey]: true });
  } else {
    localStore.remove(downloadFlagKey);
  }
}

async function isDownloadMode() {
  const dl = await localStore.get(downloadFlagKey);
  return dl[downloadFlagKey] ?? false;
}

function download(dataUrl: string) {
  chrome.downloads.download({
    url: dataUrl,
    filename: `viewport-snapshot-${Date.now()}.png`,
    saveAs: false,
  });
}

async function copyToClipboard(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
