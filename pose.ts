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
    "自动分析",
    "自动瞄准",
    "结束",
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
        case "自动分析": { mode = 0 }; break;
        case "自动瞄准": { mode = 1 } break;
        case "结束": { mode = -1 } break;
    }
}


//-------------------------------------------
//判断是否启用自动射击
// let mode = -1
let lastTime = performance.now();
let frameCount = 0;

function update() {
    const currentTime = performance.now();
    frameCount++;

    // 计算帧率
    const deltaTime = currentTime - lastTime;
    if (deltaTime >= 1000) {
        const fps = frameCount / (deltaTime / 1000);
        console.log(`帧率: ${fps.toFixed(2)} FPS`);

        // 重置计数器和时间戳
        frameCount = 0;
        lastTime = currentTime;
    }


}



//识别翻译主要代码
ssf.ai.ASR.listen_input("./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20", 2.4, 1.2, 10.)
ssf.ai.Pose.init_model(false, null, "N")

let intervalId = setInterval(function () {
    update()

    if (mode >= 0) {
        const img = ssf.Frame.to_image(1, 1000)
        // console.log(".................")
        if (mode == 0) {
            const r = ssf.ai.Pose.parse(img, 0.25, 0.45, 0.6, true)
            if (r.length > 0 && r[0].data.length > 0) {

                img.save('./result.png')
                mode = -1
            }
        }
        if (mode == 1) {

            const r = ssf.ai.Pose.parse(img, 0.25, 0.45, 0.6, false)
            if (r.length > 0 && r[0].data.length > 0) {
                const first = r[0].data[0];
                ssf.Input.move(first.x, first.y, ssf.enums.Coordinate.Abs)
                // ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
            }


        }
        img.close()

    }


}, 1);


// const r = ssf.ai.Pose.parse(img, 0.25, 0.45,0.6, true)
console.log("开始监听麦克风")
ssf.ai.Device.init_audio()
let intervalId2 = setInterval(function () {
    const text = ssf.ai.ASR.get_result_with_timeout(20)
    if (text != "") {
        console.log(text)
        // console.log(ssf.ai.Translate.parse(text))
        const commands = parse_text(text);

        if (commands["index"] != -1) {
            console.log("匹配到命令----->", mode_list[commands["index"]], "概率:", commands["score"])
            const voice_id = ssf.ai.Device.load_audio("C:\\Windows\\Media\\Alarm10.wav")
            console.log(voice_id)
            ssf.ai.Device.audio_play(voice_id)
            run_text(mode_list[commands["index"]])
            console.log(mode)
            // continue
        }

    }

}, 1)





