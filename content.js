const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

async function checkDeepl() {
  //const translated_text = document.getElementsByClassName('lmt__textarea lmt__target_textarea lmt__textarea_base_style')[0];
  //return translated_text.value;
  const startTime = new Date();
  while (true) {
    const target = document.getElementsByClassName(
      'lmt__textarea lmt__target_textarea lmt__textarea_base_style'
    )[0];
    if (target && target.value.length > 0) {
      return target.value;
    }

    const currentTime = new Date();
    const diff = currentTime.getTime() - startTime.getTime();
    const diffSecond = Math.floor(diff / 1000);
    if (diffSecond >= 7) {
      return '';
    }

    await sleep(1000);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'checkDeepl') {
    checkDeepl().then(sendResponse);
  }
  return true;
});

chrome.runtime.sendMessage({ type: 'ready' });