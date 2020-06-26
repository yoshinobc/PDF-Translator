// ブラウザがPDFファイルを開こうとした時に，PDF.jsで変換されたhtmlページに遷移する．
chrome.webNavigation.onBeforeNavigate.addListener(details => {
    console.log("add listner: %s", details.url);
    if (details.url.endsWith(".pdf")) {
        if (details.url.startsWith("file:///")) {
            chrome.extension.isAllowedFileSchemeAccess(function (isAllowedAccess) {
                if (!isAllowedAccess) {
                    chrome.tabs.update(details.tabId, {
                        url: chrome.runtime.getURL("/open_extensions_page.html")
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

//inject.jsからget_translatedリクエストがきた時に，翻訳結果を返す
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("get translate: %s", request.type);
    if (request.type == "get_translated") {
        //タブが作成された時に，check_deepl(content.js)をリクエストする．
        chrome.tabs.onCreated.addListener(function (tab) {
            console.log("oncrreate");
            chrome.tabs.sendMessage(tab.id,
                {
                    type: "check_deepl"
                },
                function (response) {
                    console.log("tranlatedtext:%s", response.text);
                    const translatedtext = response.text; //ここでエラーが出る．
                    console.log("translated: %s", translatedtext);
                    sendResponse({
                        text: translatedtext
                    });
                    chrome.tabs.remove(tabids = tab.id);
                }
            );
        });
        get_translatedtext(request.text); //タブ作成
    }
    return true;
});

//指定されたテキストの翻訳タブを作成する．
function get_translatedtext(target_text) {
    console.log("call translate");
    chrome.tabs.create(
        {
            url: "https://www.deepl.com/translator#ja/en/" + target_text,
            active: false
        }
    );
}