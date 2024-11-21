

ssf.ai.ASR.listen_input("./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20", 2.4, 1.2, 10.0, 0);
console.log("开始监听麦克风");
let min_startTime = 0
let max_startTime = 0
const max_threshold =5;
const min_threshold = 0.8;

let seg_text = ""
while (true) {
    try {
        let text = ssf.ai.ASR.get_result_with_timeout(100);
        // console.log("...........",text)
        if (seg_text == "") {
            min_startTime = new Date();
            max_startTime = new Date();
            seg_text += text;
        } else {
            const endTime = new Date();
            const mininterval = (endTime - min_startTime) / 1000; // 计算时间间隔，单位为秒
            if (text == "") {
                if (mininterval >= min_threshold) {
                    if (seg_text != "") {
                        self.postMessage(seg_text)
                        seg_text = ""

                    }

                }
            }

            else {
                min_startTime = new Date();
                const maxinterval = (endTime - max_startTime) / 1000; // 计算时间间隔，单位为秒

                if (maxinterval >= max_threshold) {
                    // console.log("******", seg_text, maxinterval)
                    self.postMessage(seg_text)

                    seg_text = ""
                    continue
                }
                seg_text += text;

            }
        }
    } catch (error) {
        seg_text="";
        console.log(error)
    }

}