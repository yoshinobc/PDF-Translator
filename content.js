
const config = { attributes: true, childList: true, characterData: true, subtree: true };

//check_deeplリクエストを受け取って，エレメントから翻訳結果を見てそれを返す．
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "check_deepl") {
        console.log("check deepl")
        var translatedtext = check_deepl();
        console.log("translated: %s", translatedtext);
        sendResponse({
            text: translatedtext
        });
    }
    return true;
});

function check_deepl() {
    const translated_text = document.getElementsByClassName("lmt__textarea lmt__target_textarea lmt__textarea_base_style")[0];
    console.log("translated text: %s", translated_text);
    const observer = new MutationObserver(mutations => {
        mutations.forEach((mutation) => {
            if (!translated_text) {
                setTimeout(check_deepl, 1 * 1000);
                return;
            }
            else {
                if (translated_text == "") {
                    setTimeout(check_deepl, 1 * 1000);
                    return;
                }
                else {
                    return translated_text.value;
                }
            }
        })
    });
    observer.observe(translated_text, config);
}
