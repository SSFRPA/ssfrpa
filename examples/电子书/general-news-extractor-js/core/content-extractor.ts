// import { sampleStdev } from 'stats-lite'
import { iteratorNode } from '../utils.ts'

export default class ContentExtractor {
  contentTag: string
  nodeInfo: any[]
  punctuation: Set<string>

  constructor(contentTag = 'p') {
    this.contentTag = contentTag
    this.nodeInfo = []
    this.punctuation = new Set([...`！，。？、；：“”‘’《》%（）,.?:;'"!%()`])
  }

  extract($: CheerioStatic) {
    $('body *').each((idx, node) => {
      const { density, tiText, ti, lti, tgi, ltgi } = this.calcTextDensity(node, $)
      const textTagCount = this.countTextTag($, node, this.contentTag)
      const sbdi = this.calcSbdi(tiText, ti, lti)

      const info = {
        ti,
        lti,
        tgi,
        ltgi,
        node,
        density,
        text: tiText,
        textTagCount,
        sbdi
      }

      this.nodeInfo.push(info)
    })
    const std = this.calcStandardDeviation()
    this.calcNewScore(std)
    const result = this.nodeInfo.sort((a, b) => b.score - a.score)
    return result
  }

  countTextTag($: CheerioStatic, element: CheerioElement, tag = 'p') {
    return $(element).find(tag).length
  }

  getAllTiText(element: CheerioElement, $: CheerioStatic) {
    const textList: string[] = []
    for (const node of iteratorNode(element)) {
      if (node.type === 'text') {
        const text = $(node)
          .text()
          .replace(/[\n\r]/g, ' ')
          .replace(/\s{1,}/g, ' ')
          .trim()
        text && textList.push(text)
      }
    }
    return textList
  }

  getAllLtiText(element: CheerioElement, $: CheerioStatic) {
    const textList: string[] = []
    for (const node of iteratorNode(element)) {
      if (node.tagName === 'a') {
        const text = $(node)
          .text()
          .replace(/[\n\r]/g, ' ')
          .replace(/\s{1,}/g, ' ')
          .trim()
        text && textList.push(text)
      }
    }
    return textList
  }

  /*
        score = log(std) * ndi * log10(textTagCount + 2) * log(sbdi)

        std：每个节点文本密度的标准差
        ndi：节点 i 的文本密度
        textTagCount: 正文所在标签数。例如正文在<p></p>标签里面，这里就是 p 标签数。（目前把所有 p 内的 span、div 转成了 p 标签）
        sbdi：节点 i 的符号密度
   */

  calcNewScore(std: number) {
    for (const info of this.nodeInfo) {
      const score =
        Math.log(std) * info.density * Math.log10(info.textTagCount + 2) * Math.log(info.sbdi)
      info.score = isNaN(score) ? 0 : score
    }
  }



// 计算平均值
 mean(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

// 计算样本标准差
 sampleStdev(values: number[]): number {
  const n = values.length;

  // 如果样本数量小于2，标准差无法计算
  if (n < 2) {
    throw new Error("样本数量必须至少为 2 才能计算标准差");
  }

  // 计算平均值
  const avg = this.mean(values);

  // 计算平方差的总和
  const sumOfSquaredDiffs = values.reduce(
    (sum, value) => sum + Math.pow(value - avg, 2),
    0
  );

  // 使用 (n - 1) 来计算方差
  const variance = sumOfSquaredDiffs / (n - 1);

  // 标准差是方差的平方根
  const std = Math.sqrt(variance);

  return std;
}


calcStandardDeviation(): number {
  const scoreList = this.nodeInfo.map(item => item.density)
  const std = this.sampleStdev(scoreList)
  return std
}

  /*
    根据公式：

           Ti - LTi
    TDi = -----------
          TGi - LTGi


    Ti:节点 i 的字符串字数
    LTi：节点 i 的带链接的字符串字数
    TGi：节点 i 的标签数
    LTGi：节点 i 的带连接的标签数
  */
  calcTextDensity(element: CheerioElement, $: CheerioStatic) {
    const tiText = this.getAllTiText(element, $).join('\n')
    const ti = tiText.length

    const lti = this.getAllLtiText(element, $).join('\n').length
    const tgi = $(element).find('*').length
    const ltgi = $(element).find('a').length

    let density = 0
    if (tgi - ltgi !== 0) {
      density = (ti - lti) / (tgi - ltgi)
    }

    return { density, tiText, ti, lti, tgi, ltgi }
  }

  countPunctuationNum(text: string) {
    let count = 0
    for (const char of text) {
      if (this.punctuation.has(char)) {
        count += 1
      }
    }
    return count
  }
  /*
                 Ti - LTi
        SbDi = --------------
                 Sbi + 1

        SbDi: 符号密度
        Sbi：符号数量
   */
  calcSbdi(text: string, ti: number, lti: number) {
    const sbi = this.countPunctuationNum(text)
    const sbdi = (ti - lti) / (sbi + 1)
    return sbdi || 1
  }
}
