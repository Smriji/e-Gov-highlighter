function highlightKeywords(rootElement, keywordSettings) {
    if (!keywordSettings || !Array.isArray(keywordSettings.items)) return;

    const activeSettings = keywordSettings.items.filter(setting => setting.enabled && setting.word);
    if (activeSettings.length === 0) return;

    const settingsMap = new Map();
    activeSettings.forEach(setting => {
        settingsMap.set(setting.word, setting);
    });

    const sortedWords = Array.from(settingsMap.keys()).sort((a, b) => b.length - a.length);
    const escapedWords = sortedWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const termsPattern = escapedWords.join('|');
    const testRegex = new RegExp(`(${termsPattern})`);

    const containerSelectors = [
        '[class*="preamble" i]', '[class*="mainprovision" i]', '[class*="supplprovision" i]',
        '[class*="appdx" i]', '[class*="part" i]', '[class*="chapter" i]', '[class*="section" i]'
    ].join(', ');
    const containers = rootElement.querySelectorAll(containerSelectors);
    const searchRoots = containers.length > 0 ? Array.from(containers) : [rootElement];

    const targetSelectors = [
        '[class*="articletitle" i]', '[class*="paragraph" i]', '[class*="item" i]',
        '[class*="sentence" i]', '[class*="portion" i]', '[class*="column" i]',
        '[class*="list" i]', '[class*="istitle" i]', '[class*="itemtitle" i]'
    ].join(', ');
    const rawElements = [];
    searchRoots.forEach(root => {
        root.querySelectorAll(targetSelectors).forEach(el => rawElements.push(el));
    });

    const elementsSet = new Set(rawElements);
    const targetElements = rawElements.filter(el => {
        if (el.closest('[id*="TOC"]')) return false;
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
                    if (parent.classList.contains("egov-definition") || parent.classList.contains("egov-highlight")) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (!keywordSettings.highlightInsideBrackets && parent.classList.contains("egov-bracket")) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

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

                const word = match[0];
                const setting = settingsMap.get(word);

                const span = document.createElement("span");
                span.className = "egov-highlight";
                span.textContent = word;

                if (setting.textColor) span.style.color = setting.textColor;
                if (setting.backgroundColor && setting.backgroundColor !== "transparent") span.style.backgroundColor = setting.backgroundColor;
                if (setting.underlineStyle && setting.underlineStyle !== "none") {
                    span.style.textDecorationLine = "underline";
                    span.style.textDecorationStyle = setting.underlineStyle;
                    if (setting.underlineColor && setting.underlineColor !== "transparent") {
                        span.style.textDecorationColor = setting.underlineColor;
                    }
                }

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