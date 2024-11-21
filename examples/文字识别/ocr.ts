// ssf.Frame.init()
// console.log(ssf.Frame.screen_info())
// const img =  ssf.Frame.to_image(200,1000); 

const img = ssf.Image.load("C:\\Users\\ybbtuubj\\Desktop\\临时\\QQ20241023-110752.png")


ssf.ai.OCR.init_model("./models/ppocrv4server/")
console.log(img)
console.time('ocr_time');

for (let i = 0; i < 1; i++) {

let r=ssf.ai.OCR.parse(img)
r.forEach(element => {
    console.log(element.x,element.y,element.text)
});

}
console.timeEnd('ocr_time');

// ssf.Sys.sleep(30000)
console.log("结束........")