const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

async function check_deepl() {
  //const translated_text = document.getElementsByClassName("lmt__textarea lmt__target_textarea lmt__textarea_base_style")[0];
  //return translated_text.value;
  const start_time = new Date();
  while (true) {
    const target = document.getElementsByClassName(
      "lmt__textarea lmt__target_textarea lmt__textarea_base_style"
    )[0];
    if (target && target.value.length > 1) {
      return target.value;
    }

    const current_time = new Date();
    const diff = current_time.getTime() - start_time.getTime();
    const diffSecond = Math.floor(diff / 1000);
    if (diffSecond >= 7) {
      return "";
    }

    await sleep(1000);
  }
  /*
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {});
  });
  var config = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
  };
  observer.observe(target, config);
  */
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "check_deepl") {
    check_deepl().then(sendResponse);
  }
  return true;
});

chrome.runtime.sendMessage({ type: 'ready' });