export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 기본 정보
  const title = url.searchParams.get('title') || '제목 없음';
  const date = url.searchParams.get('date') || '3125.??.??';
  const reporter = url.searchParams.get('reporter') || '???';
  const content = url.searchParams.get('content') || '본문 없음';

  // 댓글 파싱 (형식: 이름|텍스트|좋아요|싫어요|r)
  const commentsRaw = url.searchParams.get('c') || '';
  const comments = [];
  
  if (commentsRaw) {
    const items = commentsRaw.split('/./');
    for (let i = 0; i < Math.min(items.length, 6); i++) {
      const parts = items[i].split('|');
      comments.push({
        name: parts[0] || '',
        text: parts[1] || '',
        like: parts[2] || '',
        dislike: parts[3] || '',
        reply: parts[4] === 'r'
      });
    }
  }

  // 색상 정의
  const textColor = '#1A6B6B';
  const deletedColor = '#AAAAAA';

  // 프로필 색상 랜덤 생성
  function getRandomColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#5BB5B5', '#808080', '#C27070', '#6B6B6B', '#A0A060', '#2D7070', '#7070A0', '#A06060', '#60A060', '#A080A0'];
    return colors[Math.abs(hash) % colors.length];
  }

  // 본문 줄바꿈 함수
  function wrapText(text, maxWidth) {
    const lines = [];
    let currentLine = '';
    let currentWidth = 0;
    
    for (const char of text) {
      const charWidth = /[가-힣]/.test(char) ? 18 : 10;
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

  // 본문 SVG 생성
  const contentLines = wrapText(content, 550);
  let contentSvg = '';
  for (let i = 0; i < contentLines.length; i++) {
    contentSvg += `<text x="60" y="${270 + (i * 24)}" fill="${textColor}" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400">${contentLines[i]}</text>`;
  }

  // 댓글 생성 함수
  function createComment(name, text, like, dislike, isReply, y) {
    if (!name && !text) return '';
    const isDel = text.includes('운영정책 위반으로 삭제된 댓글입니다');
    const displayColor = isDel ? deletedColor : textColor;
    const firstChar = name.charAt(0) || '?';
    const color = getRandomColor(name);
    
    const offsetX = isReply ? 30 : 0;
    
    let likeText = '';
    if (!isReply && (like || dislike)) {
      likeText = `<text x="${95 + offsetX}" y="${y + 28}" fill="${displayColor}" font-size="10" font-family="'Noto Sans KR', sans-serif" font-weight="400">👍 ${like || '0'} · 👎 ${dislike || '0'}</text>`;
    }
    
    let arrow = '';
    if (isReply) {
      arrow = `<text x="60" y="${y + 4}" fill="${displayColor}" font-size="12" font-family="'Noto Sans KR', sans-serif">↳</text>`;
    }
    
    return `
      ${arrow}
      <circle cx="${75 + offsetX}" cy="${y}" r="14" fill="${color}"/>
      <text x="${75 + offsetX}" y="${y + 5}" fill="white" font-size="11" font-family="'Noto Sans KR', sans-serif" font-weight="700" text-anchor="middle">${firstChar}</text>
      <text x="${95 + offsetX}" y="${y - 3}" fill="${displayColor}" font-size="14" font-family="'Noto Sans KR', sans-serif" font-weight="700">${name}</text>
      <text x="${95 + offsetX}" y="${y + 13}" fill="${displayColor}" font-size="11" font-family="'Noto Sans KR', sans-serif" font-weight="400">${text}</text>
      ${likeText}
    `;
  }

  // 댓글 SVG 생성
  let commentsY = 770;
  let commentsSvg = '';
  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    commentsSvg += createComment(c.name, c.text, c.like, c.dislike, c.reply, commentsY + (i * 55));
  }

  // 배경 이미지 로드
  const bgUrl = 'https://cf-status-image.pages.dev/news-bg.png';
  const bgResponse = await fetch(bgUrl);
  const bgBuffer = await bgResponse.arrayBuffer();
  
  // 안전한 Base64 인코딩
  const uint8Array = new Uint8Array(bgBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const bgBase64 = btoa(binary);

  const svg = `
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&amp;display=swap');
        </style>
      </defs>
      
      <!-- 배경 이미지 -->
      <image href="data:image/png;base64,${bgBase64}" width="1024" height="1024"/>
      
      <!-- 제목 -->
      <text x="60" y="210" fill="${textColor}" font-size="32" font-family="'Noto Sans KR', sans-serif" font-weight="700">${title}</text>
      
      <!-- 날짜 + 작성기자 -->
      <text x="60" y="240" fill="${textColor}" font-size="14" font-family="'Noto Sans KR', sans-serif" font-weight="400">${date} 작성기자| ${reporter}</text>
      
      <!-- 본문 -->
      ${contentSvg}
      
      <!-- 댓글 섹션 -->
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
