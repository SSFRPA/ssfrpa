
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

    while (true) {

        const root_ele = ssf.ElementExt.get_root_element();
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
// console.log(chrome_path)

if (ssf.Windows.find_process("chrome.exe") == 0) {
    ssf.Windows.run(chrome_path, [])
}

ssf.Sys.sleep(2000)
const chrome_app = find_task_bar("Chrome", 3000)
// console.log(chrome_app.native_window_handle())
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
// console.log(rect)
const rect2 = ssf.Browser.getPosition(tid, '//*[@id="paf"]', 3000)
//扫雷面板的具体位置
const new_rect = {
    x: chrome_pos.x + rect2.x, y: chrome_pos.y + rect2.y, w: rect2.w, h: rect2.h
}
// console.log(new_rect)
const img = ssf.Frame.to_image(20)


const rows = 16; // 网格行数
const cols = 30; // 网格列数

const cellSize = calculateGridSize(new_rect.w, new_rect.h, rows, cols);
// console.log(cellSize)
img.crop(new_rect.x, new_rect.y, new_rect.w, new_rect.h)
// img.save("d:\\1.png")

// const img2 = img.clone()
const pos = calculateGridPosition(cellSize.width, cellSize.height, 10, 20)
// console.log(pos)
const img2 = img.crop_imm(pos.startX + 1, pos.startY + 1, cellSize.width - 1, cellSize.height - 1)
// img.save("d:\\1.png")
const match_result = img.find(img2, 0.1, 1)
match_result.sort((a, b) => {
    if (a.y === b.y) {
        return a.x - b.x;
    }
    return a.y - b.y;
});


// console.log(JSON.stringify(match_result))

const map = new Map();
const state_map = new Map();

const target_base_imgs: ssf.Image[] = []
const target_faceimgs: ssf.Image[] = []

//存放基础雷的种类
const base_dir = "./saolei_images/"
let base_index = 0
for await (const dirEntry of Deno.readDir(base_dir)) {
    const img = ssf.Image.load(base_dir + dirEntry.name)
    img.resize(18, 18)
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
    img.resize(24, 24)


    // state_map.set(parseInt(dirEntry.name.split('.')[0], 10), img)
    state_map.set(face_index, parseInt(dirEntry.name.split('.')[0], 10))

    target_faceimgs.push(img)
    face_index = face_index + 1

}



// function nextMove(board) {
//     const rows = board.length;
//     const cols = board[0].length;
//     const flaggedMines = [];
//     const safeCells = [];

//     // 检查周围的雷数量
//     function countMines(x, y) {
//         let mines = 0;
//         for (let i = -1; i <= 1; i++) {
//             for (let j = -1; j <= 1; j++) {
//                 const newX = x + i;
//                 const newY = y + j;
//                 if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
//                     if (board[newX][newY] === 10 || board[newX][newY] === 11) {
//                         mines++;
//                     }
//                 }
//             }
//         }
//         return mines;
//     }

//     // 标记雷和找安全的格子
//     for (let i = 0; i < rows; i++) {
//         for (let j = 0; j < cols; j++) {
//             if (board[i][j] >= 1 && board[i][j] <= 9) {
//                 let mines = 0;
//                 let unclickedCells = [];
//                 for (let x = -1; x <= 1; x++) {
//                     for (let y = -1; y <= 1; y++) {
//                         const newX = i + x;
//                         const newY = j + y;
//                         if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
//                             if (board[newX][newY] === 10 || board[newX][newY] === 11) {
//                                 mines++;
//                             } else if (board[newX][newY] === 13) {
//                                 unclickedCells.push([newX, newY]);
//                             }
//                         }
//                     }
//                 }
//                 if (mines === board[i][j]) {
//                     unclickedCells.forEach(cell => flaggedMines.push(cell));
//                 } else if (unclickedCells.length + mines === board[i][j]) {
//                     unclickedCells.forEach(cell => safeCells.push(cell));
//                 }
//             }
//         }
//     }

//     // 如果找到安全的格子，点击这些格子
//     if (safeCells.length > 0) {
//         return { action: 'click', position: safeCells[0] };
//     }

//     // 标记雷
//     if (flaggedMines.length > 0) {
//         return { action: 'flag', position: flaggedMines[0] };
//     }

//     // 如果没有明显的安全格子，随机选择一个可点击的空白格子
//     for (let i = 0; i < rows; i++) {
//         for (let j = 0; j < cols; j++) {
//             if (board[i][j] === 13) {
//                 return { action: 'click', position: [i, j] };
//             }
//         }
//     }

//     return null; // 如果没有可点击的空白格子
// }


// function nextMove(board) {
//     const rows = board.length;
//     const cols = board[0].length;
//     const flaggedMines = [];
//     const safeCells = [];

//     // 检查周围的雷数量
//     function countMines(x, y) {
//         let mines = 0;
//         for (let i = -1; i <= 1; i++) {
//             for (let j = -1; j <= 1; j++) {
//                 const newX = x + i;
//                 const newY = y + j;
//                 if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
//                     if (board[newX][newY] === 10 || board[newX][newY] === 11) {
//                         mines++;
//                     }
//                 }
//             }
//         }
//         return mines;
//     }

//     // Fisher-Yates 洗牌算法
//     function shuffle(array) {
//         for (let i = array.length - 1; i > 0; i--) {
//             const j = Math.floor(Math.random() * (i + 1));
//             [array[i], array[j]] = [array[j], array[i]];
//         }
//     }

//     // 标记雷和找安全的格子
//     for (let i = 0; i < rows; i++) {
//         for (let j = 0; j < cols; j++) {
//             if (board[i][j] >= 1 && board[i][j] <= 9) {
//                 let mines = 0;
//                 let unclickedCells = [];
//                 for (let x = -1; x <= 1; x++) {
//                     for (let y = -1; y <= 1; y++) {
//                         const newX = i + x;
//                         const newY = j + y;
//                         if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
//                             if (board[newX][newY] === 10 || board[newX][newY] === 11) {
//                                 mines++;
//                             } else if (board[newX][newY] === 13) {
//                                 unclickedCells.push([newX, newY]);
//                             }
//                         }
//                     }
//                 }
//                 if (mines === board[i][j]) {
//                     unclickedCells.forEach(cell => flaggedMines.push(cell));
//                 } else if (unclickedCells.length + mines === board[i][j]) {
//                     unclickedCells.forEach(cell => safeCells.push(cell));
//                 }
//             }
//         }
//     }

//     // 洗牌以增加随机性
//     shuffle(safeCells);
//     shuffle(flaggedMines);

//     // 如果找到安全的格子，点击这些格子
//     if (safeCells.length > 0) {
//         return { action: 'click', position: safeCells[0] };
//     }

//     // 标记雷
//     if (flaggedMines.length > 0) {
//         return { action: 'flag', position: flaggedMines[0] };
//     }

//     // 如果没有明显的安全格子，随机选择一个可点击的空白格子
//     const clickableCells = [];
//     for (let i = 0; i < rows; i++) {
//         for (let j = 0; j < cols; j++) {
//             if (board[i][j] === 13) {
//                 clickableCells.push([i, j]);
//             }
//         }
//     }

//     shuffle(clickableCells);

//     if (clickableCells.length > 0) {
//         return { action: 'click', position: clickableCells[0] };
//     }

//     return null; // 如果没有可点击的空白格子
// }



function getNextAction(board) {
    const rows = board.length;
    const cols = board[0].length;
    const middlePosition = [Math.floor(rows / 2), Math.floor(cols / 2)];
    const clickedPositions = new Set();

    function isInBounds(r, c) {
        return r >= 0 && r < rows && c >= 0 && c < cols;
    }

    function getNeighbors(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (isInBounds(nr, nc) && !(dr === 0 && dc === 0)) {
                    neighbors.push([nr, nc]);
                }
            }
        }
        return neighbors;
    }

    function countCoveredNeighbors(neighbors) {
        return neighbors.filter(([nr, nc]) => board[nr][nc] === 13).length;
    }

    function countFlaggedNeighbors(neighbors) {
        return neighbors.filter(([nr, nc]) => board[nr][nc] === 10 || board[nr][nc] === 11).length;
    }

    function markMines(neighbors) {
        neighbors.forEach(([nr, nc]) => {
            if (board[nr][nc] === 13) {
                board[nr][nc] = 11; // 标记为地雷
                actions.push({ action: "flag", position: [nr, nc] });
            }
        });
    }

    function clickSafeCells(neighbors) {
        neighbors.forEach(([nr, nc]) => {
            if (board[nr][nc] === 13 && !clickedPositions.has(`${nr},${nc}`)) {
                board[nr][nc] = 14; // 标记为安全
                actions.push({ action: "click", position: [nr, nc] });
                clickedPositions.add(`${nr},${nc}`);
            }
        });
    }

    const actions = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] >= 1 && board[r][c] <= 9) {
                const neighbors = getNeighbors(r, c);
                const coveredNeighbors = neighbors.filter(([nr, nc]) => board[nr][nc] === 13);
                const flaggedNeighbors = neighbors.filter(([nr, nc]) => board[nr][nc] === 10 || board[nr][nc] === 11);

                if (coveredNeighbors.length + flaggedNeighbors.length === board[r][c]) {
                    markMines(coveredNeighbors);
                }

                if (flaggedNeighbors.length === board[r][c]) {
                    clickSafeCells(coveredNeighbors);
                }
            }
        }
    }

    if (actions.length > 0) {
        return actions[0];
    }

    // 尝试点击中间位置
    if (board[middlePosition[0]][middlePosition[1]] === 13 && !clickedPositions.has(`${middlePosition[0]},${middlePosition[1]}`)) {
        clickedPositions.add(`${middlePosition[0]},${middlePosition[1]}`);
        return { action: "click", position: middlePosition };
    }

    // 搜索整个棋盘，找到第一个未点击的可点击空白格子
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 13 && !clickedPositions.has(`${r},${c}`)) {
                clickedPositions.add(`${r},${c}`);
                return { action: "click", position: [r, c] };
            }
        }
    }

    // 如果没有找到可点击的格子，返回默认值（应该不会执行到这里）
    return { action: "click", position: middlePosition };
}



function find_next_pos(input_row: number, input_col: number, startX: number, startY: number) {
    let index = 0
    // console.log(JSON.stringify(match_result))
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
    face_img.resize(24, 24)
    // face_img.save("d:\\2.png")


    const compare_face = ssf.Image.batch_compare([face_img], target_faceimgs)
    const face_value = state_map.get(compare_face[0])

    // console.log("face_value", face_value)
    switch (face_value) {

        case 15: return 1;
        case 16: {
            //触雷 重新开始
            ssf.Input.move(face_pos.x + chrome_pos.x + face_pos.w / 2, face_pos.y + chrome_pos.y + face_pos.h / 2, ssf.enums.Coordinate.Abs)
            ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
            return 2

        };
        case 17: return 3;
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
            cell_img.resize(18, 18)
            cell_imgs.push(cell_img)
            // cell_img.gray()
            // const cell_value = findMostSimilarImage(cell_img, map)
            // const cell_value = findMostSimilarImage(cell_img, map)

            // rows_data.push(cell_value)
            // cell_img.close()
            index = index + 1

        }
        // data.push(rows_data)
    }
    // console.log(target_base_imgs)
    // console.log(map)
    // map.forEach(element => {
    // console.log(element)

    // });

    // for (const [key, img2] of map.entries()) {

    // console.log(key,img2)
    // }

    // console.log(JSON.stringify(ssf.Image.batch_compare(cell_imgs, target_base_imgs)))
    // console.log(JSON.stringify())
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

    // const end = performance.now();
    // console.log(`cell 执行时间: ${end - start} 毫秒`);
    // console.log(JSON.stringify(data))
    return data;



}

function check_next() {
    let img = null;
    while (true) {
        const start = performance.now();

        try {

            img = ssf.Frame.to_image(20)
            // img.save("d:\\1.png")
            // ssf.Sys.sleep(3000)

        } catch (error) {
            // console.log(error)
            continue
        }
        let state = check_face(img)
        switch (state) {
            case 1: {
                console.log("成功"); return;
            } break;
            case 2: {
                console.log("触雷,重新来")
            } break;
            case 3: { //console.log("正常状态") 

            } break;


        }


        const board = find(img)

        // if (state == 2) {

        // console.log(JSON.stringify(board))
        // img.save("d:\\1.png")

        // return
        // }
        img.close()

        // console.log(JSON.stringify(board))
        // const nextMoveResult = smartMineSweeper(board);
        // board.forEach(row => {
        //     // row.forEach(element => {
        //     //   console.log(element);
        //     // });
        //     console.log(row);

        // });
        const nextMoveResult = getNextAction(board);
        // console.log(JSON.stringify(nextMoveResult),nextMoveResult?.position[0],nextMoveResult?.position[1],)
        //判断要点击行的具体位置
        const p = find_next_pos(nextMoveResult?.position[0], nextMoveResult?.position[1], new_rect.x, new_rect.y)
        switch (nextMoveResult?.action) {
            case "click": {
                ssf.Input.move(p.x, p.y, ssf.enums.Coordinate.Abs)
                ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
            } break;
            case "flag": {
                ssf.Input.move(p.x, p.y, ssf.enums.Coordinate.Abs)
                ssf.Input.button(ssf.enums.Button.Right, ssf.enums.Direction.Click)

            } break;
        }

        const end = performance.now();
        console.log(`find 执行时间: ${end - start} 毫秒`);

    }


}


check_next()
