//演示如何语音输入和tts播放
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";
import { WebUI } from "https://deno.land/x/webui@2.4.4/mod.ts";
import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";


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

    if (await sha_file("./temp/vits-zh-aishell3.zip") != "ffcd234452345af05923853275744bf5d2d3c8ef71d55740e5a9c69e6651e258") {
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

        } else {
            output_device_flag = 0
        }

    }
}

//判断当前是否开启了扬声器 is_async代表是否用异步播放声音
function play_text(text: string): void {
    const sid = 66
    const speed = 1.0


    if (output_device_flag == 1) {
        // if (is_async) {
        //     ssf.ai.TTS.play_text(text, sid, speed)

        // }
        // else {
        ssf.ai.TTS.play_text(text, sid, speed)


        // }
    }
    console.log(`%c${text}`, "color: red; font-weight: bold")

}

// 查找任务栏
function find_task_bar(name: string, timeout_ms: number): ssf.WinElement {
    const startTime = Date.now();

    while (true) {

        const root_ele = ssf.ElementExt.get_root_element();
        const foundChild = root_ele.childs().find(child => child.name().indexOf(name) >= 0);
        if (foundChild) {
            return foundChild;
        }

        const elapsedTime = Date.now() - startTime;

        if (elapsedTime >= timeout_ms) {
            throw new Error('查找元素超时');
        }

        ssf.Sys.sleep(200); // 等待200毫秒
    }
}

const hashTable = new Map<string, string>();


async function hash_str(s: string): Promise<string> {

    const messageBuffer = new TextEncoder().encode(s);
    const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);
    const hash = encodeHex(hashBuffer);
    return hash
}

// 函数来检查字符串是否包含英文字符
function containsEnglishCharacters(str) {
    // 正则表达式，匹配 a-z 或 A-Z
    const englishRegex = /[a-zA-Z]/;

    // 使用 test() 方法检查是否匹配
    return englishRegex.test(str);
}




async function for_message(qq_ele: ssf.WinElement) {
    const messages = ssf.ElementExt.parse_with_element(qq_ele, '/Document/Group/Group[1]/Group[1]/Group[1]/Group/Group[1]/Group[1]/Window[2]/Group/Group/', 5000).childs()


    for (const element of messages) {

        let username = null;

        let details = null;
        try {
            details = ssf.ElementExt.parse_with_element(element, '/Group/Group/Group[1]/Group/Group/', 300).childs()
            username = ssf.ElementExt.parse_with_element(element, '/Group/Group/Group', 5000)


        } catch {
            try {
                details = ssf.ElementExt.parse_with_element(element, '/Group/Group[1]/Group[1]/Group/Group/', 300).childs()
                username = ssf.ElementExt.parse_with_element(element, '/Group/Group[1]/Group', 5000)

            } catch {//

            }
            //
        }
        if (!username || !details) {
            break
        }

        let username_val = username.name()
        if (containsEnglishCharacters(username_val)) {

            username_val = "英文昵称"
        }

        // console.log(username.name(), detail.name())
        let content = username_val + "说:------"
        for (const detail of details) {


            content += detail.name().toString();


        }
        const hash_key = await hash_str(content);
        if (!hashTable.has(hash_key)) {
            //异步避免被锁住
            play_text(content)
            hashTable.set(hash_key, hash_key)
        }
        // break;

    }

}

//初始化语音
await init_env()


if (ssf.Windows.find_process("qq.exe") == 0) {

    throw "未找到QQ进程,请打开qq进行演示";

}
ssf.Sys.sleep(2000)

//查找任务栏是否有出现qq
const qq_ele = find_task_bar("QQ", 5000);
qq_ele.try_focus()
const hwnd = qq_ele.native_window_handle()
ssf.ElementExt.enabled_automation(hwnd)
ssf.Sys.sleep(2000)
ssf.Windows.switch_to_this_window(hwnd)
const list = ssf.ElementExt.parse(hwnd, '/Document/Group/Group[1]/Group[1]/Group[1]/Group/Group/Group/Group[1]/Window/', 5000).childs()
//
// list.forEach(element => {
//     const item = ssf.ElementExt.parse_with_element(element, '/Group[1]/Group/Group/Text', 5000)
//     console.log(item.name())
// });


await for_message(qq_ele)

// ssf.Sys.sleep(10000000)

ssf.ai.TTS.wait()