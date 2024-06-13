### 新一代rpa引擎

## 下载
[下载主程序]([https://github.com/SSFRPA/ssfrpa/releases/download/v1.38.2/ssfrpa.zip](https://github.com/SSFRPA/ssfrpa/releases/download/v1.43.3/ssfrpa_v1.43.3.zip)

[官方网址](https://www.qweaa.com)
# 新一代rpa引擎

#### 介绍
  使用全静态编译打造智能rpa引擎,支持一键打包exe,打包压缩后可以做到40mb内

#### 主要特点
  1.更简单的api,能快速编写上手,实现诸如语音识别只需要3行代码<br>
  2.支持多种ai模型，100%离线免费使用<br>
  3.支持html形式的界面编写,打造属于自己的专属应用<br>
  4.支持一键打包,打包后的exe无任何依赖，且只需要40mb,不需要安装其他任何环境安装包<br>
  5.提供界面控件捕获,你可以很简单的捕获windows上的所有按钮、文本等等,而且可以一键生成对应代码，无需繁琐的使用诸如insepect等查看工具<br>
  6.完整的js和ts支持,开箱即用<br>
  7.后续将提供大语言模型的离线支持<br>

#### 快速配置
  运行快速入门.bat 即可将vscode配置完成,完成配置后会自动打开当前目录,这时候你可以随便新建一个.ts的文件开始编写代码。<br>

#### 界面捕获
  运行界面捕获.bat 可以捕获所有非动态渲染控件(一般游戏都属于动态渲染)<br>

#### demo
  使用快速入门打开目录后,打开asr_and_tts.ts后按ctrl+f5 可以进行qq当前消息语音播报<br>

#### 打包exe
  点击打包可执行文件.bat 可以自由打包任何ssfrpa框架编写的脚本,打包压缩后仅需要40mb即可运行,不需要额外安装任何环境(如果用到模型文件,需要再下载模型文件,模型全部离线免费使用)<br>

#### 项目例子介绍
  automated_deployment.ts: 完整的自动化安装vscode并语音播报的例子长流程演示 <br>
  quick_auto_deplpy.ts: 静默安装环境 <br>
  ui_parse.ts: 界面捕获，可以捕获windows上任意控件，也支持chrome浏览器等等<br>
  asr_and_tts.ts: 一个用语音播放qq最新消息的例子 <br>
  audiobook.ts: 语音电子书,可以选择100多个人的声音播放指定网页，网页使用正文提取过滤,你可以用来播放小说、新闻等等<br>
  saolei.ts: 自动打开网页并开始自动扫雷 需要手动安装chrome crx插件<br>
  hello_world.ts 入门例子,打开记事本输入<br>
####  这里是列表文本问题反馈
  可以加qq群702720745 反馈问题<br>
