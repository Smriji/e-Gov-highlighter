function highlightDefinitions(rootElement, definitionSettings) {
    if (!definitionSettings || !definitionSettings.enabled) return;

    // 不正な値が設定されている場合のフォールバック
    const MIN_LENGTH = (typeof definitionSettings.minLength === 'number') ? definitionSettings.minLength : 3;
    const MAX_LENGTH = (typeof definitionSettings.maxLength === 'number') ? definitionSettings.maxLength : 20;
    const definedTerms = new Set();
    const fullText = rootElement.body ? rootElement.body.textContent : rootElement.textContent;

    // 定義語の抽出に使用する正規表現パターン
    const regexPatterns = [
        /以下「([^」]+)」という/g,
        /「([^」]+)」とは、?(?:[^（）。]|（[^）]*）)+をいう/g
    ];

    // 定義語の抽出
    regexPatterns.forEach(regex => {
        let match;
        while ((match = regex.exec(fullText)) !== null) {
            const term = match[1];
            if (term.length >= MIN_LENGTH && term.length <= MAX_LENGTH) {
                definedTerms.add(term);
            }
        }
    });

    // 法令の冒頭でまとめて定義が与えられているケースへの対応
    const extractCandidates = rootElement.querySelectorAll('[class*="item" i], [class*="paragraph" i]');
    extractCandidates.forEach(element => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textParts = [];
        let node;
        while ((node = walker.nextNode())) {
            const val = node.nodeValue.trim();
            if (val) textParts.push(val);
        }
        
        // テキストを全角スペースで結合し、複数のスペースを単一の全角スペースに置換して正規化する
        const normalizedText = textParts.join('　').replace(/[\s　]+/g, '　').trim();

        // 定義の候補を抽出する正規表現パターン
        // 百号以上の定義も対応 千号を超える例は見ないので対応しない
        const listMatch = normalizedText.match(/^([一二三四五六七八九十百]+(?:の[一二三四五六七八九十]+)*|[ア-ン])　(.+?)　.*?いう。(?=\s*(?:$|[ア-ン]|（))/);
        
        if (listMatch) {
            let term = listMatch[2].replace(/[「」]/g, '').replace(/（[^）]+）/g, '').trim();
            if (term.length >= MIN_LENGTH && term.length <= MAX_LENGTH) {
                definedTerms.add(term);
            }
        }
    });

    // 定義語がない場合は処理を行わない
    if (definedTerms.size === 0) return;

    // 定義語を長い順にソートして正規表現パターンを作成
    const sortedTerms = Array.from(definedTerms).sort((a, b) => b.length - a.length);
    const termsPattern = sortedTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const testRegex = new RegExp(`(${termsPattern})`);

    // 処理を行う対象のセレクタを定義
    const targetSelectors = [
        '[class*="articletitle" i]', '[class*="sentence" i]',
        '[class*="item" i]', '[class*="column" i]',
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

    // 定義語をハイライトするための処理
    targetElements.forEach(element => {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_ACCEPT;

                    // 定義語の場合にはスキップ
                    if (parent.classList.contains("egov-definition")) return NodeFilter.FILTER_REJECT;

                    // 括弧内のハイライトを行わない設定の場合、括弧内のテキストノードをスキップ
                    if (!definitionSettings.highlightInsideBrackets && parent.classList.contains("egov-bracket")) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        // 定義語を含むテキストノードを収集する
        const nodesToReplace = [];
        let node;
        while ((node = walker.nextNode())) {
            if (testRegex.test(node.nodeValue)) nodesToReplace.push(node);
        }

        // 定義語部分を span タグで包んだ構造に置換する
        nodesToReplace.forEach((textNode) => {
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let m;
            const rx = new RegExp(`(${termsPattern})`, "g");

            // テキストノードの内容を正規表現で走査し、定義語が見つかるたびにその部分を span タグで包む
            while ((m = rx.exec(textNode.nodeValue)) !== null) {
                if (m.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(textNode.nodeValue.substring(lastIndex, m.index)));
                }

                const span = document.createElement("span");
                span.className = "egov-definition";
                span.textContent = m[0];

                if (definitionSettings.textColor) span.style.color = definitionSettings.textColor;
                if (definitionSettings.backgroundColor && definitionSettings.backgroundColor !== "transparent") span.style.backgroundColor = definitionSettings.backgroundColor;
                if (definitionSettings.underlineStyle && definitionSettings.underlineStyle !== "none") {
                    span.style.textDecorationLine = "underline";
                    span.style.textDecorationStyle = definitionSettings.underlineStyle;
                    if (definitionSettings.underlineColor && definitionSettings.underlineColor !== "transparent") {
                        span.style.textDecorationColor = definitionSettings.underlineColor;
                    }
                }

                fragment.appendChild(span);
                lastIndex = rx.lastIndex;
            }

            if (lastIndex < textNode.nodeValue.length) {
                fragment.appendChild(document.createTextNode(textNode.nodeValue.substring(lastIndex)));
            }

            if (textNode.parentNode) textNode.parentNode.replaceChild(fragment, textNode);
        });
    });
}