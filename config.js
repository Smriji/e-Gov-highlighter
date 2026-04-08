// config.js
// 共通のデフォルト設定と設定管理ロジックをまとめたファイル
// manifest.json と options.html で最初に読み込む必要がある

const DEFAULT_KEYWORD_PROPS = {
    textColor: "#000000",
    backgroundColor: "transparent",
    underlineStyle: "none",
    underlineColor: "transparent",
    enabled: true
};

const DEFAULT_SETTINGS = {
    keywords: {
        highlightInsideBrackets: true,
        items: [
            { word: "及び", textColor: "#f44a4a", backgroundColor: "transparent", underlineStyle: "none", underlineColor: "transparent", enabled: true },
            { word: "並びに", textColor: "#d32f2f", backgroundColor: "transparent", underlineStyle: "none", underlineColor: "transparent", enabled: true },
            { word: "又は", textColor: "#19d250", backgroundColor: "transparent", underlineStyle: "none", underlineColor: "transparent", enabled: true },
            { word: "若しくは", textColor: "#21e361", backgroundColor: "transparent", underlineStyle: "none", underlineColor: "transparent", enabled: true },
            { word: "ただし、", textColor: "#ff00f7", backgroundColor: "transparent", underlineStyle: "none", underlineColor: "transparent", enabled: true },
            { word: "その他の", textColor: "#804400", backgroundColor: "transparent", underlineStyle: "none", underlineColor: "transparent", enabled: true }
        ]
    },
    brackets: {
        enabled: true,
        textColor: "#9e9e9e",
        backgroundColor: "transparent",
        underlineStyle: "none",
        underlineColor: "transparent"
    },
    definitions: {
        enabled: true,
        highlightInsideBrackets: true,
        minLength: 3,
        maxLength: 20,
        textColor: "#0D47A1",
        backgroundColor: "#E3F2FD",
        underlineStyle: "dashed",
        underlineColor: "#1976D2"
    },
    custumCss: {
        RemoveLinkDecoration: false,
        FullScreen: false
    }
};

// ユーザー設定とデフォルト設定をマージする関数
function mergeSettings(userSettings) {
    if (!userSettings) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    return {
        ...DEFAULT_SETTINGS,
        ...userSettings,
        keywords: {
            ...DEFAULT_SETTINGS.keywords,
            ...(userSettings.keywords || {}),
            items: userSettings.keywords && userSettings.keywords.items
                ? userSettings.keywords.items
                : DEFAULT_SETTINGS.keywords.items
        },
        brackets: {
            ...DEFAULT_SETTINGS.brackets,
            ...(userSettings.brackets || {})
        },
        definitions: {
            ...DEFAULT_SETTINGS.definitions,
            ...(userSettings.definitions || {})
        },
        custumCss: {
            ...DEFAULT_SETTINGS.custumCss,
            ...(userSettings.custumCss || {})
        }
    };
}