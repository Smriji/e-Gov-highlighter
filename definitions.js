function highlightDefinitions(rootElement, definitionSettings) {
    if (!definitionSettings || !definitionSettings.enabled) return;

    const MIN_LENGTH = (typeof definitionSettings.minLength === 'number') ? definitionSettings.minLength : 3;
    const MAX_LENGTH = (typeof definitionSettings.maxLength === 'number') ? definitionSettings.maxLength : 20;
    const definedTerms = new Set();
    const fullText = rootElement.body ? rootElement.body.textContent : rootElement.textContent;

    const regexPatterns = [
        /以下「([^」]+)」という/g,
        /「([^」]+)」とは、?(?:[^（）。]|（[^）]*）)+をいう/g
    ];

    regexPatterns.forEach(regex => {
        let match;
        while ((match = regex.exec(fullText)) !== null) {
            const term = match[1];
            if (term.length >= MIN_LENGTH && term.length <= MAX_LENGTH) {
                definedTerms.add(term);
            }
        }
    });

    const extractCandidates = rootElement.querySelectorAll('[class*="item" i], [class*="paragraph" i]');
    extractCandidates.forEach(element => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textParts = [];
        let node;
        while ((node = walker.nextNode())) {
            const val = node.nodeValue.trim();
            if (val) textParts.push(val);
        }
        
        const normalizedText = textParts.join('　').replace(/[\s　]+/g, '　').trim();
        const listMatch = normalizedText.match(/^([一二三四五六七八九十]+(?:の[一二三四五六七八九十]+)*|[ア-ン])　(.+?)　.*いう。$/);
        
        if (listMatch) {
            let term = listMatch[2].replace(/[「」]/g, '').replace(/（[^）]+）/g, '').trim();
            if (term.length >= MIN_LENGTH && term.length <= MAX_LENGTH) {
                definedTerms.add(term);
            }
        }
    });

    if (definedTerms.size === 0) return;

    const sortedTerms = Array.from(definedTerms).sort((a, b) => b.length - a.length);
    const termsPattern = sortedTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
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
                    if (parent.classList.contains("egov-definition")) return NodeFilter.FILTER_REJECT;
                    if (!definitionSettings.highlightInsideBrackets && parent.classList.contains("egov-bracket")) {
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
            if (testRegex.test(node.nodeValue)) nodesToReplace.push(node);
        }

        nodesToReplace.forEach((textNode) => {
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let m;
            const rx = new RegExp(`(${termsPattern})`, "g");

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