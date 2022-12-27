const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

async function checkDeepl() {
  const startTime = new Date();
  let thresholdDiffSecond;
  chrome.storage.sync.get("thresholdDiffSecond", function (items) {
    if (typeof items.thresholdDiffSecond === "undefined") {
      thresholdDiffSecond = 10;
    } else {
      thresholdDiffSecond = items.thresholdDiffSecond;
    }
  });
  let translatedResult;
  let translatedResultInnerText;
  let currentTime;
  let diff;
  let diffSecond;
  while (true) {
    translatedResult = document.getElementsByClassName(
      "lmt__textarea lmt__target_textarea lmt__textarea_base_style"
    )[0];

    if (typeof translatedResult !== "undefined") {
      translatedResultInnerText = translatedResult.innerText;
      if (
        typeof translatedResultInnerText !== "undefined" &&
        translatedResultInnerText.length > 0 &&
        translatedResultInnerText != "\n"
      ) {
        return translatedResultInnerText;
      }
    }

    currentTime = new Date();
    diff = currentTime.getTime() - startTime.getTime();
    diffSecond = Math.floor(diff / 1000);

    if (diffSecond >= thresholdDiffSecond) {
      return 'Timeout has occurred. Please increase "threshold diff second" from the options screen.';
    }
    await sleep(1000);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "checkDeepl") {
    checkDeepl().then(sendResponse);
  }
  return true;
});

chrome.runtime.sendMessage({ type: "ready" });
