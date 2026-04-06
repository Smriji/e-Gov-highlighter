// config.js
// 共通のデフォルト設定と設定管理ロジックをまとめたファイル

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
    }
};

// ユーザー設定とデフォルト設定をマージする関数
function mergeSettings(userSettings) {
    if (!userSettings || typeof userSettings !== 'object') {
        return DEFAULT_SETTINGS;
    }
    const defaultKw = DEFAULT_SETTINGS.keywords;
    const userKw = userSettings.keywords || {};
    let mergedKeywordItems = defaultKw.items;
    
    if (Array.isArray(userKw.items)) {
        mergedKeywordItems = userKw.items.map(kw => {
            return { ...DEFAULT_KEYWORD_PROPS, ...kw };
        });
    }

    const mergedKeywords = {
        highlightInsideBrackets: userKw.highlightInsideBrackets !== undefined ? userKw.highlightInsideBrackets : defaultKw.highlightInsideBrackets,
        items: mergedKeywordItems
    };

    const mergedBrackets = { ...DEFAULT_SETTINGS.brackets, ...(userSettings.brackets || {}) };
    const mergedDefinitions = { ...DEFAULT_SETTINGS.definitions, ...(userSettings.definitions || {}) };

    return {
        keywords: mergedKeywords,
        brackets: mergedBrackets,
        definitions: mergedDefinitions
    };
}