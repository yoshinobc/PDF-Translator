let isOn = false;

// ブラウザがPDFファイルを開こうとした時に，PDF.jsで変換されたhtmlページに遷移する．
chrome.webNavigation.onBeforeNavigate.addListener(details => {
    console.log("add listner: %s", details.url);
    if (details.url.endsWith(".pdf") && isOn) {
        if (details.url.startsWith("file:///")) {
            chrome.extension.isAllowedFileSchemeAccess(function (isAllowedAccess) {
                if (!isAllowedAccess) {
                    chrome.tabs.update(details.tabId, {
                        url: chrome.runtime.getURL("allow_access_to_file.html")
                    });
                }
            });
        }
        let url = details.url;
        if (url.startsWith("file:///")) {
            url = url.substring(8, url.length);
        }
        chrome.tabs.update({
            url: chrome.runtime.getURL(`/pdf.js/web/viewer.html?file=${url}`)
        });
    }
});

const call_check_deepl = function (tab, sendResponse) {
    setTimeout(function () {
        chrome.tabs.sendMessage(tab.id,
            {
                type: "check_deepl"
            },
            function (response) {
                console.log("tranlatedtext:%s", response.text);
                const translatedtext = response.text; //ここでエラーが出る．
                console.log("translated: %s", translatedtext);
                if (translatedtext == "") {
                    console.log("background if");
                    setTimeout(call_check_deepl(tab, sendResponse), 1 * 100);
                }
                else {
                    console.log("background sendResponse:%s", translatedtext);
                    sendResponse({
                        text: translatedtext
                    });
                    chrome.tabs.remove(tabids = tab.id);
                }
            }
        )
    }, 1 * 1000);
}

//inject.jsからget_translatedリクエストがきた時に，翻訳結果を返す
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("get translate: %s", request.type);
    if (request.type == "get_translated" && isOn) {
        console.log("call translate");
        const target_text = request.text;
        chrome.tabs.create(
            {
                url: "https://www.deepl.com/translator#ja/en/" + target_text,
                active: false
            },
            function (tab) {
                call_check_deepl(tab, sendResponse);
            });
    }
    return true;
});

function updateIcon() {
    if (isOn) {
        chrome.browserAction.setIcon({ path:"img/translation_off_16.png"});
        isOn = false;
    }
    else {
        chrome.browserAction.setIcon({ path:"img/translation_16.png"});
        isOn = true;
    }
}
chrome.browserAction.onClicked.addListener(updateIcon);
updateIcon();