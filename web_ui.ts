
import { WebUI } from "https://deno.land/x/webui@2.4.4/mod.ts";
import { existsSync } from "https://deno.land/std@0.221.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.221.0/path/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.207.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.207.0/encoding/hex.ts";


// 创建一个窗口
const myWindow = new WebUI();
myWindow.setSize(800, 700);
myWindow.setFileHandler((myUrl: URL)
await WebUI.wait();