import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";



//-----------------------判断是否需要下载模型
async function sha_file(path: string): Promise<string> {
    try {
        const file = await Deno.open(path, { read: true });
        const readableStream = file.readable;
        const fileHashBuffer = await crypto.subtle.digest("SHA-256", readableStream);
        const fileHash = encodeHex(fileHashBuffer);
        return fileHash;
    }
    catch {

        return ""
    }

}
if (!existsSync('./models/translate')) {
    console.log("找不到模型文件,将从github下载,如果您的网络不能翻墙,建议手动下载")
    const urls = []
    if (await sha_file("./temp/translate.zip") != "a3e3815002e7da57a093760a357c3f0f99c23eaa6ab0850921a8b1a25c8abdeb") {
        urls.push("https://github.com/SSFRPA/ssfrpa/releases/download/translate/translate.zip");

    }
    if (urls.length > 0) {
        await ssf.Request.download(urls, "./temp", 1, 5, "")
    }
    await decompress("./temp/translate.zip", "./models/");


}


if (!existsSync('./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20')) {
    console.log("找不到模型文件,将从github下载,如果您的网络不能翻墙,建议手动下载")
    const urls = []
    if (await sha_file("./temp/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20.zip") != "f05860f1403d591f96ee1a4eca13dbbd58b7f4eb5fa4c7b25dd5e8f9556672e2") {
        urls.push("https://github.com/SSFRPA/ssfrpa/releases/download/asr_model/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20.zip");

    }
    if (urls.length > 0) {
        await ssf.Request.download(urls, "./temp", 1, 5, "")
    }
    await decompress("./temp/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20.zip", "./models/");


}
//-----------------------结束判断

////---------------------------------------  简单的语音命令判断
function similarity2(s, t) {
    let l = s.length > t.length ? s.length : t.length;
    let d = strSimilarity2Number(s, t);
    return (1 - d / l).toFixed(4);
}

function strSimilarity2Number(s, t) {
    let n = s.length,
        m = t.length,
        d = [];
    let i, j, s_i, t_j, cost;
    if (n == 0) return m;
    if (m == 0) return n;
    for (i = 0; i <= n; i++) {
        d[i] = [];
        d[i][0] = i;
    }
    for (j = 0; j <= m; j++) {
        d[0][j] = j;
    }
    for (i = 1; i <= n; i++) {
        s_i = s.charAt(i - 1);
        for (j = 1; j <= m; j++) {
            t_j = t.charAt(j - 1);
            if (s_i == t_j) {
                cost = 0;
            } else {
                cost = 1;
            }
            d[i][j] = Minimum(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
    }
    return d[n][m];
}

function Minimum(a, b, c) {
    return a < b ? (a < c ? a : c) : (b < c ? b : c);
}

const mode_list = [
    "开始输入",
    "结束输入",
    "快速删除",
]


function parse_text(text) {
    let result_index = -1;
    let temp = 0;
    for (let index = 0; index < mode_list.length; index++) {
        const element = mode_list[index];
        let r = similarity2(text, element);
        if (r > temp && r > 0.6) {
            result_index = index;
            temp = r;
        }
    }
    return { "index": result_index, "score": temp };
}


let mode = -1;
// let is_first = true
function run_text(text) {
    switch (text) {
        case "开始输入": { mode = 0; }; break;
        case "结束输入": mode = 1; break;
    }
}


//-------------------------------------------

//识别翻译主要代码
ssf.ai.ASR.listen_input("./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20", 2.4, 1.2, 10.)
ssf.ai.Translate.init_model("./models/translate/tokenizer-marian-base-zh2en.json", "./models/translate/tokenizer-marian-base-zh2en_des.json", "./models/translate/zh-en-model.safetensors")
console.log("开始监听麦克风")
while (true) {
    const text = ssf.ai.ASR.get_result()
    console.log(text)
    // console.log(ssf.ai.Translate.parse(text))
    let model = parse_text(text);

    if (model["index"] != -1) {
        console.log("匹配到命令----->", mode_list[model["index"]], "概率:", model["score"])
        run_text(mode_list[model["index"]])
        continue
    }
    console.log(mode)
    if (mode == 0) {
            const tr_text = ssf.ai.Translate.parse(text)
            ssf.Input.text(tr_text)

    }

}

