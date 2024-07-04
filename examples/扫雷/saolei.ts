import * as path from "https://deno.land/std@0.224.0/path/mod.ts";

function getModuleDir(importMeta) {
  return path.resolve(path.dirname(path.fromFileUrl(importMeta.url)));
}

const current_dir = getModuleDir(import.meta);


function getBound(x, y) {
    let x1 = Math.max(x - 1, 0);
    let x2 = Math.min(x + 1, w - 1);
    let y1 = Math.max(y - 1, 0);
    let y2 = Math.min(y + 1, h - 1);
    return { x1, y1, x2, y2 };
}


function getItemNum(x, y) {
    // 获取指定坐标周围4*4-9*9的边界范围
    const { x1, y1, x2, y2 } = getBound(x, y);

    // 初始化计数器对象
    let counters = {
        '-1': 0, // 未点开的格子计数
        '-2': 0  // 红旗所在格子计数
    };

    // 遍历指定范围内的棋盘，更新计数器
    for (let i = y1; i <= y2; i++) {
        for (let j = x1; j <= x2; j++) {
            // console.log("内部九宫格判断",i,j,board[i][j] )
            if (board[i][j] === -1) {
                counters['-1']++;
            } else if (board[i][j] === -2) {
                counters['-2']++;
            }
        }
    }

    // 返回统计结果
    return [counters['-1'], counters['-2']];
}



function* getUnknownPointList(x, y) {
    const { x1, y1, x2, y2 } = getBound(x, y);
    for (let py = y1; py <= y2; py++) {
        for (let px = x1; px <= x2; px++) {
            if (px === x && py === y) continue;
            if (board[py][px] === -1) {
                yield [px, py];
            }
        }
    }
}


function baseOp() {
    // 筛选出所有未确定的数字位置坐标
    // const flagged = flag.map(row => row.slice()); // 创建flag的副本，用于标记
    const result = new Map(); // 使用Map来存储结果

    // 筛选出board中所有值为1到8的元素的坐标，这些元素代表未点开的雷
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            // if (board[y][x] >= 1 && board[y][x] <= 8 && !flag[y][x]) {
            if (board[y][x] >= 1 && board[y][x] <= 8) {

                // 确保使用数组来存储坐标
                const coord = [x, y];
                const boom_number = board[y][x];
                // 统计当前点周围4*4-9*9范围各类点的数量
                const [unknownNum, redNum] = getItemNum(...coord);
                if (unknownNum === 0) {
                    // 周围没有未点过的点可以直接忽略
                    continue;
                }
                // 获取周围的点的位置
                const points = getUnknownPointList(...coord);
                if (boom_number === unknownNum + redNum) {
                    // 如果当前点周围雷数=未点+插旗，说明所有未点位置都是雷，可以全部插旗
                    points.forEach(([px, py]) => {

                        result.set(`${px},${py}`, false); // 标记为可能有雷
                    });
                } else if (boom_number === redNum) {
                    // 如果当前点周围雷数=插旗，说明所有未点位置都没有雷，可以全部点开
                    points.forEach(([px, py]) => {
                        result.set(`${px},${py}`, true); // 标记为无雷
                    });
                }
            }
        }
    }



    return result;
}



//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



function calculateGridSize(gridWidth: number, gridHeight: number, rows: number, cols: number) {
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;
    return { width: cellWidth, height: cellHeight };

}

function calculateGridPosition(cellWidth: number, cellHeight: number, rowIndex: number, colIndex: number) {
    const x = colIndex * cellWidth;
    const y = rowIndex * cellHeight;
    const startX = x;
    const startY = y;
    const endX = x + cellWidth;
    const endY = y + cellHeight;
    return { startX: startX, startY: startY, endX: endX, endY: endY };
}


function find_next_pos(input_row: number, input_col: number, startX: number, startY: number) {
    let index = 0
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const element = match_result[index]
            if (row == input_row && col == input_col) {
                // console.log(input_row, input_col, rows, cols, element.x, element.y)
                return { "x": element.x + startX + element.w / 2, "y": element.y + startY + element.h / 2 }
            }
            index = index + 1
        }
    }
}


function check_face(img: ssf.Image) {
    const face_pos = ssf.Browser.getPosition(tid, '//*[@id="face"]', 3000)

    const face_img = img.crop_imm(face_pos.x + chrome_pos.x, face_pos.y + chrome_pos.y, face_pos.w, face_pos.h)
    face_img.resize(36, 36)
    const compare_face = ssf.Image.batch_compare([face_img], target_faceimgs)
    const face_value = state_map.get(compare_face[0])
    switch (face_value) {

        case 15: return { state: 1, pos: face_pos };
        case 16: {
            return { state: 2, pos: face_pos };
        };
        case 17: {
            return { state: 3, pos: face_pos };
        };
    }
}

function find(img: ssf.Image) {
    const data = [];
    let index = 0;
    img.crop(new_rect.x, new_rect.y, new_rect.w, new_rect.h)
    // const start = performance.now();
    const cell_imgs = []
    for (let row = 0; row < rows; row++) {
        let rows_data = []
        for (let col = 0; col < cols; col++) {

            const element = match_result[index]
            const cell_img = img.crop_imm(element.x, element.y, element.w, element.h)
            // cell_img.gray()
            cell_img.resize(36, 36)
            cell_imgs.push(cell_img)

            index = index + 1

        }

    }

    const compare_datas = ssf.Image.batch_compare(cell_imgs, target_base_imgs)
    //确保批量使用的图片释放内存

    index = 0;
    for (let row = 0; row < rows; row++) {
        const rows_data = []

        for (let col = 0; col < cols; col++) {
            const cell_value = map.get(compare_datas[index])

            rows_data.push(cell_value)
            index = index + 1

        }
        data.push(rows_data)
    }
    cell_imgs.forEach(element => {
        element.close()
    });
    return data;



}


console.log("准备开始")

ssf.Sys.listen_exit()


const chrome_path = ssf.Windows.get_reg_value("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe", "")

//判断插件是否安装,后续直接可以google商店安装
try {
    const chrome_ext = ssf.Windows.get_reg_value("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallAllowlist", "99999")
    if (ssf.Windows.find_process("chrome.exe") == 0) {
        ssf.Windows.run(chrome_path, [])
    }
} catch (error) {
    console.log("未允许插件,将自动注册插件,后续可以从google商店安装", error)
    console.log(ssf.Windows.cmd("reg", ["add", "HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallAllowlist", "/v", "99999", "/t", "reg_sz", "/d", "eamibgnfgfhlmnbedbegigiaiedokgjh", "/f"]))

}

ssf.Sys.sleep(2000)
// const chrome_app = find_task_bar("Chrome", 3000)
const chrome_app = ssf.ElementExt.find_task_bar("Chrome", 3000)

ssf.Windows.switch_to_this_window(chrome_app.native_window_handle())


ssf.Sys.sleep(1000)


ssf.Browser.listen()
// ssf.Sys.sleep(10000000)
const tid = ssf.Browser.create_tab("https://www.saolei123.com/", 10000).id

const chrome_ele = ssf.ElementExt.parse(chrome_app.native_window_handle(), '/Document', 5000)
ssf.Sys.sleep(2000)
const chrome_pos = chrome_ele.bounding_rectangle()
const rect2 = ssf.Browser.getPosition(tid, '//*[@id="paf"]', 3000)
//扫雷面板的具体位置
const new_rect = {
    x: chrome_pos.x + rect2.x, y: chrome_pos.y + rect2.y, w: rect2.w, h: rect2.h
}
let img = ssf.Frame.to_image(20, 1000)


const rows = 16; // 网格行数
const cols = 30; // 网格列数

const cellSize = calculateGridSize(new_rect.w, new_rect.h, rows, cols);
img.crop(new_rect.x, new_rect.y, new_rect.w, new_rect.h)

const pos = calculateGridPosition(cellSize.width, cellSize.height, 10, 20)
const img2 = img.crop_imm(pos.startX + 1, pos.startY + 1, cellSize.width - 1, cellSize.height - 1)
// img.save("d:\\1.png")
const match_result = img.find(img2, 0.1, 1)
match_result.sort((a, b) => {
    if (a.y === b.y) {
        return a.x - b.x;
    }
    return a.y - b.y;
});



const map = new Map();
const state_map = new Map();

const target_base_imgs: ssf.Image[] = []
const target_faceimgs: ssf.Image[] = []

//存放基础雷的种类
const base_dir = current_dir+"./saolei_images/"
let base_index = 0
for await (const dirEntry of Deno.readDir(base_dir)) {
    const img = ssf.Image.load(base_dir + dirEntry.name)
    img.resize(36, 36)
    // img.gray()
    // map.set(parseInt(dirEntry.name.split('.')[0], 10), img)

    map.set(base_index, parseInt(dirEntry.name.split('.')[0], 10))

    target_base_imgs.push(img)
    base_index = base_index + 1

}

//存放状态 表示正常 触雷 胜利
const base_state_dir = current_dir+"./saolei_state_images/"
let face_index = 0
for await (const dirEntry of Deno.readDir(base_state_dir)) {
    const img = ssf.Image.load(base_state_dir + dirEntry.name)
    img.resize(36, 36)


    // state_map.set(parseInt(dirEntry.name.split('.')[0], 10), img)
    state_map.set(face_index, parseInt(dirEntry.name.split('.')[0], 10))

    target_faceimgs.push(img)
    face_index = face_index + 1

}



let board = null

let res = new Set();

img = ssf.Frame.to_image(20, 1000)
board = find(img)
const h = board.length;
const w = board[0].length;
console.log(w, h)
// console.log("------------
while (true) {
    // try {
    // ssf.Sys.sleep(250)
    img = ssf.Frame.to_image(20, 1000)


    const face_info = check_face(img)
    if (face_info.state == 1) {

        console.log("成功");
        break;

    }
    if (face_info.state == 2) {

        console.log("触雷,所有重新");
        // break
        ssf.Sys.sleep(1000)

        ssf.Input.move(face_info.pos.x + chrome_pos.x + face_info.pos.w / 2, face_info.pos.y + chrome_pos.y + face_info.pos.h / 2, ssf.enums.Coordinate.Abs)
        ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
        ssf.Sys.sleep(1000)

        res = new Set();
        img.close()
        img = ssf.Frame.to_image(20, 1000)

        // is_first = true
        // continue
    }

    board = find(img)
    // console.log(JSON.stringify(board))

    // 计算未点开的格子数量
    let nb = 0;
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            if (board[i][j] === -1) {
                nb++;
            }
        }
    }


    res = baseOp()

    if (res.size === 0 && nb !== 0) {
        const indices = [];
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                if (board[i][j] === -1) {
                    indices.push([j, i]);
                }
            }
        }
        res = []

        let randomIndex = Math.floor(Math.random() * indices.length);
        let [px, py] = indices[randomIndex];
        res.push([px, py, true]); // 添加到结果中
        // }
        // console.log(JSON.stringify(res))
    } else {
        // res= Array.from(res);
        let res2 = new Map(Array.from(res));
        res = []
        for (let [key, value] of res2) {
            const split_data = key.split(",")
            res.push([parseInt(split_data[0], 10), parseInt(split_data[1], 10), value]); // 添加到结果中

        }
    }

    for (const element of res) {
        // console.log("准备点击",element, element[1], element[0])
        const p = find_next_pos(element[1], element[0], new_rect.x, new_rect.y)
        ssf.Input.move(p.x, p.y, ssf.enums.Coordinate.Abs)
        ssf.Sys.sleep(10)

        if (element[2]) {
            ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
        } else {
            ssf.Input.button(ssf.enums.Button.Right, ssf.enums.Direction.Click)
        }

    }
    if (res.length > 1) {
        //避免捕获屏幕太快 导致看到点击的其他框
        ssf.Sys.sleep(300)
    } else {
        ssf.Sys.sleep(20)

    }
    img.close()

}
