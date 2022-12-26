function isPdfDownloadable(details) {
  if (details.url.includes('pdfjs.action=download')) {
    return true;
  }
}

function getHeaderByName(headers, headerName) {
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (header.name.toLowerCase() === headerName) {
      return header;
    }
  }
  return null;
}

function getHeadersWithContentDispositionAttachment(details) {
  let headers = details.responseHeaders;
  let cdHeader = getHeaderByName(headers, 'content-disposition');
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
  var header = getHeaderByName(details.responseHeaders, 'content-type');
  if (header) {
    var headerValue = header.value.toLowerCase().split(';', 1)[0].trim();
    if (headerValue === 'application/pdf') {
      return true;
    }
    if (headerValue === 'application/octet-stream') {
      if (details.url.toLowerCase().indexOf('.pdf') > 0) {
        return true;
      }
      var cdHeader = getHeaderByName(
        details.responseHeaders,
        'content-disposition'
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
    chrome.storage.sync.get('ison', function (items) {
      let isOn = items.ison;
      if (typeof isOn === 'undefined') {
        isOn = true;
      }
      if (isOn && isPdfFile(details)) {
        if (isPdfDownloadable(details)) {
          return getHeadersWithContentDispositionAttachment(details);
        }
        let url = details.url;
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL(
            `/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`
          ),
        });
      }
    });
  },
  {
    urls: ['<all_urls>'],
    types: ['main_frame', 'sub_frame'],
  },
  ['blocking', 'responseHeaders']
);

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    chrome.storage.sync.get(null, function (items) {
      let isOn = items.ison;
      if (typeof isOn === 'undefined') {
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
      'file://*/*.pdf',
      'file://*/*.PDF',
      ...(MediaError.prototype.hasOwnProperty('message')
        ? []
        : ['ftp://*/*.pdf', 'ftp://*/*.PDF']),
    ],
    types: ['main_frame', 'sub_frame'],
  },
  ['blocking']
);

function getViewerURL(pdfUrl) {
  return '/pdf.js/web / viewer.html' + '?file=' + encodeURIComponent(pdfUrl);
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
        if (typeof isOn === 'undefined') {
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
            urlPrefix: 'file://',
            pathSuffix: '.pdf',
          },
          {
            urlPrefix: 'file://',
            pathSuffix: '.PDF',
          },
        ],
      }
    );
  });
});


const callCheckDeepl = function (tab, sendResponse) {
  chrome.tabs.sendMessage(
    tab.id,
    {
      type: 'checkDeepl',
    },
    function (response) {
      const translatedtext = response;
      sendResponse({
        text: translatedtext,
      });
      chrome.tabs.remove(tab.id);
    }
  );
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.sync.get(null, function (items) {
    let isOn = items.ison;
    if (typeof isOn === 'undefined') {
      isOn = true;
    }
    if (request.type == 'getTranslated' && isOn) {
      const targetText = request.text.replace(/%2F/g, '%5C%2F'); //added
      const sourceLang = request.sourceLang;
      const targetLang = request.targetLang;
      chrome.tabs.create(
        {
          url:
            'https://www.deepl.com/translator#' +
            sourceLang +
            '/' +
            targetLang +
            '/' +
            targetText,
          active: false,
        },
        function (tab) {
          /*
           * `chrome.tabs.create()` 直後は，生成されたタブにメッセージのリスナが存在しない．
           * リスナが存在しないタブに対して `chrome.tabs.sendMessage()` を行ってしまうと，次のエラーが発生する．
           * > Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
           * このため，リスナが登録されたことを確認してから `chrome.tabs.sendMessage()` を行う必要がある．
           * 生成されたタブから自発的に `ready` メッセージが送られて来れば，リスナが登録されたとわかる．
           */
          const listener = (message, sender) => {
            if (message.type !== 'ready' || sender.tab.id !== tab.id) {
              return;
            }

            chrome.runtime.onMessage.removeListener(listener);
            callCheckDeepl(tab, sendResponse);
          }
          chrome.runtime.onMessage.addListener(listener);
        }
      );
    }
  });
  return true;
});

function updateIcon() {
  let isOn;
  chrome.storage.sync.get('ison', function (items) {
    if (!chrome.runtime.error) {
      isOn = items.ison;
      if (typeof isOn === 'undefined') {
        isOn = true;
      }
      console.log(isOn);
      if (isOn) {
        chrome.browserAction.setIcon({ path: 'img/translation_off_16.png' });
        chrome.storage.sync.set({
          ison: false,
        });
      } else {
        chrome.browserAction.setIcon({ path: 'img/translation_16.png' });
        chrome.storage.sync.set({
          ison: true,
        });
      }
    }
  });
}

chrome.browserAction.onClicked.addListener(updateIcon);
