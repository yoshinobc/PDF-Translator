let isOn = false;

function isPdfDownloadable(details) {
    if (details.url.includes('pdfjs.action=download')) {
        return true;
    }
}

function getHeaderFromHeaders(headers, headerName) {
    for (var i = 0; i < headers.length; ++i) {
        var header = headers[i];
        if (header.name.toLowerCase() === headerName) {
            return header;
        }
    }
    return undefined;
}

function getHeadersWithContentDispositionAttachment(details) {
    var headers = details.responseHeaders;
    var cdHeader = getHeaderFromHeaders(headers, 'content-disposition');
    if (!cdHeader) {
        cdHeader = {
            name: 'Content-Disposition',
        };
        headers.push(cdHeader);
    }

    if (!/^attachment/i.test(cdHeader.value)) {
        cdHeader.value = 'attachment' + cdHeader.value.replace(/^[^;]+/i, '');
        return {
            responseHeaders: headers,
        };
    }
    return undefined;
}

function isPdfFile(details) {
    var header = getHeaderFromHeaders(details.responseHeaders, 'content-type');
    if (header) {
        var headerValue = header.value.toLowerCase()
            .split(';', 1)[0].trim();
        if (headerValue === 'application/pdf') {
            return true;
        }
        if (headerValue === 'application/octet-stream') {
            if (details.url.toLowerCase()
                .indexOf('.pdf') > 0) {
                return true;
            }
            var cdHeader =
                getHeaderFromHeaders(details.responseHeaders, 'content-disposition');
            if (cdHeader && /\.pdf(["']|$)/i.test(cdHeader.value)) {
                return true;
            }
        }
    }
    return false;
}

chrome.webRequest.onHeadersReceived.addListener( function(details) {
    console.log("add listner: %s", details.url);
    if (isPdfFile(details) && isOn) {
        if (isPdfDownloadable(details)) {
            return getHeadersWithContentDispositionAttachment(details);
        }
        let url = details.url;
        chrome.tabs.update({
            url: chrome.runtime.getURL(`/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`)
        });
    }
}, {
        urls: [
        "<all_urls>"
        ],
    types: ["main_frame", "sub_frame"],
    },
    ["blocking", 'responseHeaders']);

chrome.webRequest.onBeforeRequest.addListener( function (details) {
    console.log("add listner: %s", details.url);
    if (isOn) {
        if (isPdfDownloadable(details)) {
            return ;
        }
        let url = details.url;
        chrome.tabs.update({
            url: chrome.runtime.getURL(`/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`)
        });
    }
}, {
    urls: [
        'file://*/*.pdf',
        'file://*/*.PDF',
        ...(
            MediaError.prototype.hasOwnProperty('message') ? [] : [
                'ftp://*/*.pdf',
                'ftp://*/*.PDF',
            ]
        ),
    ],
    types: ['main_frame', 'sub_frame'],
    },
    ["blocking"]
);

chrome.extension.isAllowedFileSchemeAccess(function (isAllowedAccess) {
    if (isAllowedAccess) {
        return;
    }
    chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
        if (details.frameId === 0 && !isPdfDownloadable(details)) {
            chrome.tabs.update(details.tabId, {
                url: getViewerURL(details.url),
            });
        }
    }, {
            url: [{
                urlPrefix: 'file://',
                pathSuffix: '.pdf',
            }, {
                urlPrefix: 'file://',
                pathSuffix: '.PDF',
            }],
        });
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