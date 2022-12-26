const capital = /(\.)([A-Z])/g;
const dash = RegExp('([a-zA-Z])(-)([a-zA-Z])', 'g');
const coron = RegExp(':', 'g');
const semicoron = RegExp(';', 'g');

function removePanel(mouseEvent) {
  const panel = document.querySelector('div.text-panel, div.text-panel-under');
  if (panel === null || mouseEvent.path.includes(panel)) {
    return;
  }
  panel.remove();
}

function showPanel(text, mouseEvent) {
  const extra = 20;
  const panel = document.createElement('div');
  panel.setAttribute('class', 'text-panel');
  panel.setAttribute('contenteditable', true);
  const row = text.length / 32;
  let top;
  let left;
  if (row >= 2) {
    if (mouseEvent.pageY + row * 27 >= window.innerHeight) {
      top = window.innerHeight - row * 27 - extra;
    } else {
      top = mouseEvent.pageY;
    }

    if (mouseEvent.pageX + 550 >= window.innerWidth) {
      left =
        mouseEvent.pageX - (mouseEvent.pageX + 550 - window.innerWidth) - extra;
    } else {
      left = mouseEvent.pageX;
    }
    if (top <= 42) {
      top = 42;
    }
    if (left <= 0) {
      left = 0;
    }
    panel.setAttribute(
      'style',
      'top:' + top + 'px;left:' + left + 'px;width:550px;'
    );
  } else {
    panel.setAttribute(
      'style',
      'top:' + mouseEvent.pageY + 'px;left:' + mouseEvent.pageX + 'px;'
    );
  }
  panel.innerText = text;
  document.firstElementChild.appendChild(panel);
}

function showPanelUnder(text) {
  let panel = document.createElement('div');
  panel.setAttribute('class', 'text-panel-under');
  panel.setAttribute('contenteditable', true);
  panel.innerHTML = text;
  document.firstElementChild.appendChild(panel);
}

function getCombinationOption() {
  return new Promise( (resolve) => {
    chrome.storage.sync.get('combination', (item) => {
        resolve(item['combination']);
    });

  });
}

async function translation(mouseEvent) {
  let combination = await getCombinationOption();
  if (combination === 'ctrl') {
    if (!mouseEvent.ctrlKey) return;
  }
  else if (combination === 'alt') {
    if (!mouseEvent.altKey) return;
  }
  else if (combination === 'command') {
    if (!mouseEvent.metaKey) return;
  }
  else if (combination === 'shift') {
    if (!mouseEvent.shiftKey) return;
  }

  const panel = document.querySelector('div.text-panel, div.text-panel-under');
  if (panel !== null && mouseEvent.path.includes(panel)) {
    return;
  }
  const text = document.getSelection().toString();
  let target_text;
  if (text.length <= 0) {
    return;
  }
  if (text.length >= 4900) {
    chrome.storage.sync.get(null, function (items) {
      let panelPosition = items.panelPosition;
      if (typeof panelPosition === 'undefined') {
        panelPosition = 'near';
      }
      if (panelPosition == 'near') {
        showPanel('Too Long.', mouseEvent);
      } else {
        showPanelUnder('Too Long.');
      }
    });
    return;
  }
  target_text = text.replace(/\r?\n/g, '');
  target_text = target_text.replace(capital, '$1 $2');
  target_text = target_text.replace(dash, '$1$3');
  target_text = target_text.replace(coron, ':\n');
  target_text = target_text.replace(semicoron, ';\n');
  target_text = encodeURIComponent(target_text);
  chrome.storage.sync.get(null, function (items) {
    let s_lang = items.source_language;
    let t_lang = items.target_language;
    if (typeof s_lang === 'undefined') {
      s_lang = 'en';
    }
    if (typeof t_lang === 'undefined') {
      t_lang = 'ja';
    }
    chrome.runtime.sendMessage(
      {
        type: 'get_translated',
        s_lang: s_lang,
        t_lang: t_lang,
        text: target_text,
      },
      function (response) {
        chrome.storage.sync.get(null, function (items) {
          let panelPosition = items.panelPosition;
          if (typeof panelPosition === 'undefined') {
            panelPosition = 'near';
          }
          if (panelPosition == 'near') {
            showPanel(response.text, mouseEvent);
          } else {
            showPanelUnder(response.text);
          }
        });
      }
    );
  });
  return;
}
document.addEventListener('mouseup', translation);
document.addEventListener('mousedown', removePanel);