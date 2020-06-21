document.addEventListener("selectionchange", function () {
    var source_text = window.getSelection().toString();
    const dot = RegExp("(\.)([A-Z])", "g");
    const haifun = RegExp("([a-zA-Z])(-)([a-zA-Z])", "g");
    console.log(source_text)
    setTimeout(function() {
        if (source_text == window.getSelection().toString()) {
            let target_text;
            target_text = source_text.replace(dot, "$1 $2")
            target_text = source_text.replace(haifun, "$1$3");
            console.log(target_text)
            chrome.runtime.sendMessage({
                text: target_text
            },
                function (response) {
                    if (response) {
                        console.log("resp" + response.text);
                    }
                }
            );
        }
    }, 1 * 1000);
});
