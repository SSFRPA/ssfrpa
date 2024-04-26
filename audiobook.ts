//演示如何语音输入和tts播放
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";
import { WebUI } from "https://deno.land/x/webui@2.4.4/mod.ts";
import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import GeneralNewsExtractor from "./general-news-extractor-js/general-news-extractor.ts"

import {
    encodeBase64,
    decodeBase64,
} from "https://deno.land/std@0.223.0/encoding/base64.ts";


const ui_html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <script src="webui.js"></script>
    <title>提取网页正文内容</title>
    <style>
        /* 全局样式 */
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            height: 100vh; /* 与视窗高度相匹配 */
            overflow: hidden; /* 防止溢出 */
        }

        /* 主要容器 */
        .container {
            display: flex;
            flex-direction: column; /* 列布局 */
            justify-content: flex-start; /* 从上至下排列 */
            align-items: center; /* 居中对齐 */
            width: 90%; /* 宽度是视窗的90% */
            height: 90vh; /* 高度是视窗的90% */
            padding: 1.5rem; /* 内边距减少 */
            margin: 5vh auto; /* 增加容器外边距 */
            background-color: #fff;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* 阴影效果 */
            border-radius: 8px; /* 增加容器的圆角 */
            overflow-y: auto; /* 启用垂直滚动 */
        }

        /* 标题 */
        .header {
            text-align: center;
            font-size: 1.5rem; /* 缩小字体大小 */
            color: #333;
            margin-bottom: 1rem; /* 适当间隔 */
        }

        /* 输入区 */
        .input-area {
            display: flex;
            justify-content: space-between; /* 输入框和按钮之间的间隔 */
            width: 100%; /* 占据整个宽度 */
            margin-bottom: 1rem; /* 适当间隔 */
        }

        input {
            padding: 0.5rem; /* 缩小输入框内边距 */
            font-size: 1rem;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        input#url-input {
            flex: 3; /* 让输入框占据较大的比例 */
        }

        input#speed-input {
            flex: 1; /* 让语速输入框占据较小的比例 */
        }

        input#speaker-input {
            flex: 1; /* 让说话人ID输入框占据较小的比例 */
        }

        button {
            padding: 0.5rem 1rem; /* 缩小按钮内边距 */
            font-size: 1rem; /* 缩小字体大小 */
            background-color: #6200ea;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        button:hover {
            background-color: #3700b3; /* 按钮悬停时的背景色 */
        }

        /* 内容区 */
        .content {
            flex: 1; /* 占据剩余高度 */
            width: 100%; /* 宽度填满 */
            border-top: 1px solid #ccc; /* 添加顶部边框 */
            padding-top: 1rem; /* 设置顶部内边距 */
            font-size: 1rem; /* 缩小字体大小 */
            line-height: 1.6; /* 增加行距 */
            color: #444;
        }

        .editable {
            width: 100%; /* 占满整个宽度 */
            height: 100%; /* 允许内容区高度自适应 */
            border-radius: 4px; /* 圆角 */
            border: 1px solid #ccc;
            padding: 0.75rem; /* 缩小内边距 */
            overflow-y: auto; /* 启用垂直滚动 */
        }

        /* 按钮区域 */
        .button-area {
            text-align: center; /* 中心对齐 */
            margin-top: 1rem; /* 与内容区保持距离 */
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">提取网页正文内容</div>
        <div class="input-area">
            <input type="text" id="url-input" placeholder="输入网址..." value="https://book.qq.com/book-read/468914/1" />
            <button onclick="extractContent()">提取内容</button>
        </div>

        <!-- 新增的输入区域 -->
        <div class="input-area">
            <label for="speed-input">语速：</label>
            <input type="text" id="speed-input" placeholder="输入语速 (浮点数)" value="1.0" />

            <label for="speaker-input">说话人ID：</label>
            <input type="number" id="speaker-input" placeholder="0 - 160" min="0" max="160" value="66" />
        </div>

        <div class="content">
            <textarea class="editable" id="editable-content" placeholder="提取的内容会在这里显示..."></textarea>
        </div>
        <div class="button-area">
            <button onclick="playContent()">播放正文</button>
            <button onclick="stopContent()">停止播放</button>
        </div>
    </div>

    <script>
        function extractContent() {
            const url = document.getElementById("url-input").value;

            if (url.trim() === "") {
                alert("请输入网址！");
                return;
            }

            get_result(url).then((response) => {
                set_result(response);
            });
        }

        function set_result(base64_str) {
            const decoded_binary = atob(base64_str);
            const utf8_str = new TextDecoder().decode(
              Uint8Array.from(decoded_binary, (char) => char.charCodeAt(0))
            );

            document.getElementById("editable-content").value  = utf8_str;
        }

        function playContent(){
            const text = document.getElementById("editable-content").value;
            const speed = parseFloat(document.getElementById("speed-input").value);
            const speakerId = parseInt(document.getElementById("speaker-input").value, 10);

            // if (isNaN(speed) ||是说话人ID低于0或大于160) {
            //     alert("请确保语速和说话人ID输入正确！");
            //     return;
            // }

            play_tts(text, speed, speakerId);
        }

        function stopContent(){
            stop_tts();
        }
    </script>
</body>
</html>



`


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
async function init_env() {

    //将所需文件都下载下来 分别是vs插件 语音生成模型 以及vscode
    const urls = []
    // console.log(await sha_file("./temp/vits-zh-aishell3.zip") )
    if (await sha_file("./temp/vits-zh-aishell3.zip") != "867ce973f37819447c67c27f4287fe892cda3832052e92e17ae7c6c13e1d20e6") {
        console.log("未找到模型文件,将自动下载,文件大小200mb左右,大约需要1分钟")
        urls.push("https://hub.nuaa.cf/SSFRPA/ssfrpa/releases/download/models/vits-zh-aishell3.zip")
    }

    if (urls.length > 0) {
        await ssf.Request.download(urls, "./temp", 1, 5, "")
    }

    await check_init_tts_model()
}


let output_device_flag = -1
//读取tts模型
async function check_init_tts_model() {

    if (output_device_flag == -1) {
        if (ssf.ai.Device.check_default_output_device()) {

            if (!existsSync('./models/vits-zh-aishell3')) {
                console.log("找不到模型文件")
                await decompress("./temp/vits-zh-aishell3.zip", "./models/");
                output_device_flag = 1
                ssf.ai.TTS.init_model("./models/vits-zh-aishell3");

            } else {
                output_device_flag = 1
                ssf.ai.TTS.init_model("./models/vits-zh-aishell3");


            }
            console.log("语音生成模型加载完成")


        } else {
            output_device_flag = 0
        }

    }
}



async function get_html(url: string): string {

    const header = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/json;charset=UTF-8",
        "cookie":""
    };


    const req_obj = [{
        "url": url,
        // "url": "https://book.qq.com/book-read/468914/1",
        // "url": "https://www.piaotia.com/html/0/706/342780.html",

        "timeout": 3000,
        "header": header,
        "encoding": "gb2312",
    }

    ];
    const result = await ssf.Request.get(req_obj)
    let result_text = ''
    result.forEach(element => {
        // console.log(element.status_code, element.text)
        // console.log(element.header)

        if (element.status_code == 200) {
            // const $ = cheerio.load(element.text);
            const gne = new GeneralNewsExtractor()
            const info=gne.extract(element.text, {})
            result_text=info.content
            // console.log(result_text)
            // result_text = extractMainContent(element.text)
            // return text;



        }

    });
    return result_text
}


async function get_result(e: WebUI.Event) {
    const url = e.arg.string(0);
    // console.log(url)

    const content = await get_html(url)
    // console.log(content)
    // e.window.run('document.getElementById("editable-content").innerText='+`${content}`)
    const base64_str = encodeBase64(content); // "Zm9vYmFy"
    // console.log(base64_str)
    await e.window.run(`set_result('${base64_str}');`);


    return ''
    // return 12345;
}


async function play_tts(e: WebUI.Event) {
    const content = e.arg.string(0);
    const speed = e.arg.number(1);
    const speaker = e.arg.number(2);


    ssf.ai.TTS.play_text(content, speaker, speed)

    return ''

}


async function stop_tts(e: WebUI.Event) {
    // console.log("停止............")
    ssf.ai.TTS.stop()
}


await init_env()

// 创建一个窗口
const myWindow = new WebUI();
myWindow.setSize(800, 700);
// 绑定事件
myWindow.bind("get_result", get_result);
myWindow.bind("play_tts", play_tts);
myWindow.bind("stop_tts", stop_tts);



myWindow.bind("exit", () => {
    WebUI.exit();
});
myWindow.show(ui_html);

await WebUI.wait();
