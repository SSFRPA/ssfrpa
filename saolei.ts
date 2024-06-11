
// import { baseOp, getCLKPoints } from "./saolei_lib.ts";

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




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



// 获取指定坐标点周围有雷数标志的格子的数量
function getOpenNum(x, y) {
    let num = 0;
    const { x1, y1, x2, y2 } = getBound(x, y);
    for (let py = y1; py <= y2; py++) {
        for (let px = x1; px <= x2; px++) {
            if (px === x && py === y) continue;
            if (board[py][px] >= 1 && board[py][px] <= 8) {
                num++;
            }
        }
    }
    return num;
}

// 搜索与数字位置相邻的未打开块，使用flags标记已经访问过的位置
function srhAdjBlock(x, y) {
    const stack = [[x, y]];
    const block = [];
    for (let i = 0; i < h; i++) {
        block_flag[i] = new Array(w).fill(false);
    }
    block_flag[y][x] = true;
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        block.push([x, y]);
        let iter = getUnknownPointList(x, y);
        let iteratorResult = iter.next();
        while (!iteratorResult.done) {
            const [px, py] = iteratorResult.value;
            if (!block_flag[py][px]) {
                block_flag[py][px] = true;
                stack.push([px, py]);
            }
            iteratorResult = iter.next();
        }
    }
    return block;
}


function getOpenNumList(x, y) {
    // 获取指定坐标周围4*4-9*9的边界范围
    const { x1, y1, x2, y2 } = getBound(x, y);
    const result = [];
    for (let py = y1; py <= y2; py++) {
        for (let px = x1; px <= x2; px++) {
            if (px === x && py === y) continue;
            if (board[py][px] >= 1 && board[py][px] <= 8) {
                result.push([px, py]);
            }
        }
    }
    return result;
}


function updateBlock(x, y, result) {
    // 根据随机算法的基础规则更新board周边块
    const openNumList = getOpenNumList(x, y);
    result.splice(0, result.length); // 清空result数组
    for (const [px, py] of openNumList) {
        const [unknownNum, redNum] = getItemNum(px, py);
        // 实际雷数 小于 标记雷数目
        if (board[py][px] < redNum) {
            return false;
        }
        // 实际雷数 大于 未点开的格子数量+标记雷数目
        if (board[py][px] > unknownNum + redNum) {
            return false;
        }
        if (unknownNum === 0) {
            continue;
        }
        const unknownPoints = getUnknownPointList(px, py);
        // 如果当前点周围雷数=未点+插旗，说明所有未点位置都是雷，可以全部插旗
        if (board[py][px] === unknownNum + redNum) {
            for (const [px2, py2] of unknownPoints) {
                result.push([px2, py2]);
                board[py2][px2] = -2;
            }
        }
        // 如果当前点周围雷数=插旗，说明所有未点位置都没有雷，可以全部点开
        if (board[py][px] === redNum) {
            for (const [px2, py2] of unknownPoints) {
                result.push([px2, py2]);
                board[py2][px2] = 9; // 9表示临时无雷标记
            }
        }
    }
    return true;
}


function updateNm2schemeCnt(block, mineFlag, nm2schemeCnt) {
    // 根据搜索得到的方案更新 nm2schemeCnt
    const nm = mineFlag.reduce((sum, val) => sum + val, 0);
    if (!(nm in nm2schemeCnt)) { // 新增一种方案
        nm2schemeCnt[nm] = [1, [...mineFlag]]; // 使用数组的展开运算符来复制mineFlag数组
    } else { // 更新
        const v = nm2schemeCnt[nm];
        v[0] += 1;
        // 这里假设 nm2schemeCnt[nm][1] 是一个数组，我们通过map函数来更新每个元素
        v[1] = v[1].map((val, index) => val + mineFlag[index]);
    }
}



// function srhScheme(block, mineFlag, k, nm2schemeCnt) {
//     // 连通块中的格子列表
//     const [x, y] = block[k];
//     const res = [];
//     if (board[y][x] === -1) { // 两种可能：有雷、无雷
//         // 9作为临时无雷标记，-2作为临时有雷标记
//         const possibilities = [[0, 9], [1, -2]];
//         for (const [m, n] of possibilities) {
//             // m和n 对应了无雷和有雷两种情况下的标记
//             mineFlag[k] = m;
//             board[y][x] = n;
//             // 根据基础规则更新周围点的标记，返回更新格子列表和成功标记
//             if (updateBlock(x, y, res)) {
//                 if (k === block.length - 1) { // 得到一个方案
//                     updateNm2schemeCnt(block, mineFlag, nm2schemeCnt);
//                 } else {
//                     srhScheme(block, mineFlag, k + 1, nm2schemeCnt);
//                 }
//             }
//             // 恢复
//             for (const [px, py] of res) {
//                 board[py][px] = -1;
//             }
//         }
//         // 恢复
//         board[y][x] = -1;
//     } else {
//         if (board[y][x] === -2) {
//             mineFlag[k] = 1; // 有雷
//         } else {
//             mineFlag[k] = 0; // 无雷
//         }
//         // 根据规则1判断并更新周边块board标记，返回更新格子列表和成功标记
//         if (updateBlock(x, y, res)) {
//             if (k === block.length - 1) { // 得到一个方案
//                 updateNm2schemeCnt(block, mineFlag, nm2schemeCnt);
//             } else {
//                 srhScheme(block, mineFlag, k + 1, nm2schemeCnt);
//             }
//         }
//         // 恢复
//         for (const [px, py] of res) {
//             board[py][px] = -1;
//         }
//     }
// }



function srhScheme(block, mineFlag, k, nm2schemeCnt, maxDepth = 20, currentDepth = 0) {
    // 检查当前递归深度是否超过最大递归深度
    if (currentDepth > maxDepth) {
        throw new Error("Exceeded maximum recursion depth");
    }

    const [x, y] = block[k];
    const res = [];
    // console.log(`Entering srhScheme with k=${k}, depth=${currentDepth}, block=(${x}, ${y}), board state:`, JSON.stringify(board));

    if (board[y][x] === -1) { // 两种可能：有雷、无雷
        const possibilities = [[0, 9], [1, -2]];
        for (const [m, n] of possibilities) {
            mineFlag[k] = m;
            board[y][x] = n;
            // console.log(`Trying possibility: board[${y}][${x}] = ${n}, mineFlag[${k}] = ${m}`);

            if (updateBlock(x, y, res)) {
                if (k === block.length - 1) { // 得到一个方案
                    updateNm2schemeCnt(block, mineFlag, nm2schemeCnt);
                } else {
                    srhScheme(block, mineFlag, k + 1, nm2schemeCnt, maxDepth, currentDepth + 1);
                }
            }

            // 恢复
            for (const [px, py] of res) {
                board[py][px] = -1;
            }
        }
        // 恢复
        board[y][x] = -1;
    } else {
        if (board[y][x] === -2) {
            mineFlag[k] = 1; // 有雷
        } else {
            mineFlag[k] = 0; // 无雷
        }

        if (updateBlock(x, y, res)) {
            if (k === block.length - 1) { // 得到一个方案
                updateNm2schemeCnt(block, mineFlag, nm2schemeCnt);
            } else {
                srhScheme(block, mineFlag, k + 1, nm2schemeCnt, maxDepth, currentDepth + 1);
            }
        }

        // 恢复
        for (const [px, py] of res) {
            board[py][px] = -1;
        }
    }

    // console.log(`Exiting srhScheme with k=${k}, depth=${currentDepth}, block=(${x}, ${y}), board state:`, JSON.stringify(board));
}


function calDP(lk, nm, nm2schemeCntList) {
    // 考虑剩余雷数的可能方案数计算
    let ndp = 0;
    const k = lk[0];
    const nm2schemeCnt = nm2schemeCntList[k];

    // 如果只剩下一个雷区，检查是否存在雷数为nm的方案
    if (lk.length === 1) {
        if (nm2schemeCnt.hasOwnProperty(nm)) {
            const [cnt, cntList] = nm2schemeCnt[nm];
            ndp = cnt;
        }
    } else {
        // 如果还有多个雷区，递归计算剩余雷区的方案数
        for (let k1 in nm2schemeCnt) {
            const lk1 = lk.slice(1); // 获取除第一个雷区之外的其余雷区列表
            const n1 = calDP(lk1, nm - k1, nm2schemeCntList); // 递归调用calDP
            const [cnt, cntList] = nm2schemeCnt[k1];
            ndp += n1 * cnt;
        }
    }
    return ndp;
}

function getCLKPoints(board) {
    const h = board.length;
    const w = board[0].length;
    // console.log("-------------------", w, h)
    const block_flag = Array(h).fill(0).map(() => Array(w).fill(0));
    const block_list = [];
    const single_list = [];

    // 寻找所有值为-1的坐标位置
    const indices = [];
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            // console.log(i, j)
            if (board[i][j] === -1) {
                indices.push([j, i]);
            }
        }
    }

    for (const [px, py] of indices) {
        if (block_flag[py][px]) {
            continue;
        }
        if (getOpenNum(px, py) > 0) {
            const block = srhAdjBlock(px, py);
            block_list.push(block);
        } else {
            single_list.push([px, py]);
        }
    }

    const nm2schemeCnt_list = [];
    let nmin = 0;
    let nmax = 0;
    for (const block of block_list) {
        const nm2schemeCnt = {};
        const mine_flag = new Array(block.length).fill(0);
        srhScheme(block, mine_flag, 0, nm2schemeCnt);
        nm2schemeCnt_list.push(nm2schemeCnt);
        nmin += Math.min(...Object.values(nm2schemeCnt).map(v => v[0]));
        nmax += Math.max(...Object.values(nm2schemeCnt).map(v => v[0]));
    }

    if (single_list.length > 0) {
        block_list.push(single_list);
        const rnm2schemeCnt = {};
        const n2 = single_list.length;
        for (let i = nmin; i <= nmax; i++) {
            const n1 = mine_num - i;
            const mine_flag = Array(n2).fill(n1);
            rnm2schemeCnt[n1] = [n2, mine_flag];
        }
        nm2schemeCnt_list.push(rnm2schemeCnt);
    }

    const pboard = Array(h).fill(0).map(() => Array(w).fill(0));
    const nb = indices.length;
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            pboard[i][j] = mine_num * 100 / nb;
        }
    }
    // console.log(JSON.stringify(pboard))

    for (let k = 0; k < nm2schemeCnt_list.length; k++) {
        const lk = Array.from({ length: nm2schemeCnt_list.length }, (_, i) => i).filter(t => t !== k);
        const block = block_list[k];
        const Ncnt = new Array(block.length).fill(0);
        let NBcnt = 0
        for (const nm in nm2schemeCnt_list[k]) {
            const cnt_list = nm2schemeCnt_list[k][nm];
            const cnt = cnt_list[0];
            let ndp = 1;
            if (lk.length > 0) {
                ndp = calDP(lk, mine_num - nm, nm2schemeCnt_list);
            }
            const NBcnt = cnt * ndp;
            for (let i = 0; i < Ncnt.length; i++) {
                Ncnt[i] += cnt_list[1][i] * ndp;
            }
        }
        for (let i = 0; i < Ncnt.length; i++) {
            const [x, y] = block[i];
            pboard[y][x] = Ncnt[i] * 100 / NBcnt;
        }
    }

    const res = new Set();
    for (const [x, y] of indices) {
        if (pboard[y][x] === 100) {
            console.log("当前判断点<2>??????????", `${x},${y}`)

            res.add([x, y, false]);
        } else if (pboard[y][x] === 0) {
            res.add([x, y, true]);
        }
    }

    if (res.size === 0) {
        const points = [];
        for (const [x, y] of indices) {
            if (pboard[y][x] === Math.min(...pboard[y])) {
                points.push([x, y]);
            }
        }
        if (points.length > 10) {
            const randomIndex = Math.floor(Math.random() * points.length);
            const [x, y] = points[randomIndex];
            res.add([x, y, true]);
        } else if (points.length > 0) {
            const minPoint = points.reduce((a, b) => getFiveMapNum(a) < getFiveMapNum(b) ? a : b);
            res.add([minPoint[0], minPoint[1], true]);
        }
    }

    return Array.from(res);
}

function getFiveMapNum(p) {
    const [x, y] = p;
    let x1 = Math.max(x - 2, 0);
    let x2 = Math.min(x + 2, w - 1);
    let y1 = Math.max(y - 2, 0);
    let y2 = Math.min(y + 2, h - 1);

    let count = 0;
    for (let i = y1; i <= y2; i++) {
        for (let j = x1; j <= x2; j++) {
            if (board[i][j] === -1) {
                count++;
            }
        }
    }
    return count;
}



function baseOp() {
    // 筛选出所有未确定的数字位置坐标
    const flagged = flag.map(row => row.slice()); // 创建flag的副本，用于标记
    const result = new Map(); // 使用Map来存储结果

    // 筛选出board中所有值为1到8的元素的坐标，这些元素代表未点开的雷
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] >= 1 && board[y][x] <= 8 && !flag[y][x]) {
                // 确保使用数组来存储坐标
                const coord = [x, y];
                const boom_number = board[y][x];
                // 统计当前点周围4*4-9*9范围各类点的数量
                const [unknownNum, redNum] = getItemNum(...coord);
                if (unknownNum === 0) {
                    // 周围没有未点过的点可以直接忽略
                    flagged[y][x] = true;
                    continue;
                }
                // 获取周围的点的位置
                const points = getUnknownPointList(...coord);
                if (boom_number === unknownNum + redNum) {
                    // 如果当前点周围雷数=未点+插旗，说明所有未点位置都是雷，可以全部插旗
                    flagged[y][x] = true;
                    points.forEach(([px, py]) => {
                        // console.log("当前判断点<1>",`${x},${y}`,"内部插旗判断",  `${px},${py}`,"boom_number",boom_number,"unknownNum",unknownNum,"redNum",redNum)

                        result.set(`${px},${py}`, false); // 标记为可能有雷
                    });
                } else if (boom_number === redNum) {
                    // 如果当前点周围雷数=插旗，说明所有未点位置都没有雷，可以全部点开
                    flagged[y][x] = true;
                    points.forEach(([px, py]) => {
                        result.set(`${px},${py}`, true); // 标记为无雷
                    });
                }
            }
        }
    }

    // 更新flag状态
    for (let i = 0; i < flag.length; i++) {
        for (let j = 0; j < flag[i].length; j++) {
            flag[i][j] = flagged[i][j];
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


// 查找任务栏
function find_task_bar(name: string, timeout_ms: number): ssf.WinElement {
    const startTime = Date.now();
    // console.log(name)

    while (true) {

        const root_ele = ssf.ElementExt.get_root_element();
        // console.log(root_ele)
        const foundChild = root_ele.childs().find(child => child.name().indexOf(name) >= 0);
        if (foundChild) {
            return foundChild;
        }

        const elapsedTime = Date.now() - startTime;

        if (elapsedTime >= timeout_ms) {
            throw new Error('查找元素超时');
        }

        ssf.Sys.sleep(200); // 等待200毫秒
    }
}



ssf.Sys.listen_exit()
const chrome_path = ssf.Windows.get_reg_value("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe", "")
// console.log( JSON.stringify(ssf.Windows.get_reg_value_list("\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe")))

if (ssf.Windows.find_process("chrome.exe") == 0) {
    ssf.Windows.run(chrome_path, [])
}

ssf.Sys.sleep(2000)
const chrome_app = find_task_bar("Chrome", 3000)

ssf.Windows.switch_to_this_window(chrome_app.native_window_handle())


ssf.Sys.sleep(1000)


ssf.Browser.listen()
const tid = ssf.Browser.create_tab("https://www.saolei123.com/", 10000).id


ssf.Browser.click(tid, '//*[@id="uid"]', 3000)
ssf.Browser.setText(tid, '//*[@id="name"]', "测试一下", 3000)

// ssf.Browser.click(tid, '//*[@id="face"]', 3000)
// ssf.Sys.sleep(1000)
const chrome_ele = ssf.ElementExt.parse(chrome_app.native_window_handle(), '/Document', 5000)
// chrome_ele.try_focus()
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
// img.save("d:\\1.png")

// const img2 = img.clone()
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
const base_dir = "./saolei_images/"
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
const base_state_dir = "./saolei_state_images/"
let face_index = 0
for await (const dirEntry of Deno.readDir(base_state_dir)) {
    const img = ssf.Image.load(base_state_dir + dirEntry.name)
    img.resize(36, 36)


    // state_map.set(parseInt(dirEntry.name.split('.')[0], 10), img)
    state_map.set(face_index, parseInt(dirEntry.name.split('.')[0], 10))

    target_faceimgs.push(img)
    face_index = face_index + 1

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
    // face_img.save("d:\\2.png")


    const compare_face = ssf.Image.batch_compare([face_img], target_faceimgs)
    const face_value = state_map.get(compare_face[0])

    // console.log("face_value", face_value)
    switch (face_value) {

        case 15: return 1;
        case 16: {
            //触雷 重新开始
            // face_img.save("d:\\1.png")
            // console.table(JSON.stringify(board))

            ssf.Sys.sleep(5000)
            ssf.Input.move(face_pos.x + chrome_pos.x + face_pos.w / 2, face_pos.y + chrome_pos.y + face_pos.h / 2, ssf.enums.Coordinate.Abs)
            ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
            // ssf.Sys.sleep(6000)
            return 2

        };
        case 17: {
            // face_img.save("d:\\2.png")

            return 3
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
    cell_imgs.forEach(element => {
        element.close()
    });
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

    return data;



}


// img = null;

// const start = performance.now();




let board = null

let flag = null
let block_flag = null
let mine_num = 99
let w = 30
let h = 16
let res = new Set();

//初始化
img = ssf.Frame.to_image(20, 1000)
board = find(img)
flag = board.map(row => row.map(() => false));
block_flag = board.map(row => row.map(() => false));

while (true) {
    // try {
    ssf.Sys.sleep(250)
    img = ssf.Frame.to_image(20, 1000)
    // ssf.Sys.sleep(3000)

    // } catch (error) {
    //     // console.log(error)
    //     continue

    // }
    // img.save("d:\\1.png")

    let state = check_face(img)
    if (state == 1) {

        console.log("成功");
        break;

    }
    if (state == 2) {

        console.log("触雷,所有重新");
        res = new Set();
        flag = board.map(row => row.map(() => false));
        block_flag = board.map(row => row.map(() => false));
        // board = null
        mine_num = 99
        // try {
        // img = ssf.Frame.to_image(20, 1000)


        // break
        // } catch (error) {
        //     // console.log(error)
        continue

        // }

    }


    // switch (state) {
    //     case 1: {
    //         console.log("成功");
    //     } break;
    //     case 2: {
    //         console.log("触雷,重新来")
    //     } break;
    //     case 3: { //console.log("正常状态") 

    //     } break;


    // }

    board = find(img)

    // board =   [[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, 2, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 0, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 0, 0, 0, 1, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 0, 0, 0, 0, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4, 2, 1, 0, 0, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 1, 0, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2, 1, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]]
    //-----------------------------------------------------------




    // console.log(JSON.stringify(block_flag));



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
    // console.log("res.size nb", res.size, nb, mine_num)
    if (res.size === 0 && nb !== 0) {
        // 尝试获取节点列表
        let tmp = JSON.parse(JSON.stringify(board)); // 深拷贝board
        try {
            // console.log("++++++++++++++++++++")
            res = getCLKPoints(board);
        } catch (error) {
            console.log("error 可能达到最大循环次数")
            // 如果发生异常，恢复原始棋盘状态
            board = JSON.parse(JSON.stringify(tmp)); ``
            // 从未点开的格子中随机选择一个格子
            let indices = [];
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
        }
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
    //------------------------------------------------------
    // console.log("res:?????????????", JSON.stringify(res), res);

    res.forEach(element => {
        // console.log(element, element[1], element[0])
        const p = find_next_pos(element[1], element[0], new_rect.x, new_rect.y)
        ssf.Input.move(p.x, p.y, ssf.enums.Coordinate.Abs)
        // ssf.Sys.sleep(50)

        if (element[2]) {
            ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
        } else {
            mine_num = mine_num - 1
            ssf.Input.button(ssf.enums.Button.Right, ssf.enums.Direction.Click)
            // console.log("插旗",element[1], element[0])
        }
        // ssf.Sys.sleep(50)


    });
    ssf.Sys.sleep(20)
    img.close()





}

