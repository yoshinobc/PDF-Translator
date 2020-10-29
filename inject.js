const b = /(\.)([A-Z])/g;
const haifun = RegExp("([a-zA-Z])(-)([a-zA-Z])", "g");
const koron = RegExp(":", "g");
const semikoron = RegExp(";", "g");
var tablist = [];

function removePanel(mouseEvent) {
  const panel = document.querySelector("div.text-panel, div.text-panel-under");
  if (panel === null || mouseEvent.path.includes(panel)) {
    return;
  }
  panel.remove();
  while (tablist.length > 0) {
    const removetabid = tablist.shift();
    chrome.tabs.remove(removetabid);
  }
}

function showPanel(text, mouseEvent) {
  const extra = 20;
  const panel = document.createElement("div");
  panel.setAttribute("class", "text-panel");
  panel.setAttribute("contenteditable", true);
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
      "style",
      "top:" + top + "px;left:" + left + "px;width:550px;"
    );
  } else {
    panel.setAttribute(
      "style",
      "top:" + mouseEvent.pageY + "px;left:" + mouseEvent.pageX + "px;"
    );
  }
  panel.innerText = text;
  document.firstElementChild.appendChild(panel);
}

function showPanelUnder(text) {
  let panel = document.createElement("div");
  panel.setAttribute("class", "text-panel-under");
  panel.setAttribute("contenteditable", true);
  panel.innerHTML = text;
  document.firstElementChild.appendChild(panel);
}

function translation(mouseEvent) {
  const panel = document.querySelector("div.text-panel, div.text-panel-under");
  if (panel !== null && mouseEvent.path.includes(panel)) {
    return;
  }
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
        showPanel("Too Long.", mouseEvent);
      } else {
        showPanelUnder("Too Long.");
      }
    });
    return;
  }
  target_text = text.replace(/\r?\n/g, "");
  target_text = target_text.replace(b, "$1 $2");
  target_text = target_text.replace(haifun, "$1$3");
  target_text = target_text.replace(koron, ":\n");
  target_text = target_text.replace(semikoron, ";\n");
  target_text = encodeURIComponent(target_text);
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
        text: target_text,
      },
      function (response) {
        chrome.storage.sync.get(null, function (items) {
          let panel_pos = items.panel_pos;
          if (typeof panel_pos === "undefined") {
            panel_pos = "near";
          }
          if (panel_pos == "near") {
            showPanel(response.text, mouseEvent);
          } else {
            showPanelUnder(response.text);
          }
          tablist.push(response.tabid);
          //chrome.tabs.remove(response.tabid);
        });
      }
    );
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
document.addEventListener("mouseup", translation);
document.addEventListener("mousedown", removePanel);