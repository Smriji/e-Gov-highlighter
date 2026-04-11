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

function applyStyleSheet(settings) {
    let css = '';

    if (settings.custumCss && settings.custumCss.RemoveLinkDecoration) {
        css += `
            div[class*="paragraph" i] a,
            div[class*="item" i] a,
            div[class*="articletitle" i] a,
            td a, th a {
                color: inherit !important;
                text-decoration: none !important;
            }`;
    }
    if (settings.custumCss && settings.custumCss.FullScreen) {
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