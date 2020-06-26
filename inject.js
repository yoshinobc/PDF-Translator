//.(Capital Alphabet)を検出する.
const b = RegExp("(\.)([A-Z])", "g");
//(alphabet)-(alphabet)を検出する.
const haifun = RegExp("([a-zA-Z])(-)([a-zA-Z])", "g");

//パネルを消す
function removePanel() {
    console.log("remove panel");
    document.querySelector("div.text-panel").remove();
    document.removeEventListener("click", removePanel);
    document.addEventListener("click", translation);
};

//パネルをつける
function showPanel(text, clickEvent) {
    let panel = document.createElement("div");
    panel.setAttribute("class", "text-panel");
    panel.setAttribute("style", "top:"+clickEvent.pageY+"px;left:"+clickEvent.pageX+"px;");
    panel.innerHTML = text;
    document.firstElementChild.appendChild(panel);
    console.log("show panel");
};

//翻訳する．
function translation(clickEvent) {
    const text = document.getSelection().toString();
    let target_text;
    if (text.length <= 1) {
        return;
    }
    if (text.length >= 300) {
        console.log("too long");
        showPanel("Too Long. ", clickEvent);
        document.removeEventListener("click", translation);
        document.addEventListener("click", removePanel);
        return;
    }
    target_text = text.replace(/\r?\n/g, "");
    target_text = target_text.replace(b, "$1 $2");
    target_text = target_text.replace(haifun, "$1$3");
    target_text = encodeURIComponent(target_text);
    chrome.runtime.sendMessage(
        {
            type: "get_translated",
            text: target_text
        }, function (response) {
            showPanel(response.text, clickEvent);
            document.removeEventListener("click", translation);
            document.addEventListener("click", removePanel);
        }
    )
    /*apiを使った翻訳．
    const url = "https://www.deepl.com/translator#en/ja/" + target_text;
    let request = new XMLHttpRequest();
    request.open("GET", "https://api.deepl.com/v2/translate?auth_key=API_KEY&text=You%20can%20use&target_lang=ja&preserve_formatting=1");
    request.onreadystatechange = function () {
        if (request.readyState != 4) {
            //リクエスト中
        }
        else if (request.status != 200) {
            console.log("error");
        }
        else {
            const json = JSON.parse(request.responseText);
            showPanel(json.translations[0].text, clickEvent);
            document.removeEventListener("click", translation);
            document.addEventListener("click", removePanel);
        }
    }
    request.send(null);
    */
    return;
}
document.removeEventListener("click", removePanel);
document.addEventListener("click", translation);