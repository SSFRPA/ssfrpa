import {
  USELESS_TAG,
  USELESS_ATTR,
  TAGS_CAN_BE_REMOVE_IF_EMPTY,
  TAGS_CAN_NOT_BE_REMOVE_IF_EMPTY
} from './consts.ts'
// import * as cheerio from 'cheerio'
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

export const normalizeNode = ($: CheerioStatic) => {
  $('html *').each((idx, el) => {
    const tagName = el.tagName

    if (USELESS_TAG.includes(tagName)) {
      $(el).remove()
      return
    }

    if (!TAGS_CAN_NOT_BE_REMOVE_IF_EMPTY.includes(tagName) && isEmptyElement(el)) {
      $(el).remove()
      return
    }

    if (tagName === 'p') {
      $(el)
        .find('span,strong,em')
        .each((idx, el) => {
          const text = $(el).text()
          $(el).replaceWith(text)
        })
    }

    const classString = el.attribs.class
    if (classString && USELESS_ATTR.find(attr => classString.includes(attr))) {
      $(el).remove()
      return
    }

    if (!el.children.length && ['div', 'span'].includes(tagName)) {
      el.tagName = 'p'
    }
  })
}

export const preParse = (html: string) => {
  html = html.replace(/<\/?br.*?>/, '')
  const $ = cheerio.load(html)
  normalizeNode($)
  return $
}

export const isEmptyElement = (node: CheerioElement) => {
  return !node.children.length && !node.data
}

export const removeNoiseNode = ($: CheerioStatic, noiseSelectorList: string[] = []) => {
  for (const selector of noiseSelectorList) {
    $(selector).remove()
  }
}

export const iteratorNode = function*(element: CheerioElement) {
  yield element
  if (element.children) {
    for (const subElement of element.children) {
      yield* iteratorNode(subElement)
    }
  }
}
