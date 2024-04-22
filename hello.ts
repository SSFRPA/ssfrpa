//将演示如何2行代码完成语音生成;
ssf.ai.TTS.init_model("./models/vits-zh-aishell3");
ssf.ai.TTS.play_text("这是一个语音生成的演示", 65, 1.0);
ssf.ai.TTS.wait();