export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 기본 정보
  const title = url.searchParams.get('title') || '제목 없음';
  const date = url.searchParams.get('date') || '3125.??.??';
  const reporter = url.searchParams.get('reporter') || '???';
  const content = url.searchParams.get('content') || '본문 없음';

  // 댓글 1~6
  const comments = [];
  for (let i = 1; i <= 6; i++) {
    comments.push({
      name: url.searchParams.get(`c${i}_name`) || '',
      text: url.searchParams.get(`c${i}_text`) || '',
      like: url.searchParams.get(`c${i}_like`) || '',
      dislike: url.searchParams.get(`c${i}_dislike`) || ''
    });
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

  // 댓글 생성 함수
  function createComment(name, text, like, dislike, y) {
    if (!name && !text) return '';
    const isDel = text.includes('운영정책 위반으로 삭제된 댓글입니다');
    const displayColor = isDel ? deletedColor : textColor;
    const firstChar = name.charAt(0) || '?';
    const color = getRandomColor(name);
    
    // 좋아요/싫어요 (값 있을 때만 표시)
    let likeText = '';
    if (like || dislike) {
      likeText = `<text x="125" y="${y + 32}" fill="${displayColor}" font-size="6" font-family="'Noto Sans KR', sans-serif" font-weight="400">👍 ${like || '0'} · 👎 ${dislike || '0'}</text>`;
    }
    
    return `
      <circle cx="95" cy="${y}" r="18" fill="${color}"/>
      <text x="95" y="${y + 5}" fill="white" font-size="13" font-family="'Noto Sans KR', sans-serif" font-weight="700" text-anchor="middle">${firstChar}</text>
      <text x="125" y="${y - 5}" fill="${displayColor}" font-size="15" font-family="'Noto Sans KR', sans-serif" font-weight="700">${name}</text>
      <text x="125" y="${y + 15}" fill="${displayColor}" font-size="11" font-family="'Noto Sans KR', sans-serif" font-weight="400">${text}</text>
      ${likeText}
    `;
  }

  // 댓글 SVG 생성
  let commentsY = 1670;
  let commentsSvg = '';
  for (let i = 0; i < 6; i++) {
    const c = comments[i];
    commentsSvg += createComment(c.name, c.text, c.like, c.dislike, commentsY + (i * 70));
  }

  // 배경 이미지 로드
  const bgUrl = url.origin + '/news-bg.png';
  const bgResponse = await fetch(bgUrl);
  const bgBuffer = await bgResponse.arrayBuffer();
  const bgBase64 = btoa(String.fromCharCode(...new Uint8Array(bgBuffer)));

  const svg = `
    <svg width="1024" height="2048" viewBox="0 0 1024 2048" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&amp;display=swap');
        </style>
      </defs>
      
      <!-- 배경 이미지 -->
      <image href="data:image/png;base64,${bgBase64}" width="1024" height="2048"/>
      
      <!-- 제목 -->
      <text x="95" y="530" fill="${textColor}" font-size="51" font-family="'Noto Sans KR', sans-serif" font-weight="700">${title}</text>
      
      <!-- 날짜 -->
      <text x="750" y="500" fill="${textColor}" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400">${date}</text>
      
      <!-- 작성 기자 -->
      <text x="750" y="530" fill="${textColor}" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400">작성 기자: ${reporter}</text>
      
      <!-- 본문 -->
      <text x="95" y="620" fill="${textColor}" font-size="21" font-family="'Noto Sans KR', sans-serif" font-weight="400">${content}</text>
      
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
