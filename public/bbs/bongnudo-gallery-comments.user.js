// ==UserScript==
// @name         봉누도 갤러리 댓글 정제
// @namespace    bnd2-fanwiki
// @version      1.0.0
// @description  봉누도 갤러리 기사 댓글에서 작성자·시각·본문만 추출해 Markdown 또는 JSON으로 복사합니다.
// @match        https://bongnudo-gallery.vercel.app/*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict'

  const launcherHost = document.createElement('div')
  const shadow = launcherHost.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      button, textarea { font: 13px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif; }
      .launcher { position: fixed; right: 18px; bottom: 18px; z-index: 2147483646; border: 1px solid #f2b84b; border-radius: 999px; padding: 10px 14px; color: #17110a; background: #f2b84b; box-shadow: 0 8px 30px #0008; font-weight: 800; cursor: pointer; }
      .backdrop { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 18px; background: #0009; }
      .dialog { width: min(760px, 100%); max-height: min(760px, calc(100vh - 36px)); overflow: auto; border: 1px solid #475569; border-radius: 16px; padding: 18px; color: #e5e7eb; background: #111827; box-shadow: 0 20px 70px #000b; }
      .head { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .title { margin: 0; font-size: 16px; font-weight: 800; }
      .meta { margin: 4px 0 0; color: #94a3b8; font-size: 12px; }
      .close { border: 0; border-radius: 8px; padding: 4px 8px; color: #cbd5e1; background: #1e293b; cursor: pointer; }
      .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .toolbar button { border: 1px solid #475569; border-radius: 8px; padding: 7px 10px; color: #e2e8f0; background: #1e293b; cursor: pointer; }
      .toolbar button:hover, .close:hover { background: #334155; }
      .output { width: 100%; min-height: 280px; margin-top: 12px; resize: vertical; border: 1px solid #475569; border-radius: 10px; padding: 10px; color: #e5e7eb; background: #020617; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
      .notice { margin: 12px 0 0; color: #fbbf24; font-size: 12px; }
    </style>
    <button class="launcher" type="button">댓글 정제</button>
  `
  document.documentElement.appendChild(launcherHost)

  const launcher = shadow.querySelector('.launcher')
  let backdrop = null

  function cleanText(node) {
    const clone = node.cloneNode(true)
    clone.querySelectorAll('script, style, noscript, svg, img, button, input, textarea').forEach((child) => child.remove())
    return (clone.innerText || clone.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  function readText(root, selectors) {
    for (const selector of selectors) {
      const node = root.querySelector(selector)
      const value = node ? cleanText(node) : ''
      if (value) return value
    }
    return ''
  }

  function extractComments() {
    const exact = [...document.querySelectorAll('.news-article__comment')]
    const nodes = exact.length
      ? exact
      : [...document.querySelectorAll('li[class*="comment"], article [class*="comment"]')]
        .filter((node) => node.querySelector('[class*="comment-text"], [class*="comment-content"]'))

    const comments = nodes.map((node) => {
      const head = node.querySelector('.news-article__comment-head, [class*="comment-head"]')
      const author = readText(node, [
        '.news-article__comment-head b',
        '.news-article__comment-author',
        '[class*="comment-author"]',
        '[class*="comment-head"] b',
      ])
      const date = readText(head || node, [
        '.news-article__comment-head span',
        '[datetime]',
        '[class*="comment-date"]',
        '[class*="comment-time"]',
      ])
      const contentNode = node.querySelector('.news-article__comment-text, [class*="comment-text"], [class*="comment-content"]')
      const content = contentNode ? cleanText(contentNode) : ''
      return { author, createdAt: date, content }
    }).filter((comment) => comment.content)

    return {
      title: readText(document, ['.news-article__title', 'main h1', 'h1', 'title']),
      comments,
    }
  }

  function escapeMarkdown(value) {
    return String(value || '').replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&')
  }

  function toMarkdown(data) {
    const heading = data.title ? `## ${escapeMarkdown(data.title)}\n\n` : ''
    const body = data.comments.map((comment) => {
      const meta = [comment.author || '작성자 미상', comment.createdAt].filter(Boolean).map(escapeMarkdown).join(' · ')
      const content = comment.content.split('\n').map((line) => `  ${escapeMarkdown(line)}`).join('\n')
      return `- **${meta}**\n${content}`
    }).join('\n\n')
    return `${heading}${body}`.trim()
  }

  function toJson(data) {
    return JSON.stringify({ title: data.title, comments: data.comments }, null, 2)
  }

  async function copy(value) {
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(value, 'text')
      return
    }
    await navigator.clipboard.writeText(value)
  }

  function close() {
    backdrop?.remove()
    backdrop = null
  }

  function open() {
    const data = extractComments()
    const markdown = toMarkdown(data)
    const json = toJson(data)
    backdrop = document.createElement('div')
    backdrop.className = 'backdrop'
    backdrop.innerHTML = `
      <section class="dialog" role="dialog" aria-modal="true" aria-label="댓글 정제 결과">
        <div class="head">
          <div><h2 class="title">외부 BBS 댓글 정제 결과</h2><p class="meta"></p></div>
          <button class="close" type="button">닫기</button>
        </div>
        <p class="notice"></p>
        <div class="toolbar"><button class="copy-markdown" type="button">Markdown 복사</button><button class="copy-json" type="button">JSON 복사</button><button class="download-json" type="button">JSON 다운로드</button></div>
        <textarea class="output" readonly></textarea>
      </section>
    `
    shadow.appendChild(backdrop)
    backdrop.querySelector('.meta').textContent = `${data.title || '제목 없음'} · ${data.comments.length}개 댓글`
    backdrop.querySelector('.notice').textContent = data.comments.length ? '외부 페이지의 댓글 DOM에서 텍스트만 추출했습니다. 아바타·버튼·이미지는 제외됩니다.' : '댓글을 찾지 못했습니다. 댓글이 펼쳐진 기사 페이지에서 다시 실행해 주세요.'
    backdrop.querySelector('.output').value = markdown
    backdrop.querySelector('.close').addEventListener('click', close)
    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close() })
    backdrop.querySelector('.copy-markdown').addEventListener('click', async (event) => { await copy(markdown); event.currentTarget.textContent = '복사됨' })
    backdrop.querySelector('.copy-json').addEventListener('click', async (event) => { await copy(json); event.currentTarget.textContent = '복사됨' })
    backdrop.querySelector('.download-json').addEventListener('click', () => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }))
      link.download = 'bbs-comments.json'
      link.click()
      URL.revokeObjectURL(link.href)
    })
  }

  launcher.addEventListener('click', open)
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && backdrop) close() })
})()
