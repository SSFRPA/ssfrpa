
import { WebUI } from "https://deno.land/x/webui@2.4.4/mod.ts";
import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";


ssf.Sys.listen_exit()
//界面
const myHtml = `
<!DOCTYPE html>
<html>
	<head>
    <meta charset="UTF-8">
    <script src="webui.js"></script>
		<title>新一代RPA引擎SSF</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        color: white;
        background: linear-gradient(to right, #507d91, #1c596f, #022737);
        text-align: center;
        font-size: 18px;
      }
      button, input {
        padding: 10px;
        margin: 10px;
        border-radius: 3px;
        border: 1px solid #ccc;
        box-shadow: 0 3px 5px rgba(0,0,0,0.1);
        transition: 0.2s;
      }
      button {
        background: #3498db;
        color: #fff; 
        cursor: pointer;
        font-size: 16px;
      }
      h1 { text-shadow: -7px 10px 7px rgb(67 57 57 / 76%); }
      button:hover { background: #c9913d; }
      input:focus { outline: none; border-color: #3498db; }
    </style>
    </head>
    <body>
    <h1>自动化部署编程环境</h1><br>
   
    <h2>点击运行后即可开始自动化操作</h2><br>
    <h2>整个过程可能需要3~5分钟,期间请勿移动鼠标,如遇到安装失败可以重复运行,程序内部会判断重复安装的情况</h2><br>
    <span id="vscode_lable">检测到vscode安装到:</span><span id="vscode_path"></span><br><br>
    你可以随时按Ctrl+F9终止程序运行<br><br>
    <input type="checkbox" id="enableSpeech" checked onchange="toggleSpeech()"> 启用语音播报(建议启用)<br><br>
    <button id="run" OnClick="run()">运行</button><button id="exit">退出</button>
    <script>
        function set_vscode_path(path) {
            document.getElementById("vscode_path").innerHTML = path;
        }

        function set_setup_path(path) {
            document.getElementById("vscode_lable").innerHTML = "vscode将安装到以下目录";
            document.getElementById("vscode_path").innerHTML = path;
        }

        // 启用或禁用语音播报功能
        function toggleSpeech() {
            var speechEnabled = document.getElementById("enableSpeech").checked;
            set_tts(speechEnabled)
        }
    </script>
</body>
</html>
`;

//判断是否启用语音播报
let is_tts = true;
async function set_tts(e: WebUI.Event) {
    is_tts = e.arg.boolean(0);
    // console.log("is_tts", is_tts)
}

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



//用于手动递归查找元素
function recursiveTraversal(element: ssf.WinElement, names: string[], control_type = ""): ssf.WinElement | null {
    if (element) {
        for (const name of names) {
            if (element.name().startsWith(name)) {
                if (control_type!="") {
                    if (element.control_type().startsWith(control_type)) {
                        console.log(element.control_type(),control_type)
                        return element;
                    }

                } else {
                    return element;
                    
                }
            }
        }

        const children = element.childs();
        for (const child of children) {
            const foundElement = recursiveTraversal(child, names,control_type);
            if (foundElement !== null) {
                return foundElement;
            }
        }
    }
    return null;
}


let vscodePath = "未找到";
try {
    vscodePath = ssf.Windows.get_reg_value("\\HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{771FD6B0-FA20-440A-A002-3B3BAC16DC50}_is1", "InstallLocation")
}
catch {
    vscodePath = "未找到";
}

let device_flag = -1

async function check_init_tts_model() {

    if (device_flag == -1) {
        if (ssf.ai.Device.check_default_output_device() && is_tts) {

            if (!existsSync('./models/vits-zh-aishell3')) {
                console.log("找不到模型文件")
                await decompress("./temp/vits-zh-aishell3.zip", "./models/");
                device_flag = 1
                ssf.ai.TTS.init_model("./models/vits-zh-aishell3");

            } else {
                device_flag = 1
                ssf.ai.TTS.init_model("./models/vits-zh-aishell3");


            }

        } else {
            device_flag = 0
        }

    }
}

//判断当前是否开启了扬声器 is_async代表是否用异步播放声音
function play_text(text: string, is_async: boolean): void {
    const sid = 66
    const speed = 1.0


    if (device_flag == 1) {
        if (is_async) {
            ssf.ai.TTS.play_text(text, sid, speed)

        }
        else {
            ssf.ai.TTS.play_text(text, sid, speed)
            ssf.ai.TTS.wait()

        }
    }
    console.log(`%c${text}`, "color: red; font-weight: bold")

}

//初始化环境
async function init_env() {

    //将所需文件都下载下来 分别是vs插件 语音生成模型 以及vscode
    const urls = []
    if (await sha_file("./temp/vscode-deno.vsix") != "2023cabd73ebb1a3a70cba986ac88f19d73d66333f1e3b5f627b9366cf32fceb") {
        urls.push("https://github.com/denoland/vscode_deno/releases/download/3.37.0/vscode-deno.vsix");

    }
    if (await sha_file("./temp/vits-zh-aishell3.zip") != "ffcd234452345af05923853275744bf5d2d3c8ef71d55740e5a9c69e6651e258" && is_tts) {
        urls.push("https://github.com/SSFRPA/ssf/releases/download/models/vits-zh-aishell3.zip")
    }

    if (await sha_file("./temp/VSCodeUserSetup-x64-1.88.1.exe") != "487b08f664da5845cfa5fb63adc958b68eb2b58aaf5542d894f0a2a4bf93444c") {
        urls.push("https://vscode.download.prss.microsoft.com/dbazure/download/stable/e170252f762678dec6ca2cc69aba1570769a5d39/VSCodeUserSetup-x64-1.88.1.exe")
    }

    // if (await sha_file("./temp/vs_deno_config.zip") != "ede10c55bfdd21c64471e8278b978c98ab697337f0ac51795c6e9180e6b6cd9a") {
    //     urls.push("https://download.nuaa.cf/SSFRPA/ssf/releases/download/example/vs_deno_config.zip")

    // }
    if (urls.length > 0) {
        await ssf.Request.download(urls, "./temp", 1, 5, "")
    }


    // if (!existsSync('./.vscode')) {
    //     await decompress("./temp/vs_deno_config.zip", "./")

    // }
    await check_init_tts_model()
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

//如果找不到vscode将进行安装
function vscode_setup() {

    ssf.Windows.run("./temp/VSCodeUserSetup-x64-1.88.1.exe", [])
    ssf.Sys.sleep(2000)
    let setup_ele = find_task_bar("安装", 5000)
    if (setup_ele) {
        setup_ele.try_focus()

        let setup_hwnd = setup_ele.native_window_handle()
        try {
            //有些会有权限要求

            ssf.ElementExt.parse(setup_hwnd, "/Button", 2000).click()
            ssf.Sys.sleep(2000)
            //句柄毕竟变动
            setup_ele = find_task_bar("安装", 5000)
            setup_hwnd = setup_ele.native_window_handle()
        } catch {
            //未找到权限弹出框
        }

        setup_ele.try_focus()
        //同意
        ssf.ElementExt.parse(setup_hwnd, "/Pane/Pane/Pane[1]/Pane/RadioButton[2]", 2000).click()
        //下一步
        ssf.ElementExt.parse(setup_hwnd, "/Button[1]", 2000).click()

        //编辑路径
        // ssf.ElementExt.set_Ime(1, setup_hwnd)
        // ssf.Sys.sleep(1000)
        ssf.ElementExt.parse(setup_hwnd, "/Pane/Pane/Pane[1]/Pane/Edit[2]", 2000).try_focus()
        ssf.ElementExt.set_Ime(0, setup_hwnd)
        ssf.Sys.sleep(1000)
        ssf.ElementExt.parse(setup_hwnd, "/Pane/Pane/Pane[1]/Pane/Edit[2]", 2000).send_keys(default_vscodePath, 20)
        ssf.Sys.sleep(1000)



        ssf.ElementExt.parse(setup_hwnd, "/Button[2]", 2000).click()
        recursiveTraversal(setup_ele, ["是(Y)"])?.click()
        // ssf.ElementExt.parse(setup_hwnd, "/Window/Button", 2000).click()

        ssf.ElementExt.parse(setup_hwnd, "/Button[2]", 2000).click()
        ssf.ElementExt.parse(setup_hwnd, "/Button[2]", 2000).click()
        //连续3个下一步后开始安装  安装时间较久 这点最长等待60s
        ssf.ElementExt.parse(setup_hwnd, "/Button[2]", 2000).click()
        const startTime = Date.now();

        while (true) {
            try {
                if (ssf.ElementExt.parse(setup_hwnd, "/Pane/Pane/Text", 2000).name().indexOf("安装完成") > 0) {

                    break
                }
            } catch {
                //
            }

            const elapsedTime = Date.now() - startTime;

            if (elapsedTime >= 60000) {
                throw new Error("超时找不到成功完成标志")
            }

            ssf.Sys.sleep(200)
        }

        //完成安装
        ssf.ElementExt.parse(setup_hwnd, "/Button[1]", 2000).click()

    } else {
        throw new Error('未找到匹配项');

    }


}




//开启vscode 安装插件
function vscode_op() {
    //查找是否打开了vscode
    play_text("准备进行插件安装", false)
    //检测有没有启动vscode
    if (ssf.Windows.find_process("Code.exe") == 0) {
        ssf.Windows.run(vscodePath + "\\Code.exe", [])

    }
    ssf.Sys.sleep(2000)

    //查找任务栏是否有出现vscode
    const vscode_ele = find_task_bar("Visual Studio Code", 5000);
    vscode_ele.try_focus()

    ssf.Sys.sleep(2000)
    // const hwnd = ssf.Windows.get_foreground_window()
    const hwnd = vscode_ele.native_window_handle()

    // ssf.Sys.sleep(1500)
    // ssf.ElementExt.set_Ime(1, hwnd)
    // ssf.Sys.sleep(1000)

    // const windows=ssf.Windows.enum_windows()
    // windows.forEach(element => {
    //     ssf.ElementExt.set_Ime(0, element.hwnd)
    // });
    ssf.Sys.sleep(1000)

    ssf.ElementExt.enabled_automation(hwnd)
    ssf.Sys.sleep(2000)

    // ssf.ElementExt.parse(hwnd, "/Document/Group/Window/Group/Group/Group[1]/Group[1]/Group/Group[1]/Group/Group/Tab/TabItem[4]", 3000).click();
    recursiveTraversal(vscode_ele, ["扩展 (Ctrl+Shift+X)", "Extensions (Ctrl+Shift+X)"])?.click()
    ssf.Sys.sleep(1500)


    ssf.ElementExt.set_Ime(0, ssf.Windows.get_foreground_window())
    ssf.Sys.sleep(1000)
    // console.log("11111111111111111")
    // console.log(ssf.ElementExt.get_Ime(hwnd))

    // ssf.ElementExt.parse(hwnd, "/Document/Group/Window/Group/Group/Group[1]/Group[1]/Group/Group[1]/Group[1]/Group/ToolBar[1]/Group[1]/Group/MenuItemp", 3000).click();
    const bent_more = recursiveTraversal(vscode_ele, ["...", "视图和更多操作", "Views and More Actions"]);
    bent_more?.click()
    ssf.Sys.sleep(1500)

    const find_ele = recursiveTraversal(vscode_ele, ["从 VSIX 安装", "Install from VSIX"]);
    find_ele?.click()

    ssf.Sys.sleep(2500)

    const currentDirectory = Deno.cwd();
    ssf.ElementExt.parse(hwnd, "/Window/Pane[2]/ComboBox/Edit", 3000).try_focus()
    // ssf.ElementExt.set_Ime(0, ssf.Windows.get_foreground_window())



    ssf.ElementExt.parse(hwnd, "/Window/Pane[2]/ComboBox/Edit", 3000).send_keys(currentDirectory + "\\temp\\vscode-deno.vsix", 20);
    ssf.Sys.sleep(1000)
    const btn = ssf.ElementExt.parse(hwnd, "/Window/Button[4]", 3000)
    btn.try_focus()
    btn.click();
    ssf.Sys.sleep(2000)
    ssf.ElementExt.parse(hwnd, "/Document/Group/Window/Group/Group/Group[1]/Group[1]/Group/Group[1]/Group/Group/Tab/TabItem/Group", 3000).click();

    ssf.Sys.sleep(1000)
    const reload_ele = recursiveTraversal(vscode_ele, ["立即重载", "Reload Now"]);
    reload_ele?.click()


}


function write_code() {

    //查找任务栏是否有出现vscode
    const vscode_ele = find_task_bar("Visual Studio Code", 5000);
    vscode_ele.try_focus()
    const vs_hwnd = vscode_ele.native_window_handle()
    ssf.Sys.sleep(1000)

    vscode_ele.hold_send_keys("{Ctrl}", "ko", 0)
    ssf.Sys.sleep(1000)

    const currentDirectory = Deno.cwd();

    // ssf.Sys.sleep(1000)
    // ssf.ElementExt.set_Ime(1, vs_hwnd)
    // ssf.Sys.sleep(1000)
    ssf.ElementExt.set_Ime(0, vs_hwnd)
    ssf.Sys.sleep(1000)


    ssf.ElementExt.parse(vs_hwnd, "/Window/Edit[2]", 3000).click()
    ssf.ElementExt.parse(vs_hwnd, "/Window/Edit[2]", 3000).send_keys(currentDirectory, 50);

    const select_dir_ele = recursiveTraversal(vscode_ele, ["选择文件夹"]);
    select_dir_ele?.click()

    ssf.Sys.sleep(2000)

    const temp_ele = ssf.ElementExt.parse(vs_hwnd, "/", 3000);

    //可能会弹出权限验证
    const find_safe = recursiveTraversal(temp_ele, ["Yes, I trust the authors", "是，我信任此作者"],"Button");
    console.log("bounding_rectangle", find_safe?.bounding_rectangle(), find_safe?.name(), find_safe?.control_type(), "parent", find_safe?.parent().name())
    if (find_safe) {
        find_safe?.click()
        ssf.Sys.sleep(1000)

    }


    // ssf.ElementExt.parse(vs_hwnd, " /Document/Group/Window/Group/Group/Group[1]/Group[1]/Group/Group[1]/Group[2]/Group/Group[1]/Group/Group/Group/Group/Group/Group[1]/Group/Group[1]/Edit/Group/Edit[1]", 3000).try_focus()
    vscode_ele.try_focus()
    if (!existsSync('./hello.ts')) {
        play_text("文件不存在,将新建一个文件", false)
        vscode_ele.hold_send_keys("{Ctrl}{Alt}{Win}", "n", 0)
        ssf.Sys.sleep(2000)

        recursiveTraversal(vscode_ele, ["文本文件, 内置, 文件", "Text File, Built-In, File"])?.send_keys("hello.ts{Enter}", 50);

        // ssf.ElementExt.parse(vs_hwnd, "/Document/Group/Window/Group[3]/Group[6]/List/Group/ListItem", 3000).send_keys("hello.ts{Enter}", 50)

        ssf.Sys.sleep(2000)

        ssf.ElementExt.parse(vs_hwnd, "/Window/Button[2]", 3000).click()

        const hello_ele = recursiveTraversal(vscode_ele, ["hello.ts"]);
        hello_ele?.double_click()
        ssf.Sys.sleep(2000)

        vscode_ele.send_keys(`//将演示如何2行代码完成语音生成;{Enter}`, 50)


        ssf.Input.text(`ssf.ai.TTS.init_model("./models/vits-zh-aishell3");`)
        //使用自然模拟输入,可以替代元素输入应对更复杂的输入场景
        ssf.Input.key(ssf.enums.KeyCode.Return, ssf.enums.Direction.Click)
        ssf.Input.text(`ssf.ai.TTS.play_text("这是一个语音生成的演示", 66, 1.0);`)
        ssf.Input.key(ssf.enums.KeyCode.Return, ssf.enums.Direction.Click)

        ssf.Input.text(`ssf.ai.TTS.wait();`)


        vscode_ele.send_keys("{Ctrl}{F5}", 20);
        console.log("============================演示完成============================")


    } else {

        const hello_ele = recursiveTraversal(vscode_ele, ["hello.ts"]);
        hello_ele?.double_click()
        vscode_ele.send_keys("{Ctrl}{F5}", 20);
        console.log("============================演示完成============================")

    }

}

async function run(e: WebUI.Event) {

    try {
        await init_env();
        play_text("所有文件校验完毕,即将开始安装,这个过程你随时可以按快捷键中止,为了完整演示,过程需要3到5分钟,请耐心等待", false)
        if (vscodePath == "未找到") {

            vscode_setup()
            ssf.Sys.sleep(3000)
            vscode_op()

        } else {
            vscode_op();


        }
        write_code()
    } catch (error) {

        console.log(`%c${error}`, "color: red; font-weight: bold")

    }

    return "";
}



let default_vscodePath = "c:\\Programs\\Microsoft VS Code\\";

// 创建一个窗口
const myWindow = new WebUI();
myWindow.setSize(800, 700);
// 绑定事件
myWindow.bind("run", run);

myWindow.bind("set_tts", set_tts);


myWindow.bind("exit", () => {
    WebUI.exit();
});
myWindow.show(myHtml);
// const path = vscodePath.replaceAll("\\", "\\\\")
if (vscodePath == "未找到") {
    const disks = ssf.Sys.disk_info();
    //如果有D盘存在则安装在D盘
    if (disks.length > 1) {
        default_vscodePath = "d:\\Programs\\Microsoft VS Code\\"
    }
    myWindow.run(String.raw`set_setup_path('${default_vscodePath.replaceAll("\\", "\\\\")}');`);


} else {
    myWindow.run(String.raw`set_vscode_path('${vscodePath.replaceAll("\\", "\\\\")}');`);

}

await WebUI.wait();
console.log("完成")
