// 設定画面で保存ボタンを押されたら
function saveOptions() {
  // 設定値を変数に格納
  var sourceLanguage = document.getElementById("sourceLanguage").value;
  var targetLanguage = document.getElementById("targetLanguage").value;
  var panelPosition = document.getElementById("panelPosition").value;
  var combination = document.getElementById("combination").value;
  var thresholdDiffSecond = document.getElementById(
    "thresholdDiffSecond"
  ).value;

  // chromeアカウントと紐づくストレージに保存
  chrome.storage.sync.set(
    {
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      panelPosition: panelPosition,
      combination: combination,
      thresholdDiffSecond: thresholdDiffSecond,
    },
    function () {
      // 保存できたら、画面にメッセージを表示(0.75秒だけ)
      var status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
    }
  );
}

// 設定を表示する
function restoreOptions() {
  chrome.storage.sync.get(
    {
      sourceLanguage: "en",
      targetLanguage: "ja",
      panelPosition: "near",
      combination: "empty",
      thresholdDiffSecond: 10,
    },
    function (items) {
      document.getElementById("sourceLanguage").value = items.sourceLanguage;
      document.getElementById("targetLanguage").value = items.targetLanguage;
      document.getElementById("panelPosition").value = items.panelPosition;
      document.getElementById("combination").value = items.combination;
      document.getElementById("thresholdDiffSecond").value =
        items.thresholdDiffSecond;
    }
  );
}

// 画面表示と保存ボタンのイベントを設定
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
