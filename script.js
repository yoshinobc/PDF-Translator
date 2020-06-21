const dot = RegExp("(\.)([A-Z])", "g");
const haifun = RegExp("([a-zA-Z])(-)([a-zA-Z])", "g");

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
            url: "https://www.deepl.com/translator#en/ja/"+ encodeURIComponent(target_text)}
        )
    }
})