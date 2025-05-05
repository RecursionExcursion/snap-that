document.addEventListener("DOMContentLoaded", () => {
  /** @type {HTMLButtonElement| null} */
  const snapButton = document.querySelector("#snapButton");

  /** @type {HTMLLabelElement| null} */
  const modeLabel = document.querySelector("#modeLabel");

  /** @type {HTMLInputElement| null} */
  const modeInput = document.querySelector("#modeInput");

  /** @type {HTMLLabelElement| null} */
  const messageLabel = document.querySelector("#messageLabel");

  if (!snapButton || !modeLabel || !modeInput || !messageLabel) {
    return;
  }

  messageLabel.hidden = true;
  modeInput.checked = true;

  const updateModeLabel = () => {
    modeLabel.textContent = modeInput.checked ? "COPY" : "DOWNLOAD";
  };

  updateModeLabel();

  snapButton.onclick = () => {
    // @ts-ignore chrome will be supported in browser
    chrome.tabs.captureVisibleTab({ format: "png" }, async function (dataUrl) {
      let modeIsCopy = modeInput.checked;

      if (!modeIsCopy) {
        download(dataUrl);
      } else {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob }),
          ]);
        } catch (err) {
          //If an error is throw or permission is not allowed, dl image
          console.warn(
            "Clipboard write failed, falling back to download:",
            err
          );
          modeInput.checked = false;
          modeIsCopy = false;
          download(dataUrl);
          alert("Clipboard unsupported, image downloaded instead 📸");
        }
      }

      messageLabel.textContent = `Viewport ${
        modeIsCopy ? "copied" : "downloaded"
      }!`;
      messageLabel.hidden = false;
      setInterval(() => {
        messageLabel.hidden = true;
      }, 5000);
    });
  };


  //TODO SAVE TO CHROME MEMORY
  modeInput.addEventListener("change", () => {
    updateModeLabel();
  });
});

/** @param {string} dataUrl  */
function download(dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `viewport-snapshot-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
