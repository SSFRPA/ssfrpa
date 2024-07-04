import { WebUI } from "https://deno.land/x/webui@2.4.4/mod.ts";
import {
  encodeBase64,
  decodeBase64,
} from "https://deno.land/std@0.223.0/encoding/base64.ts";


const myHtml = `<!DOCTYPE html>
<!DOCTYPE html>
<html lang="zh">
<head>
<script src="webui.js"></script>
    <meta charset="UTF-8">
    <title>捕获数据展示</title>
  

    <style>
    .capture-card {
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 20px;
        background-color: #f9f9f9;
        margin-bottom: 20px;
    }
    .capture-title {
        color: #333;
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 10px;
    }
    .capture-content {
        color: #555;
        font-size: 14px;
    }
    .button {
        margin-left: 5px;
        padding: 5px 10px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    .button.copy {
        background-color: #28a745; /* 绿色按钮 */
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #28a745;
      color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: opacity 0.5s;
  }
  .toast.show {
      opacity: 1;
  }
</style>
</head>
<body>
<h1>请在需要捕获的元素上按ctrl</h1><br>

<div class="container mt-5">
    <div class="row" id="row_content">
       
    </div>
</div>
<div id="toast" class="toast">已成功复制到剪贴板</div>
<script>
function set_result(base64_str) {

  const decoded_binary = atob(base64_str);
  const utf8_str = new TextDecoder().decode(
    Uint8Array.from(decoded_binary, (char) => char.charCodeAt(0))
  );

    document.getElementById("row_content").innerHTML = utf8_str;
}

function validateXPath(hwnd,xPath) {
  //alert('1234')
  validate(hwnd,xPath)
  console.log(validate)
  //console.log("验证 XPath:", xPath);
  // 可以添加验证 XPath 的逻辑
}

function copyXPath(hwnd,xPath) {
  const tempInput = document.createElement("input");
  tempInput.type = "text";
  tempInput.value = "ssf.ElementExt.parse("+hwnd+",'"+xPath+"',5000)";
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);

  // 显示复制成功提示
  const toast = document.getElementById("toast");
  toast.classList.add("show");

  // 几秒钟后隐藏
  setTimeout(() => {
      toast.classList.remove("show");
  }, 3000); // 3 秒后隐藏
}
</script>
</body>
</html>
`



async function validate(e: WebUI.Event) {
  // console.log(123456)
  const hwnd = e.arg.number(0);
  const xapth = e.arg.string(1);
  try {
    // ssf.Windows.show_window(hwnd,ssf.enums.CmdShow.SW_SHOW)
    ssf.Windows.set_foreground_window(hwnd)
    ssf.Windows.switch_to_this_window(hwnd)
    ssf.ElementExt.parse(hwnd, "/", 2000).try_focus()
    ssf.Sys.sleep(200)
    ssf.ElementExt.parse(hwnd, xapth, 3000).click()
  } catch (error) {
    console.log(error)
  }


  return "";
}

// 创建一个窗口
const myWindow = new WebUI();
myWindow.setSize(800, 800);
// // 绑定事件
myWindow.bind("validate", validate);
myWindow.bind("exit", () => {
  console.log("退出")

  WebUI.exit();
});


await myWindow.show(myHtml);


ssf.ElementExt.listen();




function repeatTask() {
  // 执行任务
  // console.log("执行任务");



  // console.log(123)
  let infos: ssf.PathInfo[] = [];
  try {
    infos = ssf.ElementExt.get_path(10);

  } catch (_) {
    //
  }
  if (infos.length > 0) {
    // console.clear()
    let innerhtml = ""
    infos.forEach(element => {
      // console.log("捕获方式", element.catch_type)

      // console.log(element.title, element)
      // console.log(element.xpath)
      /**  
       *
                      <p><strong>automation_id:</strong> ${element.automation_id}</p>
                      */
      innerhtml += `
   <div class="col-md-4">
           <div class="capture-card">
               <div class="capture-title">捕获方式：${element.catch_type}</div>
               <div class="capture-content">
               <p><strong>主窗体标题:</strong>${element.main_title}</p>
               <p><strong>主窗体句柄:</strong>${element.main_hwnd}</p>
               <p><strong>主窗体类名:</strong>${element.main_class_name}</p> 
                   <p><strong>进程ID:</strong> ${element.pid}</p>
                   <p><strong>应用路径:</strong> ${element.app_path}</p>
                   
                   <p><strong>类名:</strong> ${element.class_name}</p>
                   <p><strong>标题:</strong> ${element.title}</p>
                   <p><strong>控件类型:</strong> ${element.control_type}</p>
                   <p><strong>XPath:</strong> ${element.xpath}
                   <button class="button" onclick="validateXPath('${element.main_hwnd}','${element.xpath}')">验证</button>
                   <button class="button copy" onclick="copyXPath('${element.main_hwnd}','${element.xpath}')">复制</button>
                   </p>
               </div>
           </div>
       </div>
   `

    });


    const base64_str = encodeBase64(innerhtml); // "Zm9vYmFy"

    myWindow.run(`set_result('${base64_str}');`);
    

  }


}

const intervalId = setInterval(repeatTask, 10)

await WebUI.wait();
clearInterval(intervalId);

console.log("结束")

