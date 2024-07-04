import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";



//-----------------------判断是否需要下载模型
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



//识别翻译主要代码
ssf.ai.ASR.listen_input("./models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20",2.4,1.2,10.)
ssf.ai.Translate.init_model("./models/translate/tokenizer-marian-base-zh2en.json","./models/translate/tokenizer-marian-base-zh2en_des.json","./models/translate/zh-en-model.safetensors")
console.log("开始监听麦克风")
while(true) 
{   
    let text=ssf.ai.ASR.get_result()
    console.log(text)
    console.log(ssf.ai.Translate.parse(text))


}

