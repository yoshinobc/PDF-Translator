var windowid = -1;


chrome.runtime.onMessage.addListener(function (message, sender, sendRes) {
    chrome.tabs.create({
        url: "https://www.deepl.com/translator#en/ja/" + encodeURIComponent(message.text)
    }
    );
    sendRes({ "text": "accept" });
    return true;
});


/*
window.addEventListener("message", function receive(event) {
    this.console.log("accept event");
    this.console.log(event.data.keyword);
    if (event.data.keyword) {
        const str = event.data.keyword;
        const str_length = str.length;
        if (str_length <= 3000) {
            this.setTimeout(function () {
                if (str == window.getSelection().toString()) {
                    let search_url;
                    let target_text;
                    target_text = source_text.replace(dot, "$1 $2")
                    target_text = source_text.replace(haifun, "$1$3");
                    chrome.tabs.create({
                        url: "https://www.deepl.com/translator#en/ja/" + encodeURIComponent(target_text)
                    }
                    )
                }
            }, 1);
        }
    }
}, false);



function translate() {
    if (windowid == -1) {
        chrome.windows.getCurrent(function (curWindow) {
            chrome.windows.create(
                {
                    "url": "console.html",
                    "focused": false,
                    "top": Math.round(curWindow.top + 6 / 10 * curWindow.height),
                    "left": curWindow.left,
                    "width": curWindow.width,
                    "height": Math.round(4 / 10 * curWindow.height)
                },
                function (newWindow) {
                    ttsId = newWindow.id;
                    ttsWindow = chrome.extension.getViews({ "windowId": ttsId })[0];

                    curOptions = options;

                    // Fastest timeout == 1 ms (@ options.rate = 10.0)
                    milliseconds = 10 / curOptions.rate;
                }
            );
        });
    } else {
        if (areNewOptions(options)) {
            curOptions = options;

            milliseconds = 10 / curOptions.rate;
        }

    }

};


chrome.contextMenus.create({
    title: "Translation by DeepL with Shaping",
    type: "normal",
    contexts: ["selection"],
    onclick: (info) => {
        const source_text = info.selectionText
        let target_text;
        target_text = source_text.replace(dot, "$1 $2")
        target_text = source_text.replace(haifun, "$1$3");
        chrome.tabs.create({
            url: "https://www.deepl.com/translator#en/ja/" + encodeURIComponent(target_text)
        }
        )
    }
});
*/