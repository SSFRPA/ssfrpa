@rem deno.exe   compile --unstable --allow-all --no-check  --private_key  ./private_key.data  pose.ts
 ..\..\deno.exe    compile --allow-all   --unstable  --no-check --include asr_ext.js  --include chat_ext.js  --include parse_text.js  --node-modules-dir    .\main.js
@rem..\..\deno.exe    compile --allow-all   --unstable  --no-check --include asr_ext.js  --include chat_ext.js  --include parse_text.js npm:node-global-key-listener


pause