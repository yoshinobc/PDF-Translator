function isPdfDownloadable(details) {
  if (details.url.includes("pdfjs.action=download")) {
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
  var cdHeader = getHeaderFromHeaders(headers, "content-disposition");
  if (!cdHeader) {
    cdHeader = {
      name: "Content-Disposition",
    };
    headers.push(cdHeader);
  }

  if (!/^attachment/i.test(cdHeader.value)) {
    cdHeader.value = "attachment" + cdHeader.value.replace(/^[^;]+/i, "");
    return {
      responseHeaders: headers,
    };
  }
  return undefined;
}

function isPdfFile(details) {
  var header = getHeaderFromHeaders(details.responseHeaders, "content-type");
  if (header) {
    var headerValue = header.value.toLowerCase().split(";", 1)[0].trim();
    if (headerValue === "application/pdf") {
      return true;
    }
    if (headerValue === "application/octet-stream") {
      if (details.url.toLowerCase().indexOf(".pdf") > 0) {
        return true;
      }
      var cdHeader = getHeaderFromHeaders(
        details.responseHeaders,
        "content-disposition"
      );
      if (cdHeader && /\.pdf(["']|$)/i.test(cdHeader.value)) {
        return true;
      }
    }
  }
  return false;
}

chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    chrome.storage.sync.get(null, function (items) {
      let isOn = items.ison;
      if (typeof isOn === "undefined") {
        isOn = true;
      }
      if (isPdfFile(details) && isOn) {
        if (isPdfDownloadable(details)) {
          return getHeadersWithContentDispositionAttachment(details);
        }
        let url = details.url;
        chrome.tabs.update({
          url: chrome.runtime.getURL(
            `/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`
          ),
        });
      }
    });
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame"],
  },
  ["blocking", "responseHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    chrome.storage.sync.get(null, function (items) {
      let isOn = items.ison;
      if (typeof isOn === "undefined") {
        isOn = true;
      }
      if (isOn) {
        if (isPdfDownloadable(details)) {
          return;
        }
        let url = details.url;
        chrome.tabs.update({
          url: chrome.runtime.getURL(
            `/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`
          ),
        });
      }
    });
  },
  {
    urls: [
      "file://*/*.pdf",
      "file://*/*.PDF",
      ...(MediaError.prototype.hasOwnProperty("message")
        ? []
        : ["ftp://*/*.pdf", "ftp://*/*.PDF"]),
    ],
    types: ["main_frame", "sub_frame"],
  },
  ["blocking"]
);

function getViewerURL(pdf_url) {
  return "/pdf.js/web / viewer.html" + "?file=" + encodeURIComponent(pdf_url);
}

chrome.extension.isAllowedFileSchemeAccess(function (isAllowedAccess) {
  if (isAllowedAccess) {
    return;
  }
  chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
    chrome.storage.sync.get(
      null,
      function (items) {
        let isOn = items.ison;
        if (typeof isOn === "undefined") {
          isOn = true;
        }
        if (details.frameId === 0 && !isPdfDownloadable(details) && isOn) {
          chrome.tabs.update(details.tabId, {
            url: getViewerURL(details.url),
          });
        }
      },
      {
        url: [
          {
            urlPrefix: "file://",
            pathSuffix: ".pdf",
          },
          {
            urlPrefix: "file://",
            pathSuffix: ".PDF",
          },
        ],
      }
    );
  });
});


const call_check_deepl = function (tab, current_time, sendResponse) {
  //console.log("call check deepl");
  const now_time = new Date();
  const diff = now_time.getTime() - current_time.getTime();
  const diffSecond = Math.floor(diff / 1000);
  //console.log("diffsec", diffSecond);
  if (diffSecond >= 7) {
    sendResponse({
      text: "",
    });
    return
  }
  chrome.tabs.sendMessage(
    tab.id,
    {
      type: "check_deepl",
    },
    function (response) {
      if (response) {
        const translatedtext = response;
        if (translatedtext != "") {
          sendResponse({
            text: translatedtext,
          });
          chrome.tabs.remove((tabids = tab.id));
        } else {
          setTimeout(call_check_deepl(tab, current_time, sendResponse), 1000);
        }
      } else {
        setTimeout(call_check_deepl(tab, current_time, sendResponse), 1000);
      }
    }
  );
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.sync.get(null, function (items) {
    let isOn = items.ison;
    if (typeof isOn === "undefined") {
      isOn = true;
    }
    if (request.type == "get_translated" && isOn) {
      const target_text = request.text.replace(/%2F/g, "%5C%2F"); //added
      const s_lang = request.s_lang;
      const t_lang = request.t_lang;
      const current_time = new Date();
      chrome.tabs.create(
        {
          url:
            "https://www.deepl.com/translator#" +
            s_lang +
            "/" +
            t_lang +
            "/" +
            target_text,
          active: false,
        },
        function (tab) {
          call_check_deepl(tab,current_time, sendResponse);
        }
      );
    }
  });
  return true;
});

function updateIcon() {
  let isOn;
  chrome.storage.sync.get("ison", function (items) {
    if (!chrome.runtime.error) {
      isOn = items.ison;
      if (typeof isOn === "undefined") {
        isOn = true;
      }
      console.log(isOn);
      if (isOn) {
        chrome.browserAction.setIcon({ path: "img/translation_off_16.png" });
        chrome.storage.sync.set({
          ison: false,
        });
      } else {
        chrome.browserAction.setIcon({ path: "img/translation_16.png" });
        chrome.storage.sync.set({
          ison: true,
        });
      }
    }
  });
}

chrome.browserAction.onClicked.addListener(updateIcon);
