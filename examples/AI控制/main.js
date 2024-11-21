

import { parse_text, MODE_LIST } from './parse_text.js';
import { GlobalKeyboardListener } from 'npm:node-global-key-listener';
import GeneralNewsExtractor from "../AI控制/general-news-extractor-js/general-news-extractor.ts"

function stop_last(last_work) {
  if (last_work) {

    // console.log("触发结束1")
    last_work.postMessage({ question: "", in_flag: true, time: BigInt(-1) });

  }
}
let is_stop = false

ssf.Browser.listen()
ssf.ai.Device.init_audio()

const voice1 = ssf.ai.Device.load_audio("./voice_files/1.wav")
const voice2 = ssf.ai.Device.load_audio("./voice_files/2.mp3")

const chat_ext_worker = new Worker(import.meta.resolve("./chat_ext.js"), { type: "module" });
const asr_ext_worker = new Worker(import.meta.resolve("./asr_ext.js"), { type: "module" });
chat_ext_worker.onmessage = async (e) => {
  ssf.ai.Device.audio_play(voice2)
  console.log("中断海棠")
  is_stop = true
  if (task) {
    chat_ext_worker.postMessage({ messages: task, in_flag: false, time: BigInt(Date.now()) });
    task = null
  }
};

let task = null

export function run_text(commandIndex) {
  switch (commandIndex) {
    case "海棠":
      {
        is_stop = false
        stop_last(chat_ext_worker)
        mode = 1;

      }
      break;
    case "海棠停止":
      {
        is_stop = false
        stop_last(chat_ext_worker)
        mode = 2;

      }
      break
    case "识别选中":
      {
        mode = 4;


        get_current_text()
      }

      break;

  }
}

//识别当前选中的文本
function get_current_text(system_content, user_content) {
  stop_last(chat_ext_worker)
  ssf.Input.key(ssf.enums.KeyCode.Control, ssf.enums.Direction.Press)
  ssf.Input.key(ssf.enums.KeyCode.C, ssf.enums.Direction.Press)
  ssf.Input.key(ssf.enums.KeyCode.Control, ssf.enums.Direction.Release)
  ssf.Input.key(ssf.enums.KeyCode.C, ssf.enums.Direction.Release)
  ssf.Sys.sleep(1000)
  const v = ssf.Sys.get_clipboard()
  console.log("选中的内容", v)
  if (!system_content) {
    system_content = "you are a helpful AI assistant"
  }
  if (!user_content) {
    user_content = "什么意思"
  }
  const msgs = [{ role: 'system', content: system_content }, { role: 'user', content: v + user_content }];
  console.log(msgs)
  // const msgs = [{ role: 'system', content: "你每次都用英文回答"},{ role: 'user', content: v + "什么意思" }];

  task = msgs

  let chat_ui = null
  try {
    chat_ui = ssf.ElementExt.find_task_bar("ssfrpa大语言", 1000)
    chat_ui.try_focus()

  } catch (_) {
    //
  }
}

function set_task(system_content, user_content) {
  stop_last(chat_ext_worker)

  if (!system_content) {
    system_content = "you are a helpful AI assistant"
  }
  if (!user_content) {
    user_content = "什么意思"
  }
  const msgs = [{ role: 'system', content: system_content }, { role: 'user', content: user_content }];
  // console.log(msgs)

  task = msgs

  let chat_ui = null
  try {
    chat_ui = ssf.ElementExt.find_task_bar("ssfrpa大语言", 1000)
    chat_ui.try_focus()

  } catch (_) {
    //
  }

}



//监听键盘 绑定crtl+f1 ctrl+f2 ctrl+f3

const listener = new GlobalKeyboardListener();

listener.addListener(function (e, down) {
  if (e.state == "DOWN" && e.name == "F1" && (down["LEFT CTRL"] || down["RIGHT CTRL"])) {
    get_current_text(null, null)
    return true;
  }
  if (e.state == "DOWN" && e.name == "F2" && (down["LEFT CTRL"] || down["RIGHT CTRL"])) {

    get_current_text("必须翻译成英文", "翻译成英文")

    return true;
  }
  if (e.state == "DOWN" && e.name == "F3" && (down["LEFT CTRL"] || down["RIGHT CTRL"])) {
    console.log("识别网页")
    const tid = ssf.Browser.current_tab(3000).id;

    const content = ssf.Browser.getHTML(tid, "//*", 3000);
    // console.log(content.length)
    const gne = new GeneralNewsExtractor()
    const info = gne.extract(content, {})
    const result_text = info.content
    // console.log(result_text)
    set_task("简短总结下", result_text)

    return true;
  }
  if (e.state == "DOWN" && e.name == "F8" && (down["LEFT CTRL"] || down["RIGHT CTRL"])) {
    stop_last(chat_ext_worker)
    return true;
  }


});



let mode = 0;
asr_ext_worker.onmessage = async (e) => {
  // console.log("??????????",e.data)

  const model = parse_text(e.data);


  if (model.index != -1) {
    console.log("匹配到命令----->", MODE_LIST[model.index], "概率:", model.score);
    run_text(MODE_LIST[model.index]);
    return
  }
  if (mode == 1 && is_stop) {

    const msgs = [{ role: 'system', content: "you are a helpful AI assistant" }, { role: 'user', content: e.data }];
    chat_ext_worker.postMessage({ messages: msgs, in_flag: false, time: BigInt(Date.now()) });
    is_stop = false

  }





};