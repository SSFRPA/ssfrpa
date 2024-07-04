import { AUTHOR_PATTERN_LIST } from '../consts.ts'
export default class AuthorExtractor {
  extractBySelector($: CheerioStatic, authorSelector: string) {
    if (authorSelector) {
      $(authorSelector)
        .text()
        .trim()
    }
    return ''
  }

  extractByPattern($: CheerioStatic) {
    const content = $('body')
      .contents()
      .map((idx, el) => {
        return $(el).text()
      })
      .get()
      .join('')

    for (const pattern of AUTHOR_PATTERN_LIST) {
      const result = content.match(new RegExp(pattern))
      if (result) {
        return result[1]
      }
    }
    return ''
  }

  extract($: CheerioStatic, authorSelector = '') {
    const author = this.extractBySelector($, authorSelector) || this.extractByPattern($)

    return author
  }
}
