import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import pinyin from "https://deno.land/x/pinyin@0.0.5/mod.ts"

// import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";

import { basename } from "https://deno.land/std@0.221.0/path/mod.ts";
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

function getOpenFolders() {
    const psCommand = `
    $id = 0
    $folders = (New-Object -ComObject Shell.Application).Windows() | ForEach-Object { 
      if ($_.Document -and $_.Document.Folder) { 
        $id++
        [PSCustomObject]@{
          Id = $id
          Title = $_.Document.Folder.Title
          Path = $_.Document.Folder.Self.Path
        } 
      }
    }
    $folders | ConvertTo-Json -Compress
    `;


    try {
        const result = ssf.Windows.cmd("powershell", ["-Command", psCommand]);
        // console.log("result.........",JSON.stringify(result))
        return JSON.parse(result.result)
    } catch (error) {
        console.error(`Error executing PowerShell command: ${error}`);
    }
}

function get_open_info() {

    const dirs = getOpenFolders();
    // console.log(JSON.stringify(dirs))
    const processes = []
    let p_index = 0;
    const childs = ssf.ElementExt.get_root_element().childs()
    //判断任务栏打开的进程
    childs.forEach(element => {
        const p = ssf.Sys.process_info(element.process_id())

        // const process_name = ssf.Windows.find_process_with_hwnd(element.native_window_handle())
        // console.log("进程信息",JSON.stringify(p))
        // console.log(p, basename(p.cmd))
        const p_name = basename(p.exe)
        let args = []
        if (p.cmd.length >= 1) {
            args = p.cmd.slice(1, p.cmd.length);
        }
        if (p_name.toLowerCase().indexOf("explorer.exe") == -1) {

            processes.push({
                name: p_name,
                path: p.exe,
                args: args,
                type: "exe",
                id: p_index

            })
            p_index = p_index + 1
        }


    });

    //单独判断打开的目录
    if (dirs) {
        if (!Array.isArray(dirs)) {
            processes.push({
                name: dirs.Title,
                path: dirs.Path,
                type: "dir",
                id: p_index

            })
            p_index = p_index + 1
        } else {

            dirs.forEach(d => {

                processes.push({
                    name: d.Title,
                    path: d.Path,
                    type: "dir",
                    id: p_index
                })
                p_index = p_index + 1

            });
        }
    }

    return processes

}

function saveJson(filePath, data) {
    const jsonData = JSON.stringify(data, null, 2);
    Deno.writeTextFileSync(filePath, jsonData);
}

function loadJson(filePath) {
    const jsonData = Deno.readTextFileSync(filePath);
    return JSON.parse(jsonData);
}


function findMissingElements(arr1, arr2) {
    // 复制数组，以防止修改原始数组
    let arr1Copy = [...arr1];

    // 遍历第二个数组，从第一个数组中移除找到的元素
    for (let item of arr2) {
        let index = arr1Copy.findIndex(el => el.name === item.name && el.type === item.type);
        if (index !== -1) {
            arr1Copy.splice(index, 1);
        }
    }

    // arr1Copy 中剩下的元素就是缺少的部分
    return arr1Copy;
}

function save_task() {
    // const processes = get_open_info()
    const processes = get_open_info()
    if (!existsSync('./save/')) {
        Deno.mkdirSync("./save", { recursive: true });


    }
    saveJson("./save/1.json", processes)

}
function close_task() {


    // let p_index = 0;
    const childs = ssf.ElementExt.get_root_element().childs()
    //判断任务栏打开的进程
    // const currentid = Deno.pid
    // console.log(currentid,Deno.ppid)
    // ssf.Sys.sleep(3000000)
    childs.forEach(element => {
        const p = ssf.Sys.process_info(element.process_id())

        const p_name = basename(p.exe)


        if (p_name.toLowerCase().indexOf("explorer.exe") == -1) {

            // console.log("pid", p.pid,"parent",p.parent,"element.parent",element.parent().process_id(), "deno ppid",Deno.ppid,Deno.pid,element.name())
            // ssf.Sys.sleep(300000)
            // if ( p.pid != element.process_id()) {
            if (element.name().toLowerCase().indexOf("voice_control.exe") == -1) {

                // ssf.Sys.sleep(3000000)
                // ssf.Sys.sleep(2000)

                ssf.Windows.kill_process(element.process_id())

            }
        } else {
            if (element.name() != "任务栏") {
                try {
                    element.close()
                } catch (_) {

                }
            }


        }


    });



}

function restore_task() {
    const processes = get_open_info()

    const o = loadJson("./save/1.json")
    const missingElements = findMissingElements(o, processes);
    // console.log(JSON.stringify(missingElements))
    missingElements.forEach(element => {
        if (element.type == "dir") {
            // if (element.path.indexOf("::") >= 0) {
            //     ssf.Windows.run("explorer.exe", [element.path])

            // } else {
            //     ssf.Windows.run("explorer.exe", [element.path])

            // }

            ssf.Windows.run("explorer.exe", [element.path])

        } else {
            // console.log(element.path,element.args)
            ssf.Windows.run(element.path, [])

        }

    });

}



//-------------------------<1> 保存任务栏和恢复任务栏


//--------------------------end <1>


////---------------------------------------  简单的语音命令判断
function recursiveTraversal(element, control_type, result) {

    if (element) {
        for (const t of control_type) {
            if (element.control_type().startsWith(t) && !element.is_offscreen()) {

                // console.log(element.control_type(),control_type)
                // console.log(element.name(), element.control_type())
                result.push(element)
            }
        }

        // if(element.name()!=""){
        //     result.push(element)

        // }


        const children = element.childs();
        for (const child of children) {
            recursiveTraversal(child, control_type, result);
            // result.push(element)
        }
    }
    return null;
}
const det_data = []
let det_pid = null;
//用于定位元素
function det_element(control_type, isshow = true) {
    if (det_pid) {
        ssf.Windows.kill_process(det_pid)
        ssf.Sys.sleep(300)
    }
    det_data.length = 0
    const hwnd = ssf.Windows.get_foreground_window()
    const ele = ssf.ElementExt.parse(hwnd, "/", 3000)
    const result = []
    recursiveTraversal(ele, control_type, result)
    // const data=[]
    let index = 1;
    result.forEach(element => {
        const rect = element.bounding_rectangle()
        // console.log(JSON.stringify(rect), element.name())
        det_data.push({
            x: Math.floor((rect.x + rect.w / 2)),
            y: Math.floor((rect.y + rect.h / 2)),
            // x: rect.x,
            // y: rect.y,
            r: 200,
            g: 200,
            b: 30,
            a: 0,
            font_size: 10,
            radius: 15,
            text: index.toString()
            // text:element.name()


        })
        index = index + 1
    });
    // console.log(JSON.stringify(det_data))
    if (isshow) {
        // const pid = ssf.Windows.run("./ui_ext/ssf_ui.exe", [JSON.stringify(det_data)])
        const pid = ssf.Windows.run("./ui_ext/ssf_ui.exe", [JSON.stringify(det_data)])
        console.log(pid)

        det_pid = pid;
    } else {
        det_pid = null;
    }



}



// 计算字符串相似度的函数
// function similarity(s, t) {
//     let n = s.length, m = t.length;
//     if (n === 0) return m;
//     if (m === 0) return n;

//     let d = Array.from(Array(n + 1), () => Array(m + 1).fill(0));

//     for (let i = 0; i <= n; i++) d[i][0] = i;
//     for (let j = 0; j <= m; j++) d[0][j] = j;

//     for (let i = 1; i <= n; i++) {
//         for (let j = 1; j <= m; j++) {
//             let cost = s[i - 1] === t[j - 1] ? 0 : 1;
//             d[i][j] = Math.min(
//                 d[i - 1][j] + 1,      // 删除操作
//                 d[i][j - 1] + 1,      // 插入操作
//                 d[i - 1][j - 1] + cost  // 替换操作
//             );

//             // 考虑字符交换操作（Damerau-Levenshtein 距离特有）
//             if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
//                 d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
//             }
//         }
//     }

//     return d[n][m];
// }


function chineseToNumber(chinese) {
    const chineseNumbers = {
        "零": 0, "一": 1, "二": 2, "三": 3, "四": 4,
        "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
        "十": 10, "百": 100, "千": 1000, "万": 10000, "亿": 100000000
    };

    let result = 0;
    let temp = 0;
    let unit = 1;

    for (let i = 0; i < chinese.length; i++) {
        const char = chinese[i];
        const number = chineseNumbers[char];

        if (number >= 10) {
            if (temp !== 0) {
                temp *= number;
                result += temp;
                temp = 0;
            } else {
                temp = number;
            }
        } else {
            temp += number;
        }
    }

    result += temp;

    return result;
}


function similarity2(s, t) {
    let l = Math.max(s.length, t.length);
    let d = similarity(s.toLowerCase(), t.toLowerCase());
    return (1 - d / l).toFixed(4);
}



// function extractTextAndMode(input) {
//     const patterns = [
//         { mode: "输入", pattern: /.*输入\s*(.*)/ },
//         { mode: "翻译", pattern: /.*翻译\s*(.*)/ },
//         { mode: "搜索", pattern: /.*搜索\s*(.*)/ },
//         { mode: "点击", pattern: /.*点击\s*(.*)/ },
//         { mode: "回退", pattern: /.*回退\s*(.*)/ },
//         { mode: "查找", pattern: /.*查找\s*(.*)/ },
//     ];

//     for (const { mode, pattern } of patterns) {
//         const match = input.match(pattern);
//         if (match) {
//             return { mode, text: match[1] };
//         }
//     }

//     return null; // 如果不符合任何模式，返回 null
// }





function convertToPinyin(text) {
    // 使用 pinyin 库将中文转换为拼音数组，然后取首字母
    const pinyinArray = pinyin(text, { style: pinyin.STYLE_NORMAL });
    return pinyinArray.map(item => item[0]).join('');
}

function extractTextAndMode(input) {
    const patterns = [
        { mode: "输入", pattern: /输入\s*(.*)/ },
        { mode: "翻译", pattern: /翻译\s*(.*)/ },
        { mode: "搜索", pattern: /搜索\s*(.*)/ },
        { mode: "点击", pattern: /点击\s*(.*)/ },
        { mode: "回退", pattern: /回退\s*(.*)/ },
        { mode: "查找", pattern: /查找\s*(.*)/ },
    ];

    for (const { mode, pattern } of patterns) {
        const match = input.match(pattern);
        if (match) {
            return { mode, text: match[1] };
        }

        // 对于拼音模糊匹配
        const pinyinInput = convertToPinyin(input);
        const pinyinPattern = convertToPinyin(mode);
        if (pinyinInput.includes(pinyinPattern)) {
            // 找到模式文本在输入文本中的起始位置
            const modeIndex = input.indexOf(mode);
            if (modeIndex !== -1) {
                // 截取模式文本之后的位置作为 text
                const matchedText = input.substring(modeIndex + mode.length).trim();
                return { mode, text: matchedText };
            }
        }
    }

    return null; // 如果不符合任何模式，返回 null
}


const COMMAND_LIST = [
    "开始输入",
    "结束输入",
    "关闭当前进程",
    "快速截图",
    "关闭标签",
    "定位按钮",
    "定位编辑框",
    "定位列表",
    "定位树形控件",
    "定位标签",
    "取消定位",
    "恢复任务栏",
    "保存任务栏",
    "切换窗口",
    "点击当前位置",
    "简单粗暴快速关闭所有任务",

];

const MODE_LIST = [
    "开始输入",
    "结束输入",
    "关闭当前进程",
    "快速截图",
    "关闭标签",
    "定位按钮",
    "定位编辑框",
    "定位列表",
    "定位树形控件",
    "定位标签",
    "取消定位",
    "恢复任务栏",
    "保存任务栏",
    "切换窗口",
    "点击当前位置",
    "简单粗暴快速关闭所有任务",


];

// const MODE_START = 0;
// const MODE_END = 1;

// function parse_text(text) {
//     let resultIndex = -1;
//     let maxScore = 0;
//     COMMAND_LIST.forEach((command, index) => {
//         let score = similarity2(text, command);
//         if (score > maxScore && score > 0.4) {
//             resultIndex = index;
//             maxScore = score;
//         }
//     });
//     return { index: resultIndex, score: maxScore };
// }


// function convertToPinyin2(text) {
//     // 使用 pinyin 库将中文转换为拼音数组，然后取首字母
//     const pinyinArray = pinyin(text, { style: pinyin.STYLE_FIRST_LETTER });
//     return pinyinArray.map(item => item[0]).join('');
// }

function parse_text(text) {
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
        case "开始输入":
            mode = 0;
            break;
        case "结束输入":
            mode = 1;
            break;
        case "关闭当前进程":
            { kill_current() }
            break;

        case "快速截图":
            {
                if (!existsSync('./screenshot')) {
                    Deno.mkdirSync("./screenshot", { recursive: true });

                }
                const img = ssf.Frame.to_image(1, 1000)
                img.save("./screenshot/" + Date.now().toString() + ".png")

            }
            break;
        case "关闭标签":
            {
                const tid = ssf.Browser.current_tab(3000).id;
                ssf.Browser.remove_tab(tid, 3000)

            }
            break;
        case "定位按钮":
            {
                det_element(["Button"])

            }
            break;
        case "定位列表":
            {
                det_element(["ListItem"])

            }
            break;
        case "定位树形控件":
            {
                det_element(["TreeItem"])

            }
            break;
        case "定位标签":
            {
                det_element(["TabItem"])

            }
            break;
        case "定位编辑框":
            {
                det_element(["Edit", "ComboBox"])

            }
            break;

        case "取消定位":
            {
                if (det_pid) {
                    ssf.Windows.kill_process(det_pid)

                }


            }
            break;
        case "恢复任务栏":
            {
                restore_task()


            }
            break;
        case "保存任务栏":
            {
                save_task()


            }
            break;
        case "切换窗口":
            {
                ssf.Input.key(ssf.enums.KeyCode.Alt, ssf.enums.Direction.Press)
                ssf.Input.key(ssf.enums.KeyCode.Tab, ssf.enums.Direction.Press)
                ssf.Sys.sleep(300)
                det_element(["ListItem"], false)




            }
            break;
        case "点击当前位置":
            {

                ssf.Input.key(ssf.enums.Button.Left, ssf.enums.Direction.Click)
                ssf.Sys.sleep(300)




            }
            break;
        case "简单粗暴快速关闭所有任务":
            {


                close_task()


            }
            break;

    }
}

function click_num(text) {
    if (det_pid) {
        ssf.Windows.kill_process(det_pid)

    }
    ssf.Sys.sleep(500)
    const num = chineseToNumber(text) - 1
    // console.log(num, text)

    ssf.Input.move(det_data[num].x, det_data[num].y, ssf.enums.Coordinate.Abs)
    ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
}


function back_text(text) {
    const num = chineseToNumber(text)
    for (let index = 0; index < num; index++) {
        ssf.Input.key(ssf.enums.KeyCode.Backspace, ssf.enums.Direction.Click)

    }


}



function find_ele(element, text, result = []) {
    if (element) {
        const name = element.name();
        if (name != "") {
            const score = similarity2(text, name);
            result.push({
                score: score,
                ele: element
            });
        }

        const children = element.childs();
        for (const child of children) {
            find_ele(child, text, result);
        }
    }
}

function find_text_pos(text, isshow = true) {
    if (det_pid) {
        ssf.Windows.kill_process(det_pid)
        ssf.Sys.sleep(300)

    }
    det_data.length = 0

    const hwnd = ssf.Windows.get_foreground_window()
    const root = ssf.ElementExt.parse(hwnd, "/", 3000)
    // root.bounding_rectangle
    const result = [];
    find_ele(root, text, result);
    // console.log(JSON.stringify)
    // // 找出分数最高的结果
    // if (result.length > 0) {
    //     result.sort((a, b) => b.score - a.score);
    //     // return result[0].ele; // 返回分数最高的元素
    // }
    // if (result.length > 0) {
    //     const rect = result[0].ele.bounding_rectangle()
    //     ssf.Input.move(rect.x + rect.w / 2, rect.y + rect.h / 2, ssf.enums.Coordinate.Abs)

    // }

    let index = 1;
    result.forEach(find_obj => {
        if (find_obj.score > 0.01) {
            const rect = find_obj.ele.bounding_rectangle()
            // console.log(JSON.stringify(rect), element.name())
            det_data.push({
                x: Math.floor((rect.x + rect.w / 2)),
                y: Math.floor((rect.y + rect.h / 2)),
                // x: rect.x,
                // y: rect.y,
                r: 200,
                g: 200,
                b: 30,
                a: 0,
                font_size: 10,
                radius: 15,
                text: index.toString()
                // text:element.name()


            })
            index = index + 1

        }

    });
    // console.log(JSON.stringify(det_data))
    if (isshow && det_data.length > 0) {
        const pid = ssf.Windows.run("./ui_ext/ssf_ui.exe", [JSON.stringify(det_data)])
        det_pid = pid;
    } else {
        det_pid = null;
    }


}

//检测插件是否安装
function search(text) {
    try {
        // const chrome_path = ssf.Windows.get_reg_value("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe", "")
        const browser_path = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        // if (ssf.Windows.find_process("msedge.exe") == 0) {
        //     ssf.Windows.run(browser_path, [])
        // }

        //判断插件是否安装,后续直接可以google商店安装
        // try {
        //     const chrome_ext = ssf.Windows.get_reg_value("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallAllowlist", "99999")
        //     if (ssf.Windows.find_process("chrome.exe") == 0) {
        //         ssf.Windows.run(chrome_path, [])
        //     }
        // } catch (error) {
        //     console.log("未允许插件,将自动注册插件,后续可以从google商店安装", error)
        //     console.log(ssf.Windows.cmd("reg", ["add", "HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallAllowlist", "/v", "99999", "/t", "reg_sz", "/d", "eamibgnfgfhlmnbedbegigiaiedokgjh", "/f"]))

        // }
        // console.log("??????")
        let chrome_app = null
        try {
            chrome_app = ssf.ElementExt.find_task_bar("Edge", 1000)

        } catch (_) {
            //
        }
        // console.log("..............",chrome_app)
        if (!chrome_app) {
            ssf.Windows.run(browser_path, [])
            ssf.Sys.sleep(1000)
            chrome_app = ssf.ElementExt.find_task_bar("Edge", 1000)

        }

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
ssf.ai.ASR.listen_input("./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20", 3.6, 1.8, 10.0);
ssf.ai.Translate.init_model("./models/translate/tokenizer-marian-base-zh2en.json", "./models/translate/tokenizer-marian-base-zh2en_des.json", "./models/translate/zh-en-model.safetensors");
console.log("开始监听麦克风");
ssf.ai.Device.init_audio()
// for await (const dirEntry of Deno.readDir("./")) {
//     console.log(dirEntry.name);
//   }
// console.log(dir)

const voice1 = ssf.ai.Device.load_audio("./voice_files/1.wav")
const voice2 = ssf.ai.Device.load_audio("./voice_files/2.mp3")

let last_text = ""
while (true) {
    try {
        let text = ssf.ai.ASR.get_result();
        if (last_text == "" && text.length <= 2) {
            last_text = text
            continue
        } else {
            text = last_text + text;
            last_text = ''
        }


        console.log("-------", text);
        const quick_text = extractTextAndMode(text);
        if (quick_text) {
            ssf.ai.Device.audio_play(voice2);
            console.log("=====>", quick_text.mode);
            if (quick_text.text.length === 0) {
                continue;
            } switch (quick_text.mode) {
                case "输入":
                    ssf.Input.text(quick_text.text);
                    break;
                case "翻译":
                    {
                        const tr_text = ssf.ai.Translate.parse(quick_text.text);
                        ssf.Input.text(tr_text);

                    } break;


                case "搜索": {
                    search(quick_text.text)
                } break;
                case "点击": {
                    click_num(quick_text.text)
                } break;
                case "回退": {
                    back_text(quick_text.text)
                } break;

                case "查找": {
                    find_text_pos(quick_text.text)
                } break;
            }
            continue
        }

        let model = parse_text(text);


        if (model.index !== -1) {
            ssf.ai.Device.audio_play(voice2)

            console.log("匹配到命令----->", MODE_LIST[model.index], "概率:", model.score);
            run_text(MODE_LIST[model.index]);
            continue;
        }

        // console.log(mode);

        if (mode === 0) {
            ssf.ai.Device.audio_play(voice2)

            // const tr_text = ssf.ai.Translate.parse(text);
            ssf.Input.text(tr_text);
            continue;

        }
        ssf.ai.Device.audio_play(voice1)
    } catch (error) {
        console.log(error)

        continue
    }


}