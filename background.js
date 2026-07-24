function getHeaderByName(headers, headerName) {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header.name.toLowerCase() === headerName) {
      return header;
    }
  }
  return null;
}

function isPdfFile(details) {
  const responseHeaders = details.responseHeaders || [];
  const header = getHeaderByName(responseHeaders, 'content-type');
  if (header) {
    const headerValue = (header.value || '')
      .toLowerCase()
      .split(';', 1)[0]
      .trim();
    if (headerValue === 'application/pdf') {
      return true;
    }
    if (headerValue === 'application/octet-stream') {
      if (details.url.toLowerCase().indexOf('.pdf') > 0) {
        return true;
      }
      const cdHeader = getHeaderByName(
        responseHeaders,
        'content-disposition'
      );
      if (cdHeader && /\.pdf(["']|$)/i.test(cdHeader.value || '')) {
        return true;
      }
    }
  }
  return false;
}

function getViewerURL(pdfUrl) {
  return chrome.runtime.getURL(
    `/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`
  );
}

function getIsOn(callback) {
  chrome.storage.sync.get('ison', function (items) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      callback(false);
      return;
    }
    callback(typeof items.ison === 'undefined' ? true : items.ison);
  });
}

function openPdfInViewer(details) {
  if (details.tabId < 0) {
    return;
  }

  getIsOn(function (isOn) {
    if (!isOn) {
      return;
    }

    chrome.tabs.update(
      details.tabId,
      {
        url: getViewerURL(details.url),
      },
      function () {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        }
      }
    );
  });
}

chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    if (isPdfFile(details)) {
      openPdfInViewer(details);
    }
  },
  {
    urls: ['http://*/*', 'https://*/*'],
    types: ['main_frame', 'sub_frame'],
  },
  ['responseHeaders']
);

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    openPdfInViewer(details);
  },
  {
    urls: ['file://*/*.pdf', 'file://*/*.PDF'],
    types: ['main_frame', 'sub_frame'],
  }
);

const pendingTranslations = new Map();
const readyTranslationTabs = new Set();

function getRuntimeErrorText(prefix) {
  if (!chrome.runtime.lastError) {
    return null;
  }
  return `${prefix}: ${chrome.runtime.lastError.message}`;
}

function closeTranslationTab(tabId) {
  chrome.tabs.remove(tabId, function () {
    const errorText = getRuntimeErrorText('Failed to close the DeepL tab');
    if (errorText) {
      console.error(errorText);
    }
  });
}

function finishTranslation(tabId, text) {
  const pending = pendingTranslations.get(tabId);
  if (!pending) {
    return;
  }

  pendingTranslations.delete(tabId);
  readyTranslationTabs.delete(tabId);
  pending.sendResponse({ text: text });
  closeTranslationTab(tabId);
}

function callCheckDeepl(tabId) {
  if (!pendingTranslations.has(tabId)) {
    return;
  }

  chrome.tabs.sendMessage(
    tabId,
    {
      type: 'checkDeepl',
    },
    function (response) {
      const errorText = getRuntimeErrorText(
        'Failed to communicate with the DeepL tab'
      );
      finishTranslation(tabId, errorText || response || 'Translation failed.');
    }
  );
}

function handleTranslationRequest(request, sendResponse) {
  getIsOn(function (isOn) {
    if (!isOn) {
      sendResponse({ text: 'PDF Translator is turned off.' });
      return;
    }

    const targetText = request.text.replace(/%2F/g, '%5C%2F');
    const deeplUrl =
      'https://www.deepl.com/translator#' +
      request.sourceLanguage +
      '/' +
      request.targetLanguage +
      '/' +
      targetText;

    chrome.tabs.create(
      {
        url: deeplUrl,
        active: false,
      },
      function (tab) {
        const errorText = getRuntimeErrorText('Failed to open DeepL');
        if (errorText || !tab || typeof tab.id === 'undefined') {
          sendResponse({ text: errorText || 'Failed to open DeepL.' });
          return;
        }

        pendingTranslations.set(tab.id, { sendResponse: sendResponse });
        if (readyTranslationTabs.has(tab.id)) {
          callCheckDeepl(tab.id);
        }
      }
    );
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'ready') {
    if (!sender.tab || typeof sender.tab.id === 'undefined') {
      return false;
    }

    const tabId = sender.tab.id;
    readyTranslationTabs.add(tabId);
    callCheckDeepl(tabId);
    return false;
  }

  if (request.type === 'getTranslated') {
    handleTranslationRequest(request, sendResponse);
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  readyTranslationTabs.delete(tabId);

  const pending = pendingTranslations.get(tabId);
  if (pending) {
    pendingTranslations.delete(tabId);
    pending.sendResponse({
      text: 'The DeepL tab was closed before translation completed.',
    });
  }
});

function setIcon(isOn) {
  chrome.action.setIcon(
    {
      path: isOn
        ? 'img/translation_16.png'
        : 'img/translation_off_16.png',
    },
    function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      }
    }
  );
}

function syncIcon() {
  getIsOn(setIcon);
}

function updateIcon() {
  getIsOn(function (isOn) {
    chrome.storage.sync.set({ ison: !isOn }, function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      setIcon(!isOn);
    });
  });
}

chrome.action.onClicked.addListener(updateIcon);
chrome.runtime.onInstalled.addListener(syncIcon);
chrome.runtime.onStartup.addListener(syncIcon);

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === 'sync' && changes.ison) {
    const isOn =
      typeof changes.ison.newValue === 'undefined'
        ? true
        : changes.ison.newValue;
    setIcon(isOn);
  }
});
