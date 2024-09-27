import OpenAI from "npm:openai";
import { delay } from "jsr:@std/async@1/delay";

const baseurl = "http://localhost:55889/v1/chat"
const client = new OpenAI({ baseURL: baseurl + "/completions", apiKey: "" });

//发送chat对话(流式)
async function chat(messages) {
  const stream = await client.chat.completions.create({
    model: 'Qwen2',
    // messages: [{ role: 'user', content: question }],
    messages: messages,

    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    await Deno.stdout.write(new TextEncoder().encode(content));

  }

}

//停止chat对话
async function stop() {

  const response = await fetch(baseurl + "/stop", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(""),
  });

  if (response.ok) {
    const jsonResponse = await response.json();
    console.log(jsonResponse);
    self.postMessage(true)
  } else {
    console.error('请求失败:', response.statusText);
    self.postMessage(true)
  }
}
let inner_time = 0

//接收main传递的消息
self.onmessage = async (e) => {
  const { messages, in_flag, time } = e.data;
  inner_time = time
  if (!in_flag) { await chat(messages) }
  else {
    ssf.Sys.sleep(200)
    await stop()

  }


};

