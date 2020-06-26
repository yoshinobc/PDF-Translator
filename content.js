console.log("started");

const config = { attributes: true, childList: false, characterData: false, subtree: false };

//check_deeplリクエストを受け取って，エレメントから翻訳結果を見てそれを返す．
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "check_deepl") {
        console.log("check deepl");
        var translatedtext = check_deepl();
        console.log("sendResponse translated: %s", translatedtext);
        sendResponse({
            text: translatedtext
        });
    }
    return true;
});

function check_deepl() {
    const translated_text = document.getElementsByClassName("lmt__textarea lmt__target_textarea lmt__textarea_base_style")[0];
    console.log("object : %s", translated_text);
    console.log("translated text: %s", translated_text.value);
    return translated_text.value;
    const observer = new MutationObserver(mutations => {
        mutations.forEach((mutation) => {
            if (!translated_text) {
                console.log("!translated_text");
                setTimeout(check_deepl, 1 * 1000);
                return;
            }
            else {
                if (translated_text.value == "") {
                    console.log('translated_text == ""');
                    setTimeout(check_deepl, 1 * 1000);
                    return;
                }
                else {
                    console.log("return object : %s", translated_text);
                    console.log("return translated text: %s", translated_text.value);
                    return translated_text.value;
                }
            }
        })
    });
    observer.observe(translated_text, config);
}