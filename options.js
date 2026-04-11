// options.html において config.js を先に読み込んでおく必要がある
// --- 1. タブの切り替え処理 ---
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        const target = document.getElementById(this.dataset.target);
        target.classList.add('active');
        
        // section-advanced に遷移した場合は、現在の UI 状態を JSON エディタに反映する
        if (this.dataset.target === 'section-advanced') {
            updateJsonEditorFromUI();
        }
    });
});

// --- 2. カラーピッカーとテキスト入力の連動 ---
function bindColorInputs(pickerElement, textElement, clearButton) {
    pickerElement.addEventListener('input', (e) => {
        textElement.value = e.target.value;
        // ピッカー操作時も念のため input イベントを発火させて同期を確実にする
        textElement.dispatchEvent(new Event('input', { bubbles: true }));
    });

    textElement.addEventListener('input', (e) => {
        const val = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            pickerElement.value = val;
        }
    });

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            textElement.value = "transparent";
            pickerElement.value = "#ffffff"; // カラーピッカーは透明を選べないため、見た目上は白にする
            
            // input を発火させて内部の変数 (kw.backgroundColor 等) を更新
            textElement.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }
}

// 固定 UI 要素のバインディング（文字色には第3引数を渡さない）
bindColorInputs(document.getElementById('br-text-color-picker'), document.getElementById('br-text-color'));
bindColorInputs(document.getElementById('br-bg-color-picker'), document.getElementById('br-bg-color'), document.getElementById('br-bg-color-clear'));
bindColorInputs(document.getElementById('def-text-color-picker'), document.getElementById('def-text-color'));
bindColorInputs(document.getElementById('def-bg-color-picker'), document.getElementById('def-bg-color'), document.getElementById('def-bg-color-clear'));
bindColorInputs(document.getElementById('def-underline-color-picker'), document.getElementById('def-underline-color'), document.getElementById('def-underline-color-clear'));

function updateColorPickerUI(pickerElement, textElement, colorValue) {
    textElement.value = colorValue;
    if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
        pickerElement.value = colorValue;
    } else {
        pickerElement.value = "#ffffff"; // transparent等の場合は白にリセットしておく
    }
}

// --- 3. キーワードリストの動的生成 ---
let currentKeywords = [];

function renderKeywordList() {
    const container = document.getElementById('keyword-list-container');
    container.innerHTML = ''; // 一旦クリア

    currentKeywords.forEach((kw, index) => {
        const row = document.createElement('div');
        row.className = 'setting-row';
        row.style.gap = '15px';
        row.style.alignItems = 'center';

        // 有効/無効チェックボックス
        const enableCheck = document.createElement('input');
        enableCheck.type = 'checkbox';
        enableCheck.checked = kw.enabled;
        enableCheck.addEventListener('change', (e) => kw.enabled = e.target.checked);

        // キーワード入力
        const wordInput = document.createElement('input');
        wordInput.type = 'text';
        wordInput.value = kw.word;
        wordInput.style.width = '100px';
        wordInput.addEventListener('input', (e) => kw.word = e.target.value);

        // 文字色（クリアボタンなし）
        const tcLabel = document.createElement('span');
        tcLabel.textContent = '文字色:';
        tcLabel.style.fontSize = '12px';
        const tcPicker = document.createElement('input');
        tcPicker.type = 'color';
        const tcText = document.createElement('input');
        tcText.type = 'text';
        tcText.className = 'color-code';
        tcText.style.width = '80px';

        updateColorPickerUI(tcPicker, tcText, kw.textColor);
        bindColorInputs(tcPicker, tcText);
        tcText.addEventListener('input', (e) => kw.textColor = e.target.value);
        tcPicker.addEventListener('input', (e) => kw.textColor = e.target.value);

        // 背景色（クリアボタンあり）
        const bgLabel = document.createElement('span');
        bgLabel.textContent = '背景色:';
        bgLabel.style.fontSize = '12px';
        const bgPicker = document.createElement('input');
        bgPicker.type = 'color';
        const bgText = document.createElement('input');
        bgText.type = 'text';
        bgText.className = 'color-code';
        bgText.style.width = '80px';
        const bgClear = document.createElement('button');
        bgClear.type = 'button';
        bgClear.className = 'clear-color-btn';
        bgClear.textContent = '透明';

        updateColorPickerUI(bgPicker, bgText, kw.backgroundColor);
        
        // ここで bindColorInputs を呼ぶことで、bgClear を押した時に 
        // bgText に input/change イベントが飛び、下のリスナーが動くようになります
        bindColorInputs(bgPicker, bgText, bgClear);

        // テキストボックスの値が変わった時に内部データ (kw) を更新する
        bgText.addEventListener('input', (e) => {
            kw.backgroundColor = e.target.value;
        });

        // 削除ボタン
        const delBtn = document.createElement('button');
        delBtn.textContent = '削除';
        delBtn.style.cursor = 'pointer';
        delBtn.addEventListener('click', () => {
            currentKeywords.splice(index, 1);
            renderKeywordList();
        });

        // 結合して追加（tcClear は存在しないため append から外しています）
        row.append(enableCheck, wordInput, tcLabel, tcPicker, tcText, bgLabel, bgPicker, bgText, bgClear, delBtn);
        container.appendChild(row);
    });
}

document.getElementById('add-keyword-btn').addEventListener('click', () => {
    currentKeywords.push({ word: "", textColor: "#ff0000", backgroundColor: "transparent", underlineStyle: "none", underlineColor: "transparent", enabled: true });
    renderKeywordList();
});


// --- 4. 設定の読み込みとUIへの反映 ---
function loadSettingsToUI(settings) {
    // JSONエディタの更新
    document.getElementById('json-editor').value = JSON.stringify(settings, null, 2);

    // キーワード
    document.getElementById('kw-inside-brackets').checked = settings.keywords.highlightInsideBrackets;
    currentKeywords = JSON.parse(JSON.stringify(settings.keywords.items)); // ディープコピー
    renderKeywordList();

    // 括弧
    document.getElementById('br-enabled').checked = settings.brackets.enabled;
    updateColorPickerUI(document.getElementById('br-text-color-picker'), document.getElementById('br-text-color'), settings.brackets.textColor);
    updateColorPickerUI(document.getElementById('br-bg-color-picker'), document.getElementById('br-bg-color'), settings.brackets.backgroundColor);

    // 定義語
    document.getElementById('def-enabled').checked = settings.definitions.enabled;
    document.getElementById('def-inside-brackets').checked = settings.definitions.highlightInsideBrackets;
    document.getElementById('def-min-length').value = settings.definitions.minLength;
    document.getElementById('def-max-length').value = settings.definitions.maxLength;
    updateColorPickerUI(document.getElementById('def-text-color-picker'), document.getElementById('def-text-color'), settings.definitions.textColor);
    updateColorPickerUI(document.getElementById('def-bg-color-picker'), document.getElementById('def-bg-color'), settings.definitions.backgroundColor);
    document.getElementById('def-underline-style').value = settings.definitions.underlineStyle;
    updateColorPickerUI(document.getElementById('def-underline-color-picker'), document.getElementById('def-underline-color'), settings.definitions.underlineColor);

    // カスタムCSS
    document.getElementById('link-remove-decoration').checked = settings.custumCss.RemoveLinkDecoration;
    document.getElementById('custom-fullscreen').checked = settings.custumCss.FullScreen;
}

// 詳細タブのチェックボックス変更時にJSONエディタを更新する関数
function updateJsonEditorFromUI() {
    const settings = gatherSettingsFromUI();
    document.getElementById('json-editor').value = JSON.stringify(settings, null, 2);
}

// 詳細タブのチェックボックスにイベントリスナーを追加
document.getElementById('link-remove-decoration').addEventListener('change', updateJsonEditorFromUI);
document.getElementById('custom-fullscreen').addEventListener('change', updateJsonEditorFromUI);

// --- 5. UIから設定を収集 ---
function gatherSettingsFromUI() {
    return {
        keywords: {
            highlightInsideBrackets: document.getElementById('kw-inside-brackets').checked,
            items: currentKeywords
        },
        brackets: {
            enabled: document.getElementById('br-enabled').checked,
            textColor: document.getElementById('br-text-color').value,
            backgroundColor: document.getElementById('br-bg-color').value,
            // JSONにしか設定項目がないプロパティは、現在のJSONエディタの値から保持する（安全のためデフォルト値でフォールバック）
            underlineStyle: JSON.parse(document.getElementById('json-editor').value).brackets.underlineStyle || "none",
            underlineColor: JSON.parse(document.getElementById('json-editor').value).brackets.underlineColor || "transparent"
        },
        definitions: {
            enabled: document.getElementById('def-enabled').checked,
            highlightInsideBrackets: document.getElementById('def-inside-brackets').checked,
            minLength: parseInt(document.getElementById('def-min-length').value, 10),
            maxLength: parseInt(document.getElementById('def-max-length').value, 10),
            textColor: document.getElementById('def-text-color').value,
            backgroundColor: document.getElementById('def-bg-color').value,
            underlineStyle: document.getElementById('def-underline-style').value,
            underlineColor: document.getElementById('def-underline-color').value
        },
        custumCss: {
            RemoveLinkDecoration: document.getElementById('link-remove-decoration').checked,
            FullScreen: document.getElementById('custom-fullscreen').checked,
            // JSONにしか設定項目がないプロパティは、現在のJSONエディタの値から保持する（安全のためデフォルト値でフォールバック）
            HideBracketContent: JSON.parse(document.getElementById('json-editor').value).custumCss.HideBracketContent || false
        }
    };
}

// --- 6. 有効性確認 ---
// カラーコードが有効かチェックする (16進数 6桁 or "transparent")
function isValidColor(code) {
    return code === "transparent" || /^#[0-9A-F]{6}$/i.test(code);
}

// 設定オブジェクト全体のバリデーションを行う
// @returns {string[]} エラーメッセージの配列。エラーがなければ空配列。
function validateSettings(settings) {
    const errors = [];

    // 1. 括弧の設定チェック
    if (!isValidColor(settings.brackets.textColor)) errors.push("括弧の文字色が正しくありません。");
    if (!isValidColor(settings.brackets.backgroundColor)) errors.push("括弧の背景色が正しくありません。");

    // 2. 定義語の設定チェック
    if (!isValidColor(settings.definitions.textColor)) errors.push("定義語の文字色が正しくありません。");
    if (!isValidColor(settings.definitions.backgroundColor)) errors.push("定義語の背景色が正しくありません。");
    if (!isValidColor(settings.definitions.underlineColor)) errors.push("定義語の下線色が正しくありません。");

    const minLen = settings.definitions.minLength;
    const maxLen = settings.definitions.maxLength;

    // 3. 個別の数値妥当性チェック
    // 最小文字数は 0 の場合には 1 と同じ結果になるため、0 以上であれば許容する
    if (isNaN(minLen) || minLen < 0) {
        errors.push("定義語の最小文字数には 0 以上の数値を入力してください。");
    }
    
    // 最大文字数は min <= max を維持するため、最低でも 1 以上とする
    if (isNaN(maxLen) || maxLen < 1) {
        errors.push("定義語の最大文字数には 1 以上の数値を入力してください。");
    }

    // 4. 相関チェック (min <= max)
    // 両方が数値である場合のみチェックを実行
    if (!isNaN(minLen) && !isNaN(maxLen)) {
        if (minLen > maxLen) {
            errors.push("最大文字数は、最小文字数以上である必要があります。");
        }
    }

    // 5. キーワードの設定チェック
    settings.keywords.items.forEach((item, index) => {
        const label = item.word ? `"${item.word}"` : `項目 ${index + 1}`;
        if (!isValidColor(item.textColor)) errors.push(`キーワード ${label} の文字色が正しくありません。`);
        if (!isValidColor(item.backgroundColor)) errors.push(`キーワード ${label} の背景色が正しくありません。`);
    });

    return errors;
}

// --- 7. 保存処理の実装 ---
// 保存メッセージを表示する共通関数
function showSaveSuccess() {
    const msg = document.getElementById('global-save-message');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
}

// 保存処理の本体
function saveSettings(settingsObj) {
    // mergeSettings は config.js で定義されている
    const finalSettings = mergeSettings(settingsObj); // 保存前にも念のためマージして完全な形にする
    chrome.storage.sync.set({ eGovUserSettings: finalSettings }, () => {
        // 保存成功したら、UI全体を最新の状態で再描画する
        loadSettingsToUI(finalSettings);
    });
}

// バリデーションと保存をまとめた関数（サイドバーと詳細タブの両方から呼び出す）
function performSave() {
    let settingsToSave;

    // 1. データの収集
    if (document.getElementById('section-advanced').classList.contains('active')) {
        try {
            settingsToSave = JSON.parse(document.getElementById('json-editor').value);
        } catch (e) {
            alert("JSONの形式が正しくありません。修正してください。\n" + e.message);
            return;
        }
    } else {
        settingsToSave = gatherSettingsFromUI();
    }

    // 2. バリデーションの実行
    const errors = validateSettings(settingsToSave);
    if (errors.length > 0) {
        // 不適切である旨をユーザーに通知
        alert("入力内容に不備があるため保存できませんでした：\n\n・" + errors.join("\n・"));
        return;
    }

    // 3. 保存の実行
    saveSettings(settingsToSave);
    showSaveSuccess();
}

// サイドバー：変更を保存
document.getElementById('global-save-btn').addEventListener('click', performSave);

// 詳細タブ：JSONを保存（サイドバーと同じ保存処理を実行）
if (document.getElementById('save-json-btn')) {
    document.getElementById('save-json-btn').addEventListener('click', performSave);
}

// --- 8. デフォルトに戻す処理 ---
function performReset() {
 if (confirm("すべての設定を初期状態（デフォルト）に戻します。よろしいですか？")) {
        saveSettings(DEFAULT_SETTINGS);
        showSaveSuccess();
    }
}

// サイドバー：デフォルトに戻す
document.getElementById('global-reset-btn').addEventListener('click', performReset);

// 詳細タブ: デフォルトに戻す（サイドバーと同じリセット処理を実行）
if (document.getElementById('reset-btn')) {
    document.getElementById('reset-btn').addEventListener('click', performReset);
}

// --- 9. 変更を保存せずに最後に保存された状態に戻す ---
document.getElementById('global-discard-btn').addEventListener('click', () => {
    if (confirm("保存されていない変更は破棄されます。最後に保存された状態に戻しますか？")) {
        chrome.storage.sync.get(['eGovUserSettings'], function(result) {
            const settings = mergeSettings(result.eGovUserSettings);
            loadSettingsToUI(settings);
        });
    }
});
        
// --- 10. JSONをファイルとして保存する処理 ---
if (document.getElementById('download-json-btn')) {
    document.getElementById('download-json-btn').addEventListener('click', () => {
        const jsonText = document.getElementById('json-editor').value;
        try {
            JSON.parse(jsonText);
        } catch (e) {
            alert("JSONの形式が正しくないため、保存できません。");
            return;
        }
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        // ファイル名は「egov-settings_日付.json」のような形式に
        const date = new Date().toISOString().split('T')[0];
        a.download = `egov-highlighter-settings_${date}.json`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// --- 11. 初期読み込み処理 ---
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['eGovUserSettings'], function(result) {
        const settings = mergeSettings(result.eGovUserSettings);
        loadSettingsToUI(settings);
    });
});