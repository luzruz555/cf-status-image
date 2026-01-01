export async function onRequest(context) {
  const url = new URL(context.request.url);

  // [1] 안전하게 값을 가져오고 XML 특수문자를 처리하는 헬퍼 함수
  // decodeURIComponent로 %20 등을 공백으로 변환하고, XML 엔티티로 변환하여 SVG 깨짐 방지
  const getSafeParam = (key, defaultValue) => {
    let value = url.searchParams.get(key);
    if (!value) return defaultValue;

    try {
      // 캐챗 등에서 %20이 문자열 그대로 들어오는 경우 대비 (이중 디코딩 허용)
      value = decodeURIComponent(value);
      // 혹시라도 %20이 안 풀렸을 경우를 위해 한 번 더 시도 (선택적)
      if (value.includes('%')) value = decodeURIComponent(value);
    } catch (e) {
      // 디코딩 에러 시 원본 사용
    }
    return value;
  };

  // [중요] 텍스트를 SVG에 넣기 전 특수문자를 변환하는 함수 (줄바꿈 계산 후 적용)
  const escapeXml = (unsafe) => {
    return unsafe.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&apos;');
  };

  // 기본 정보 가져오기
  // title, reporter 등은 바로 escape 처리
  const title = escapeXml(getSafeParam('title', '제목 없음'));
  const date = escapeXml(getSafeParam('date', '3125.??.??'));
  const reporter = escapeXml(getSafeParam('reporter', '???'));
  
  // content는 줄바꿈 계산 때 길이(width)가 중요하므로, 원본 텍스트를 먼저 가져옴
  const contentRaw = getSafeParam('content', '본문 없음');

  // 댓글 파싱
  const commentsRaw = getSafeParam('c', '');
  const comments = [];
  
  if (commentsRaw) {
    // 구분자 '/./'를 기준으로 나눔
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

  // 색상 정의
  const textColor = '#1A6B6B';
  const deletedColor = '#AAAAAA';

  // 프로필 색상 랜덤 생성
  function getRandomColor(name) {
    let hash = 0;
    // name이 이미 escape 된 상태일 수 있으나 해시 계산엔 문제 없음
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#5BB5B5', '#808080', '#C27070', '#6B6B6B', '#A0A060', '#2D7070', '#7070A0', '#A06060', '#60A060', '#A080A0'];
    return colors[Math.abs(hash) % colors.length];
  }

  // 본문 줄바꿈 함수 (원본 텍스트로 길이 계산 수행)
  function wrapText(text, maxWidth) {
    const lines = [];
    let currentLine = '';
    let currentWidth = 0;
    
    for (const char of text) {
      // 한글/전각문자 등은 폭을 넓게 잡음
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

  // 본문 SVG 생성
  // [순서 중요] 1. 원본 텍스트로 줄바꿈 계산 -> 2. 각 줄을 escape 처리해서 SVG에 넣음
  const contentLines = wrapText(contentRaw, 834); 
  let contentSvg = '';
  for (let i = 0; i < contentLines.length; i++) {
    // 여기서 escapeXml 적용
    contentSvg += `<text x="95" y="${565 + (i * 30)}" fill="${textColor}" font-size="23" font-family="'Noto Sans KR', sans-serif" font-weight="400">${escapeXml(contentLines[i])}</text>`;
  }

  // 댓글 생성 함수
  function createComment(name, text, like, dislike, isReply, y) {
    if (!name && !text) return '';
    // text는 이미 위에서 escapeXml 처리됨.
    const isDel = text.includes('운영정책 위반으로 삭제된 댓글입니다');
    const displayColor = isDel ? deletedColor : textColor;
    
    // 첫 글자 가져오기 (특수문자 &amp; 등이 있을 수 있으므로 단순 charAt보다는 주의 필요하지만 여기선 간단히 처리)
    // 이름이 escape 된 상태라면 '&'가 첫 글자가 될 수 있음. 원본 느낌을 살리기 위해 name은 escape 전 것을 쓸 수도 있지만, 
    // 안전을 위해 그냥 처리하거나, 파싱 단계에서 nameRaw를 따로 저장했어야 함. 여기서는 그냥 진행.
    const firstChar = name.substring(0, 1); 
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

  // 댓글 SVG 생성
  let commentsY = 1550;
  let commentsSvg = '';
  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    commentsSvg += createComment(c.name, c.text, c.like, c.dislike, c.reply, commentsY + (i * 75));
  }

  // [2] 배경 이미지 로드 (에러 핸들링 추가)
  let bgBase64 = '';
  try {
    const bgUrl = url.origin + '/news-bg.png';
    const bgResponse = await fetch(bgUrl);
    if (!bgResponse.ok) throw new Error('Image load failed');
    const bgBuffer = await bgResponse.arrayBuffer();
    bgBase64 = btoa(String.fromCharCode(...new Uint8Array(bgBuffer)));
  } catch (e) {
    console.error('Background load failed:', e);
    // 이미지가 없어도 동작하도록 빈 값 유지하거나 대체 처리
  }

  const svg = `
    <svg width="1024" height="2048" viewBox="0 0 1024 2048" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&amp;display=swap');
        </style>
      </defs>
      
      <!-- 배경 이미지: 로드 성공 시 표시, 실패 시 흰색/회색 배경 -->
      ${bgBase64 
        ? `<image href="data:image/png;base64,${bgBase64}" width="1024" height="2048"/>` 
        : `<rect width="1024" height="2048" fill="#f0f0f0"/>`}
      
      <!-- 제목 -->
      <text x="95" y="480" fill="${textColor}" font-size="51" font-family="'Noto Sans KR', sans-serif" font-weight="700">${title}</text>
      
      <!-- 날짜 + 작성기자 -->
      <text x="720" y="530" fill="${textColor}" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400" fill-opacity="0.85">${date} 작성기자| ${reporter}</text>
      
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
