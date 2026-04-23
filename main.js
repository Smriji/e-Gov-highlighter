// --- 1. 設定の読み込み ---
function initializeExtension() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['eGovUserSettings'], function(result) {
            const settings = mergeSettings(result.eGovUserSettings);
            applyStyleSheet(settings);
            waitForContentAndApply(settings);
        });
    } else {
        // ローカルでのテスト用フォールバック
        applyStyleSheet(DEFAULT_SETTINGS);
        waitForContentAndApply(DEFAULT_SETTINGS);
    }
}

function generateHighlightCSS(settings) {
    let css = '';

    // 括弧ハイライトのスタイル
    if (settings.brackets && settings.brackets.enabled) {
        css += '.egov-bracket {';
        if (settings.brackets.textColor) css += ` color: ${settings.brackets.textColor};`;
        if (settings.brackets.backgroundColor && settings.brackets.backgroundColor !== "transparent") css += ` background-color: ${settings.brackets.backgroundColor};`;
        if (settings.brackets.underlineStyle && settings.brackets.underlineStyle !== "none") {
            css += ' text-decoration-line: underline;';
            css += ` text-decoration-style: ${settings.brackets.underlineStyle};`;
            if (settings.brackets.underlineColor && settings.brackets.underlineColor !== "transparent") {
                css += ` text-decoration-color: ${settings.brackets.underlineColor};`;
            }
        }
        css += ' }\n';
    }

    // 定義語ハイライトのスタイル
    if (settings.definitions && settings.definitions.enabled) {
        css += '.egov-definition {';
        if (settings.definitions.textColor) css += ` color: ${settings.definitions.textColor};`;
        if (settings.definitions.backgroundColor && settings.definitions.backgroundColor !== "transparent") css += ` background-color: ${settings.definitions.backgroundColor};`;
        if (settings.definitions.underlineStyle && settings.definitions.underlineStyle !== "none") {
            css += ' text-decoration-line: underline;';
            css += ` text-decoration-style: ${settings.definitions.underlineStyle};`;
            if (settings.definitions.underlineColor && settings.definitions.underlineColor !== "transparent") {
                css += ` text-decoration-color: ${settings.definitions.underlineColor};`;
            }
        }
        css += ' }\n';
    }

    // キーワードハイライトのスタイル（キーワードごとにクラスを生成）
    if (settings.keywords && Array.isArray(settings.keywords.items)) {
        settings.keywords.items.forEach((item, index) => {
            if (item.enabled && item.word) {
                const className = `egov-highlight-${index}`;
                css += `.${className} {`;
                if (item.textColor) css += ` color: ${item.textColor};`;
                if (item.backgroundColor && item.backgroundColor !== "transparent") css += ` background-color: ${item.backgroundColor};`;
                if (item.underlineStyle && item.underlineStyle !== "none") {
                    css += ' text-decoration-line: underline;';
                    css += ` text-decoration-style: ${item.underlineStyle};`;
                    if (item.underlineColor && item.underlineColor !== "transparent") {
                        css += ` text-decoration-color: ${item.underlineColor};`;
                    }
                }
                css += ' }\n';
            }
        });
    }

    return css;
}

function applyStyleSheet(settings) {
    let css = '';

    // ハイライト用のスタイルを追加
    css += generateHighlightCSS(settings);

    if (settings.customCss && settings.customCss.RemoveLinkDecoration) {
        css += `
            [class*="sentence" i] a,
            div[class*="articletitle" i] a,
            td a, th a {
                color: inherit !important;
                text-decoration: none !important;
            }`;
    }
    if (settings.customCss && settings.customCss.FullScreen) {
        css += `
            :root {
                --bar-height: 0 !important;
            }
            #rootbar, #titlebar, #sidebar, .revisionmeta, #provisionoptions, .toolbar {
                display: none !important;
            }
            .revision {
                margin-left: 0 !important;
            }`;
    }
    if (settings.customCss && settings.customCss.HideBracketContent) {
        css += `
            .egov-bracket {
                display: none !important;
            }`;
    }

    if (css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
}

// --- 2. コンテンツの待機と適用 ---
function waitForContentAndApply(settings) {
    const containerSelectors = '[id*="mainprovision" i], [id*="preamble" i], [class*="supplprovision" i]';
    
    // すでに条文が存在していれば即実行
    if (document.querySelector(containerSelectors)) {
        applyHighlights(settings);
        return;
    }

    // まだ存在しない場合は監視を開始
    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector(containerSelectors)) {
            obs.disconnect(); // 監視を終了
            
            // 描画の完了から少しだけ余裕を持たせて実行
            setTimeout(() => {
                applyHighlights(settings);
            }, 300);
        }
    });

    // body 要素の中身の変化を監視
    observer.observe(document.body, { childList: true, subtree: true });
}

// --- 3. 実際のハイライト適用関数 ---
function applyHighlights(settings) {
    const rootElement = document;

    // まず括弧のハイライトを適用する
    // 設定によっては括弧内のハイライトを行わない場合もあるため、順番を考慮
    if (settings.brackets.enabled) {
        highlightBrackets(rootElement, settings.brackets);
    }
    if (settings.definitions.enabled) {
        highlightDefinitions(rootElement, settings.definitions);
    }
    if (settings.keywords && Array.isArray(settings.keywords.items)) {
        highlightKeywords(rootElement, settings.keywords);
    }
}

// --- 4. DOMの変更を監視するユーティリティ関数 ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}