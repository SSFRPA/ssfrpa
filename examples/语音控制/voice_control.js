import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";


// import {existsSync} from "https://deno.land/std/fs/mod.ts";


function getModuleDir(importMeta) {
    return path.resolve(path.dirname(path.fromFileUrl(importMeta.url)));
}

const dir = getModuleDir(import.meta);


//-----------------------判断是否需要下载模型
async function sha_file(path) {
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
// 计算字符串相似度的函数
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
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
    }
    return d[n][m];
}

function similarity2(s, t) {
    let l = Math.max(s.length, t.length);
    let d = similarity(s, t);
    return (1 - d / l).toFixed(4);
}

function extractTextAndMode(input) {
    const patterns = [
        { mode: "输入", pattern: /^输入\s*(.*)/ },
        { mode: "翻译", pattern: /^翻译\s*(.*)/ },
        { mode: "搜索", pattern: /^搜索\s*(.*)/ }
    ];

    for (const { mode, pattern } of patterns) {
        const match = input.match(pattern);
        if (match) {
            return { mode, text: match[1] };
        }
    }

    return null; // 如果不符合任何模式，返回null
}

const COMMAND_LIST = [
    "开始输入",
    "结束输入",
    "关闭当前进程",
    "快速截图",
    "太难了",
];

const MODE_LIST = [
    "开始输入",
    "结束输入",
    "关闭当前进程",
    "快速截图",
    "太难了",];
// const MODE_START = 0;
// const MODE_END = 1;

function parse_text(text) {
    let resultIndex = -1;
    let maxScore = 0;
    COMMAND_LIST.forEach((command, index) => {
        let score = similarity2(text, command);
        if (score > maxScore && score > 0.6) {
            resultIndex = index;
            maxScore = score;
        }
    });
    return { index: resultIndex, score: maxScore };
}

let mode = -1;

function kill_current() {
    const hwnd = ssf.Windows.get_foreground_window()
    const pid = ssf.Windows.find_process_with_hwnd(hwnd)
    console.log("结束进程", ssf.Windows.kill_process(pid))
    // ssf.Windows.k
    // ssf.Windows.f
    // ssf.Windows.

}

function run_text(commandIndex) {
    switch (commandIndex) {
        case 0:
            mode = 0;
            break;
        case 1:
            mode = 1;
            break;
        case 2:
            { kill_current() }
            break;

        case 3:
            {
                if (!existsSync('./screenshot')) {
                    Deno.mkdirSync("./screenshot", { recursive: true });

                }
                const img = ssf.Frame.to_image(1, 1000)
                img.save("./screenshot/" + Date.now().toString() + ".png")

            }
            break;
    }
}

//检测插件是否安装
function search(text) {
    try {
        const chrome_path = ssf.Windows.get_reg_value("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe", "")

        //判断插件是否安装,后续直接可以google商店安装
        try {
            const chrome_ext = ssf.Windows.get_reg_value("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallAllowlist", "99999")
            if (ssf.Windows.find_process("chrome.exe") == 0) {
                ssf.Windows.run(chrome_path, [])
            }
        } catch (error) {
            console.log("未允许插件,将自动注册插件,后续可以从google商店安装", error)
            console.log(ssf.Windows.cmd("reg", ["add", "HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallAllowlist", "/v", "99999", "/t", "reg_sz", "/d", "eamibgnfgfhlmnbedbegigiaiedokgjh", "/f"]))

        }

        const chrome_app = ssf.ElementExt.find_task_bar("Chrome", 30000)

        ssf.Windows.switch_to_this_window(chrome_app.native_window_handle())
        ssf.Sys.sleep(1000)

        const tid = ssf.Browser.create_tab("https://www.baidu.com/", 3000).id
        // ssf.Sys.sleep(1000)
        ssf.Browser.setText(tid, '//*[@id="kw"]', text, 3000)
        ssf.Sys.sleep(500)

        ssf.Browser.click(tid, '//*[@id="su"]', 3000)

    } catch (error) {
        console.log(error)
    }






}


//监听浏览器
ssf.Browser.listen()

// 识别翻译主要代码
ssf.ai.ASR.listen_input("./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20", 2.4, 1.2, 10.0);
ssf.ai.Translate.init_model("./models/translate/tokenizer-marian-base-zh2en.json", "./models/translate/tokenizer-marian-base-zh2en_des.json", "./models/translate/zh-en-model.safetensors");
console.log("开始监听麦克风");
ssf.ai.Device.init_audio()
// for await (const dirEntry of Deno.readDir("./")) {
//     console.log(dirEntry.name);
//   }
// console.log(dir)

const voice1 = ssf.ai.Device.load_audio(dir + "/voice_files/1.wav")
const voice2 = ssf.ai.Device.load_audio(dir + "./voice_files/2.mp3")


while (true) {
    const text = ssf.ai.ASR.get_result();
    console.log("-------", text);
    const quick_text = extractTextAndMode(text);
    if (quick_text) {
        ssf.ai.Device.audio_play(voice2);
        console.log("=====>", quick_text.mode);
        if (quick_text.text.length === 0) {
            continue;
        }
        switch (quick_text.mode) {
            case "输入":
                ssf.Input.text(quick_text.text);
                break;
            case "翻译":
                {
                    const tr_text = ssf.ai.Translate.parse(quick_text.text);
                    ssf.Input.text(tr_text);

                }

                break;
            case "搜索": {
                search(quick_text.text)
            }

                break;
        }
        continue
    }

    let model = parse_text(text);


    if (model.index !== -1) {
        ssf.ai.Device.audio_play(voice2)

        console.log("匹配到命令----->", MODE_LIST[model.index], "概率:", model.score);
        run_text(model.index);
        continue;
    }

    // console.log(mode);

    if (mode === 0) {
        ssf.ai.Device.audio_play(voice2)

        const tr_text = ssf.ai.Translate.parse(text);
        ssf.Input.text(tr_text);
        continue;

    }
    ssf.ai.Device.audio_play(voice1)

}