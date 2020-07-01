const b = /(\.)([A-Z])/g;
const haifun = RegExp("([a-zA-Z])(-)([a-zA-Z])", "g");
const koron = RegExp(":","g");
const semikoron = RegExp(";","g");

function removePanel(clickEvent) {
    const e = document.querySelector("div.text-panel");
    try {
        const eRect = e.getBoundingClientRect();
        if ((eRect.left <= clickEvent.pageX && clickEvent.pageX <= eRect.left + parseInt(window.getComputedStyle(e).width)) && eRect.top <= clickEvent.pageY && clickEvent.pageY <= eRect.top + parseInt(window.getComputedStyle(e).height)) {
            return;
        }
    }
    catch (e) {
        return;
    }
    document.querySelector("div.text-panel").remove();
    document.addEventListener("click", translation);
};

function removePanelUnder(clickEvent) {
    const e = document.querySelector("div.text-panel-under");
    try {
        const eRect = e.getBoundingClientRect();
        if ((eRect.left <= clickEvent.pageX && clickEvent.pageX <= eRect.left + parseInt(window.getComputedStyle(e).width)) && eRect.top <= clickEvent.pageY && clickEvent.pageY <= eRect.top + parseInt(window.getComputedStyle(e).height)) {
            return;
        }
    }
    catch (e) {
        return;
    }
    document.querySelector("div.text-panel-under").remove();
    document.addEventListener("click", translation);
}

function showPanel(text, clickEvent) {
    const extra = 20;
    let panel = document.createElement("div");
    panel.setAttribute("class", "text-panel");
    panel.setAttribute("contenteditable", true);
    const row = text.length / 32;
    let top;
    let left;
    if (row >= 2) {
        if (clickEvent.pageY + row * 27 >= window.innerHeight) {
            top = window.innerHeight - row * 27 - extra;
        }
        else {
            top = clickEvent.pageY;
        }

        if (clickEvent.pageX + 550 >= window.innerWidth) {
            left = clickEvent.pageX - (clickEvent.pageX + 550 - window.innerWidth) - extra;
        }
        else {
            left = clickEvent.pageX;
        }
        panel.setAttribute("style", "top:" + top + "px;left:" + left + "px;width:550px;");

    }
    else {
        panel.setAttribute("style", "top:" + clickEvent.pageY + "px;left:" + clickEvent.pageX + "px;");
    }
    panel.innerHTML = text;
    document.firstElementChild.appendChild(panel);
};

function showPanelUnder(text) {
    let panel = document.createElement("div");
    panel.setAttribute("class", "text-panel-under");
    panel.setAttribute("contenteditable", true);
    panel.innerHTML = text;
    document.firstElementChild.appendChild(panel);
}

function translation(clickEvent) {
    const text = document.getSelection().toString();
    let target_text;
    if (text.length <= 1) {
        return;
    }
    if (text.length >= 4800) {
        chrome.storage.sync.get(null, function (items) {
            let panel_pos = items.panel_pos;
            if (typeof panel_pos === "undefined") {
                panel_pos = "near";
            }
            if (panel_pos == "near") {
                showPanel("Too Long.", clickEvent);
            }
            else {
                showPanelUnder("Too Long.");
            }
            document.removeEventListener("click", translation);
            return;
        });
    }
    target_text = text.replace(/\r?\n/g, "");
    target_text = target_text.replace(b, "$1 $2");
    target_text = target_text.replace(haifun, "$1$3");
    target_text = target_text.replace(koron, ":\n");
    target_text = target_text.replace(semikoron, ";\n");
    target_text = encodeURIComponent(target_text);
    console.log("target_text:%s", target_text);
    chrome.storage.sync.get(null, function (items) {
        let s_lang = items.source_language;
        let t_lang = items.target_language;
        if (typeof s_lang === "undefined") {
            s_lang = "en";
        }
        if (typeof t_lang === "undefined") {
            t_lang = "ja";
        }
        chrome.runtime.sendMessage(
            {
                type: "get_translated",
                s_lang: s_lang,
                t_lang: t_lang,
                text: target_text
            }, function (response) {
                chrome.storage.sync.get(null, function (items) {
                    let panel_pos = items.panel_pos;
                    if (typeof panel_pos === "undefined") {
                        panel_pos = "near";
                    }
                    if (panel_pos == "near") {
                        showPanel(response.text, clickEvent);
                    }
                    else {
                        showPanelUnder(response.text);
                    }
                    document.removeEventListener("click", translation);
                    return;
                });
            }
        )
    });
    /*
    //apiを使った翻訳．
    let request = new XMLHttpRequest();
    request.open("GET", "https://api.deepl.com/v2/translate?auth_key=API_KEY&text=" + target_text + "&target_lang=ja&preserve_formatting=1");
    console.log("target_text: %s", target_text);
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
document.addEventListener("click", translation);
document.addEventListener("click", removePanel);
document.addEventListener("click", removePanelUnder);

