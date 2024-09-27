import pinyin from "https://deno.land/x/pinyin@0.0.5/mod.ts"

function convertToPinyin(text) {
    // 使用 pinyin 库将中文转换为拼音数组，然后取首字母
    const pinyinArray = pinyin(text, { style: pinyin.STYLE_NORMAL });
    return pinyinArray.map(item => item[0]).join('');
}

export function parse_text(text) {
    let resultIndex = -1;
    let maxScore = 0;

    const pinyinText = convertToPinyin(text);

    COMMAND_LIST.forEach((command, index) => {
        const pinyinCommand = convertToPinyin(command);
        const score = similarity(pinyinText, pinyinCommand);

        // 设定一个百分比阈值，根据实际需求调整
        const threshold = 0.6; // 60% 相似度作为阈值
        const commandLength = Math.max(pinyinText.length, pinyinCommand.length);
        const normalizedScore = 1 - (score / commandLength);

        if (normalizedScore > threshold && normalizedScore > maxScore) {
            maxScore = normalizedScore;
            resultIndex = index;
        }
    });

    return { index: resultIndex, score: maxScore };
}

function similarity(s, t) {
    let n = s.length, m = t.length;
    if (n === 0) return m;
    if (m === 0) return n;

    let d = Array.from(Array(n + 1), () => Array(m + 1).fill(0));

    for (let i = 0; i <= n; i++) d[i][0] = i;
    for (let j = 0; j <= m; j++) d[0][j] = j;

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            let cost = s[i - 1] === t[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // 删除操作
                d[i][j - 1] + 1,      // 插入操作
                d[i - 1][j - 1] + cost  // 替换操作
            );

            // 考虑字符交换操作（Damerau-Levenshtein 距离特有）
            if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }

    return d[n][m];
}



export const COMMAND_LIST = [
    // "识别当前位置",
    "识别选中",
    "海棠停止",
    "海棠",

 

];

 export const MODE_LIST = [
    // "识别当前位置",
    "识别选中",
    "海棠停止",
    "海棠",



];