// brackets.js
function highlightBrackets(rootElement, bracketSettings) {
    if (!bracketSettings || !bracketSettings.enabled) return;

    // 処理を行う対象のセレクタを定義
    // 条文見出し Article_Caption, articleheading はここで除外される
    const targetSelectors = [
        '[class*="articletitle" i]', '[class*="paragraph" i]', '[class*="item" i]',
        '[class*="sentence" i]', '[class*="portion" i]', '[class*="column" i]',
        '[class*="list" i]', '[class*="istitle" i]', '[class*="itemtitle" i]',
        'td', 'th'
    ].join(', ');
    const rawElements = Array.from(rootElement.querySelectorAll(targetSelectors));

    const elementsSet = new Set(rawElements);
    const targetElements = rawElements.filter(el => {
        // 目次内の要素は除外する
        if (el.closest('[id*="TOC"], #sidebar')) return false;
        let parent = el.parentElement;
        // 自身が他の対象要素の子孫であれば除外する
        while (parent && parent !== document) {
            if (elementsSet.has(parent)) return false;
            parent = parent.parentElement;
        }
        return true;
    });

    targetElements.forEach(element => {
        const originalHtml = element.innerHTML;
        let html = originalHtml;
        const brackets = []; // 括弧の開始位置と終了位置を格納する配列
        let depth = 0; // 括弧の階層をカウントする変数
        let inTag = false; // 現在HTMLタグの中にいるかどうかを判定するフラグ
        let startIndex = -1;

        // 1. HTMLタグを無視しながら、括弧の開始位置と終了位置を特定する
        for (let i = 0; i < html.length; i++) {
            const char = html[i];
            
            // HTMLタグ（"<" から ">" まで）はカウント対象から外す
            if (char === '<') {
                inTag = true;
                continue;
            }
            if (char === '>') {
                inTag = false;
                continue;
            }
            if (inTag) continue;

            // 括弧の階層をカウントし、深さが0のときに開始位置を記録、終了位置を記録する
            if (char === '（') {
                if (depth === 0) {
                    startIndex = i;
                }
                depth++;
            } else if (char === '）') {
                if (depth > 0) {
                    depth--;
                    if (depth === 0) {
                        brackets.push({ start: startIndex, end: i });
                    }
                }
            }
        }

        // 2. 文字列のインデックスがズレないように、後ろから順番に <span> で囲んでいく
        for (let j = brackets.length - 1; j >= 0; j--) {
            const { start, end } = brackets[j];
            const bracketHtml = html.substring(start, end + 1);
            
            // 正規表現で誤爆しないよう、内側のHTMLタグを一時的に消してナンバリング判定を行う
            const plainText = bracketHtml.replace(/<[^>]+>/g, '');

            // ナンバリングラベル（例： （1） （2の3） （ア） （イ） （ウ） （一） （二） ...）はハイライトしない
            const isNumberingLabel = /^（[0-9０-９a-zA-Zａ-ｚＡ-Ｚ一二三四五六七八九十ア-ン]+(?:の[0-9０-９一二三四五六七八九十]+)?）$/.test(plainText);

            // ナンバリングラベルでない場合のみハイライトを適用する
            if (!isNumberingLabel) {
                let styleStr = "";
                if (bracketSettings.textColor) styleStr += `color: ${bracketSettings.textColor}; `;
                if (bracketSettings.backgroundColor && bracketSettings.backgroundColor !== "transparent") styleStr += `background-color: ${bracketSettings.backgroundColor}; `;
                if (bracketSettings.underlineStyle && bracketSettings.underlineStyle !== "none") {
                    styleStr += `text-decoration-line: underline; text-decoration-style: ${bracketSettings.underlineStyle}; `;
                    if (bracketSettings.underlineColor && bracketSettings.underlineColor !== "transparent") {
                        styleStr += `text-decoration-color: ${bracketSettings.underlineColor}; `;
                    }
                }

                // 見つけた括弧部分を、HTML タグごと span で包む
                const replacement = `<span class="egov-bracket" style="${styleStr}">${bracketHtml}</span>`;
                html = html.substring(0, start) + replacement + html.substring(end + 1);
            }
        }

        // 変更があった場合のみ DOM に反映する
        if (html !== originalHtml) {
            element.innerHTML = html;
        }
    });
}