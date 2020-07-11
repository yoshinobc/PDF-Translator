function check_deepl() {
  //const translated_text = document.getElementsByClassName("lmt__textarea lmt__target_textarea lmt__textarea_base_style")[0];
  //return translated_text.value;
  let target = document.getElementsByClassName(
    "lmt__textarea lmt__target_textarea lmt__textarea_base_style"
  )[0];

  if (!target) {
    setTimeout(check_deepl, 1000);
  } else {
    if (target.value == "") {
      setTimeout(check_deepl, 1000);
    } else {
      return target.value;
    }
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
    var translatedtext = check_deepl();
    sendResponse(translatedtext);
  }
  return true;
});
