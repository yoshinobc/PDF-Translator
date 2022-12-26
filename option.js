// 設定画面で保存ボタンを押されたら
function saveOptions() {

  // 設定値を変数に格納
  var sourceLang = document.getElementById('sourceLang').value;
  var targetLang = document.getElementById('targetLang').value;
  var panelPos = document.getElementById('panelPos').value;
  var combination = document.getElementById('combination').value;

  // chromeアカウントと紐づくストレージに保存
  chrome.storage.sync.set({
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    panelPos: panelPos,
    combination: combination
  }, function() {
    // 保存できたら、画面にメッセージを表示(0.75秒だけ)
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// 設定画面で設定を表示する
function restoreOptions() {
  // デフォルト値は、ここで設定する
  chrome.storage.sync.get({
    sourceLanguage: 'en',
    targetLanguage: 'ja',
    panelPos : 'near',
    combination: 'empty'
  // 保存された値があったら、それを使う
  }, function(items) {
    document.getElementById('sourceLang').value = items.sourceLanguage;
    document.getElementById('targetLang').value = items.targetLanguage;
    document.getElementById('panelPos').value = items.panelPos;
    document.getElementById('combination').value = items.combination;
  });
}

// 画面表示と保存ボタンのイベントを設定
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
