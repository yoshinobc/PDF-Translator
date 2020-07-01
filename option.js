// 設定画面で保存ボタンを押されたら
function save_options() {

  // 設定値を変数に格納
  var source_lang = document.getElementById("s_lang").value;
  var target_lang = document.getElementById("t_lang").value;

  // chromeアカウントと紐づくストレージに保存
  chrome.storage.sync.set({
    source_language: source_lang,
    target_language: target_lang

  }, function() {
    // 保存できたら、画面にメッセージを表示(0.75秒だけ)
    var status = document.getElementById("status");
    status.textContent = "Options saved.";
    setTimeout(function() {
      status.textContent = "";
    }, 750);
  });
}

// 設定画面で設定を表示する
function restore_options() {
  // デフォルト値は、ここで設定する
  chrome.storage.sync.get({
    source_language: "en",
    target_language: "ja"

  // 保存された値があったら、それを使う
  }, function(items) {
    document.getElementById("s_lang").value = items.source_language;
    document.getElementById("t_lang").value = items.target_language;
  });
}

// 画面表示と保存ボタンのイベントを設定
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
