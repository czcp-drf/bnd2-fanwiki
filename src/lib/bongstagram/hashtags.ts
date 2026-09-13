const HASHTAG_PATTERN = /#[^\s#]+/g

export function extractBongstagramHashtags(content: string) {
  return content.match(HASHTAG_PATTERN)?.map((hashtag) => hashtag.slice(1)) ?? []
}
