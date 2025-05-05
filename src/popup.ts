const downloadFlagKey = "dl";

const localStore = chrome.storage.local;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector("#popupContainer") as HTMLDivElement;
  const snapButton = document.querySelector("#snapButton") as HTMLButtonElement;
  const messageLabel = document.querySelector(
    "#messageLabel"
  ) as HTMLLabelElement;

  const modeButton = document.querySelector("#modeButton") as HTMLButtonElement;

  const setInputMode = (modeIsDownload: boolean) => {
    saveDownloadModeFlag(modeIsDownload);
  };

  const updateModeButton = async (b: boolean) => {
    modeButton.textContent = b ? "Download" : "Copy";
  };

  messageLabel.hidden = true;
  updateModeButton(await isDownloadMode());
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

  modeButton.onclick = async () => {
    const newMode = !(await isDownloadMode());
    saveDownloadModeFlag(newMode);
    updateModeButton(newMode);
    setInputMode(newMode);
  };
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
