export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 1. 안전한 파라미터 수신 및 디코딩 헬퍼
  const getSafeParam = (key, defaultValue) => {
    let value = url.searchParams.get(key);
    if (!value) return defaultValue;
    try {
      value = decodeURIComponent(value);
      if (value.includes('%')) value = decodeURIComponent(value);
    } catch (e) { /* ignore */ }
    return value;
  };

  // 2. XML 특수문자 이스케이프 (깨짐 방지 핵심)
  const escapeXml = (unsafe) => {
    return String(unsafe).replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&apos;');
  };

  const title = escapeXml(getSafeParam('title', '제목 없음'));
  const date = escapeXml(getSafeParam('date', '3125.??.??'));
  const reporter = escapeXml(getSafeParam('reporter', '???'));
  const contentRaw = getSafeParam('content', '본문 없음');
  
  // 댓글 파싱
  const commentsRaw = getSafeParam('c', '');
  const comments = [];
  if (commentsRaw) {
    const items = commentsRaw.split('/./');
    for (let i = 0; i < Math.min(items.length, 6); i++) {
      const parts = items[i].split('|');
      comments.push({
        name: escapeXml(parts[0] || ''),
        text: escapeXml(parts[1] || ''),
        like: escapeXml(parts[2] || ''),
        dislike: escapeXml(parts[3] || ''),
        reply: parts[4] === 'r'
      });
    }
  }

  const textColor = '#1A6B6B';
  const deletedColor = '#AAAAAA';

  function getRandomColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#5BB5B5', '#808080', '#C27070', '#6B6B6B', '#A0A060', '#2D7070', '#7070A0', '#A06060', '#60A060', '#A080A0'];
    return colors[Math.abs(hash) % colors.length];
  }

  function wrapText(text, maxWidth) {
    const lines = [];
    let currentLine = '';
    let currentWidth = 0;
    for (const char of text) {
      const charWidth = /[^\x00-\x7F]/.test(char) ? 23 : 13;
      if (currentWidth + charWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = char;
        currentWidth = charWidth;
      } else {
        currentLine += char;
        currentWidth += charWidth;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  const contentLines = wrapText(contentRaw, 834);
  let contentSvg = '';
  for (let i = 0; i < contentLines.length; i++) {
    contentSvg += `<text x="95" y="${565 + (i * 30)}" fill="${textColor}" font-size="23" font-family="'Noto Sans KR', sans-serif" font-weight="400">${escapeXml(contentLines[i])}</text>`;
  }

  function createComment(name, text, like, dislike, isReply, y) {
    if (!name && !text) return '';
    const isDel = text.includes('운영정책 위반으로 삭제된 댓글입니다');
    const displayColor = isDel ? deletedColor : textColor;
    
    // 이모지 안전하게 첫 글자 따기 (Array.from 사용)
    const firstChar = Array.from(name)[0] || '?';
    const color = getRandomColor(name);
    
    const offsetX = isReply ? 40 : 0;
    
    let likeText = '';
    if (!isReply && (like || dislike)) {
      likeText = `<text x="${125 + offsetX}" y="${y + 35}" fill="${displayColor}" font-size="12" font-family="'Noto Sans KR', sans-serif" font-weight="400">👍 ${like || '0'} · 👎 ${dislike || '0'}</text>`;
    }
    
    let arrow = '';
    if (isReply) {
      arrow = `<text x="95" y="${y + 5}" fill="${displayColor}" font-size="17" font-family="'Noto Sans KR', sans-serif">↳</text>`;
    }
    
    return `
      ${arrow}
      <circle cx="${95 + offsetX}" cy="${y}" r="20" fill="${color}"/>
      <text x="${95 + offsetX}" y="${y + 6}" fill="white" font-size="16" font-family="'Noto Sans KR', sans-serif" font-weight="700" text-anchor="middle">${firstChar}</text>
      <text x="${125 + offsetX}" y="${y - 5}" fill="${displayColor}" font-size="19" font-family="'Noto Sans KR', sans-serif" font-weight="700">${name}</text>
      <text x="${125 + offsetX}" y="${y + 18}" fill="${displayColor}" font-size="15" font-family="'Noto Sans KR', sans-serif" font-weight="400">${text}</text>
      ${likeText}
    `;
  }

  let commentsY = 1550;
  let commentsSvg = '';
  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    commentsSvg += createComment(c.name, c.text, c.like, c.dislike, c.reply, commentsY + (i * 75));
  }

  // [수정됨] 배경 이미지 안전하게 불러오기 (Stack Overflow 방지)
  let bgBase64 = '';
  try {
    const bgUrl = url.origin + '/news-bg.png';
    const bgResponse = await fetch(bgUrl);
    if (bgResponse.ok) {
      const bgBuffer = await bgResponse.arrayBuffer();
      const bytes = new Uint8Array(bgBuffer);
      let binary = '';
      // 큰 파일도 처리할 수 있도록 청크 단위로 처리
      const chunkSize = 8192; 
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      bgBase64 = btoa(binary);
    } else {
      console.log('Background image not found');
    }
  } catch (e) {
    console.error('Background load error:', e);
  }

  const svg = `
    <svg width="1024" height="2048" viewBox="0 0 1024 2048" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&amp;display=swap');
        </style>
      </defs>
      
      <!-- 배경 이미지가 있으면 표시, 없으면 회색 배경 (디버깅용) -->
      ${bgBase64 
        ? `<image href="data:image/png;base64,${bgBase64}" width="1024" height="2048"/>` 
        : `<rect width="1024" height="2048" fill="#f0f0f0"/><text x="50" y="50" font-size="30" fill="red">이미지 로드 실패</text>`}
      
      <text x="95" y="480" fill="${textColor}" font-size="51" font-family="'Noto Sans KR', sans-serif" font-weight="700">${title}</text>
      <text x="720" y="530" fill="${textColor}" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400" fill-opacity="0.85">${date} 작성기자| ${reporter}</text>
      
      ${contentSvg}
      ${commentsSvg}
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
