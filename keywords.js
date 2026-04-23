function highlightKeywords(rootElement, keywordSettings) {
    if (!keywordSettings || !Array.isArray(keywordSettings.items)) return;

    const settingsMap = new Map();
    keywordSettings.items.forEach((setting, originalIndex) => {
        if (setting.enabled && setting.word) {
            settingsMap.set(setting.word, { ...setting, classIndex: originalIndex });
        }
    });

    const sortedWords = Array.from(settingsMap.keys()).sort((a, b) => b.length - a.length);
    const escapedWords = sortedWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const termsPattern = escapedWords.join('|');
    const testRegex = new RegExp(`(${termsPattern})`);

    // ハイライトの対象を絞る
    const targetSelectors = [
        '[class*="articletitle" i]', '[class*="sentence" i]',
        'td', 'th'
    ].join(', ');
    const rawElements = Array.from(rootElement.querySelectorAll(targetSelectors));

    const elementsSet = new Set(rawElements);
    const targetElements = rawElements.filter(el => {
        // 目次内の要素は除外する
        if (el.closest('[id*="TOC"], #sidebar')) return false;
        // 自身が他の対象要素の子孫であれば除外する
        let parent = el.parentElement;
        while (parent && parent !== document) {
            if (elementsSet.has(parent)) return false;
            parent = parent.parentElement;
        }
        return true;
    });

    targetElements.forEach(element => {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_ACCEPT;

                    // 定義語の場合にはスキップ
                    if (parent.classList.contains("egov-definition") || parent.classList.contains("egov-highlight")) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // 括弧内のハイライトを行わない設定の場合、括弧内のテキストノードをスキップ
                    if (!keywordSettings.highlightInsideBrackets && parent.classList.contains("egov-bracket")) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // 各条冒頭の "第○条" という条数部分は処理しない
                    if (parent.closest('span[style*="font-weight"][style*="bold"]')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        // ノードを収集する
        const nodesToReplace = [];
        let node;
        while ((node = walker.nextNode())) {
            if (testRegex.test(node.nodeValue)) {
                nodesToReplace.push(node);
            }
        }

        nodesToReplace.forEach((textNode) => {
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            const regex = new RegExp(`(${termsPattern})`, "g");

            while ((match = regex.exec(textNode.nodeValue)) !== null) {
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(textNode.nodeValue.substring(lastIndex, match.index)));
                }

                const word = match[0]; // マッチしたキーワード
                const setting = settingsMap.get(word);

                // ハイライト用の span タグを作成
                const span = document.createElement("span");
                span.className = `egov-highlight egov-highlight-${setting.classIndex}`;
                span.textContent = word;

                fragment.appendChild(span);
                lastIndex = regex.lastIndex;
            }

            if (lastIndex < textNode.nodeValue.length) {
                fragment.appendChild(document.createTextNode(textNode.nodeValue.substring(lastIndex)));
            }

            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    });
}