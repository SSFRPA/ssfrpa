const img =  ssf.Frame.to_image(20); 
ssf.ai.OCR.init_model("./models/ppocrv4server/")
let r=ssf.ai.OCR.parse(img)
r.forEach(element => {
    console.log(element.x,element.y,element.text)
});
