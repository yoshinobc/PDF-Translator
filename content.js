const config = { attributes: true, childList: false, characterData: false, subtree: false };


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "check_deepl") {
        var translatedtext = check_deepl();
        sendResponse({
            text: translatedtext
        });
    }
    return true;
});

function check_deepl() {
    const translated_text = document.getElementsByClassName("lmt__textarea lmt__target_textarea lmt__textarea_base_style")[0];
    return translated_text.value;
}