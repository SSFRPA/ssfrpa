
ssf.ai.ASR.listen_input("./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20",2.4,1.2,10.)
ssf.ai.Translate.init_model("./models/translate/tokenizer-marian-base-zh2en.json","./models/translate/tokenizer-marian-base-zh2en_des.json","./models/translate/zh-en-model.safetensors")
console.log("开始监听麦克风")
while(true) 
{   
    let text=ssf.ai.ASR.get_result()
    console.log(text)
    console.log(ssf.ai.Translate.parse(text))


}

