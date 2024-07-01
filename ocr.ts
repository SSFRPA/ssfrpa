const img =  ssf.Frame.to_image(20); 
// img.resize(1920,1080)
// ssf.ai.OCR.init_model("./models/ppocrv4server/")
ssf.ai.OCR.init_model("./models/ppocrv4server/")

// ssf.ai.OCR.init_model("./models/ppocrv4ori/")

let r=ssf.ai.OCR.parse(img)
r.forEach(element => {
    console.log(element.x,element.y,element.text)
});
