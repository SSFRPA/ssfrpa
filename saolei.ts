
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


const map = new Map();
const state_map = new Map();

//存放基础雷的种类
const base_dir = "./saolei_images/"
for await (const dirEntry of Deno.readDir(base_dir)) {
    const img = ssf.Image.load(base_dir + dirEntry.name)
    img.resize(36, 36)
    // img.gray()
    map.set(parseInt(dirEntry.name.split('.')[0], 10), img)

}

//存放状态 表示正常 触雷 胜利
const base_state_dir = "./saolei_state_images/"
for await (const dirEntry of Deno.readDir(base_state_dir)) {
    const img = ssf.Image.load(base_state_dir + dirEntry.name)
    img.resize(36, 36)


    state_map.set(parseInt(dirEntry.name.split('.')[0], 10), img)


}




function findMostSimilarImage(img, imageMap) {
    let mostSimilarImageKey = null;
    let lowestSimilarity = Infinity; // 初始值设置为正无穷

    // 确保imageMap是一个Map对象
    if (!(imageMap instanceof Map)) {
        console.error("imageMap不是一个Map对象");
        return null;
    }

    // 确保imageMap有值
    if (imageMap.size === 0) {
        console.error("imageMap是空的");
        return null;
    }

    // 遍历map中的所有图片
    for (let [key, img2] of imageMap.entries()) {
        // 确保img.compare方法存在
        if (typeof img.compare !== "function") {
            console.error("img.compare不是一个函数");
            return null;
        }

        // 计算相似度
        let similarity = img.compare(img2);

        // 如果当前相似度更低，更新最低相似度和对应的图片编号
        if (similarity < lowestSimilarity) {
            lowestSimilarity = similarity;
            mostSimilarImageKey = key;
        }
    }

    return mostSimilarImageKey; // 返回最相似图片的编号
}



// const hash_bit = 32

const data = [];


function nextMove(board) {
    const rows = board.length;
    const cols = board[0].length;
    const flaggedMines = [];
    const safeCells = [];

    // 检查周围的雷数量
    function countMines(x, y) {
        let mines = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newX = x + i;
                const newY = y + j;
                if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
                    if (board[newX][newY] === 10 || board[newX][newY] === 11) {
                        mines++;
                    }
                }
            }
        }
        return mines;
    }

    // 标记雷和找安全的格子
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (board[i][j] >= 1 && board[i][j] <= 9) {
                let mines = 0;
                let unclickedCells = [];
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        const newX = i + x;
                        const newY = j + y;
                        if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
                            if (board[newX][newY] === 10 || board[newX][newY] === 11) {
                                mines++;
                            } else if (board[newX][newY] === 13) {
                                unclickedCells.push([newX, newY]);
                            }
                        }
                    }
                }
                if (mines === board[i][j]) {
                    unclickedCells.forEach(cell => flaggedMines.push(cell));
                } else if (unclickedCells.length + mines === board[i][j]) {
                    unclickedCells.forEach(cell => safeCells.push(cell));
                }
            }
        }
    }

    // 如果找到安全的格子，点击这些格子
    if (safeCells.length > 0) {
        return { action: 'click', position: safeCells[0] };
    }

    // 标记雷
    if (flaggedMines.length > 0) {
        return { action: 'flag', position: flaggedMines[0] };
    }

    // 如果没有明显的安全格子，随机选择一个可点击的空白格子
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (board[i][j] === 13) {
                return { action: 'click', position: [i, j] };
            }
        }
    }

    return null; // 如果没有可点击的空白格子
}


function find() {

    const face_pos = ssf.Browser.getPosition(tid, '//*[@id="face"]', 3000)



    const img = ssf.Frame.to_image(20)
    const face_img = img.crop_imm(face_pos.x + chrome_pos.x, face_pos.y + chrome_pos.y, face_pos.w, face_pos.h)
    face_img.resize(36, 36)

    const face_value = findMostSimilarImage(face_img, state_map)
    console.log("face_value", face_value)
    switch (face_value) {

        case "15": return;
        case "16": {
            //触雷 重新开始
            ssf.Input.move(face_pos.x + chrome_pos.x + face_pos.w / 2, face_pos.y + chrome_pos.y + face_pos.h / 2, ssf.enums.Coordinate.Abs)
            ssf.Input.button(ssf.enums.Button.Left, ssf.enums.Direction.Click)
            break

        };
        case "17": break;
    }

    let index = 0;
    img.crop(new_rect.x, new_rect.y, new_rect.w, new_rect.h)
    const start = performance.now();

    for (let row = 0; row < rows; row++) {
        let rows_data = []
        for (let col = 0; col < cols; col++) {

            const element = match_result[index]
            const cell_img = img.crop_imm(element.x, element.y, element.w, element.h)
            cell_img.resize(36, 36)
            // cell_img.gray()
            const cell_value = findMostSimilarImage(cell_img, map)
            rows_data.push(cell_value)
            cell_img.close()
            index = index + 1

        }
        data.push(rows_data)
    }

    const end = performance.now();
    console.log(`cell 执行时间: ${end - start} 毫秒`);
    // console.log(JSON.stringify(data))
    return data;



}
const start = performance.now();
const board = find()
const end = performance.now();
console.log(`exampleFunction2 执行时间: ${end - start} 毫秒`);
console.log(JSON.stringify(board))
const nextMoveResult = nextMove(board);
console.log(JSON.stringify(nextMoveResult) )
