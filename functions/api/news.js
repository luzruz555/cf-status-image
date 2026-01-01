export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 기본 정보
  const title = url.searchParams.get('title') || '제목 없음';
  const date = url.searchParams.get('date') || '3125.??.??';
  const reporter = url.searchParams.get('reporter') || '???';
  const content = url.searchParams.get('content') || '본문 없음';

  // 댓글1
  const c1_name = url.searchParams.get('c1_name') || '';
  const c1_text = url.searchParams.get('c1_text') || '';
  const c1_like = url.searchParams.get('c1_like') || '0';
  const c1_dislike = url.searchParams.get('c1_dislike') || '0';

  // 댓글2
  const c2_name = url.searchParams.get('c2_name') || '';
  const c2_text = url.searchParams.get('c2_text') || '';
  const c2_like = url.searchParams.get('c2_like') || '0';
  const c2_dislike = url.searchParams.get('c2_dislike') || '0';

  // 대댓글2-1
  const c2_1_name = url.searchParams.get('c2_1_name') || '';
  const c2_1_text = url.searchParams.get('c2_1_text') || '';

  // 대댓글2-2
  const c2_2_name = url.searchParams.get('c2_2_name') || '';
  const c2_2_text = url.searchParams.get('c2_2_text') || '';

  // 댓글3
  const c3_name = url.searchParams.get('c3_name') || '';
  const c3_text = url.searchParams.get('c3_text') || '';
  const c3_like = url.searchParams.get('c3_like') || '0';
  const c3_dislike = url.searchParams.get('c3_dislike') || '0';

  // 대댓글3-1
  const c3_1_name = url.searchParams.get('c3_1_name') || '';
  const c3_1_text = url.searchParams.get('c3_1_text') || '';

  // 색상 정의
  const textColor = '#1A6B6B';
  const deletedColor = '#AAAAAA';

  // 댓글 생성 함수
  function createComment(name, text, like, dislike, y, color) {
    if (!name && !text) return '';
    const isDel = text.includes('운영정책 위반으로 삭제된 댓글입니다');
    const displayColor = isDel ? deletedColor : textColor;
    const firstChar = name.charAt(0) || '?';
    
    return `
      <circle cx="95" cy="${y}" r="18" fill="${color}"/>
      <text x="95" y="${y + 5}" fill="white" font-size="13" font-family="'Noto Sans KR', sans-serif" font-weight="700" text-anchor="middle">${firstChar}</text>
      <text x="125" y="${y - 5}" fill="${displayColor}" font-size="15" font-family="'Noto Sans KR', sans-serif" font-weight="700">${name}</text>
      <text x="125" y="${y + 15}" fill="${displayColor}" font-size="11" font-family="'Noto Sans KR', sans-serif" font-weight="400">${text}</text>
      <text x="125" y="${y + 32}" fill="${displayColor}" font-size="6" font-family="'Noto Sans KR', sans-serif" font-weight="400">좋아요 ${like} · 싫어요 ${dislike}</text>
    `;
  }

  // 대댓글 생성 함수
  function createReply(name, text, y, color) {
    if (!name && !text) return '';
    const isDel = text.includes('운영정책 위반으로 삭제된 댓글입니다');
    const displayColor = isDel ? deletedColor : textColor;
    const firstChar = name.charAt(0) || '?';
    
    return `
      <text x="95" y="${y}" fill="${displayColor}" font-size="13" font-family="'Noto Sans KR', sans-serif">↳</text>
      <circle cx="130" cy="${y - 5}" r="15" fill="${color}"/>
      <text x="130" y="${y}" fill="white" font-size="11" font-family="'Noto Sans KR', sans-serif" font-weight="700" text-anchor="middle">${firstChar}</text>
      <text x="155" y="${y - 10}" fill="${displayColor}" font-size="13" font-family="'Noto Sans KR', sans-serif" font-weight="700">${name}</text>
      <text x="155" y="${y + 8}" fill="${displayColor}" font-size="8" font-family="'Noto Sans KR', sans-serif" font-weight="400">${text}</text>
    `;
  }

  // 프로필 색상들
  const colors = ['#5BB5B5', '#808080', '#C27070', '#6B6B6B', '#A0A060', '#2D7070'];

  // 댓글 SVG 생성
  let commentsY = 1470;
  const commentsSvg = `
    ${createComment(c1_name, c1_text, c1_like, c1_dislike, commentsY, colors[0])}
    ${createComment(c2_name, c2_text, c2_like, c2_dislike, commentsY + 80, colors[1])}
    ${createReply(c2_1_name, c2_1_text, commentsY + 150, colors[2])}
    ${createReply(c2_2_name, c2_2_text, commentsY + 200, colors[3])}
    ${createComment(c3_name, c3_text, c3_like, c3_dislike, commentsY + 270, colors[4])}
    ${createReply(c3_1_name, c3_1_text, commentsY + 340, colors[5])}
  `;

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
      <text x="95" y="330" fill="${textColor}" font-size="51" font-family="'Noto Sans KR', sans-serif" font-weight="700">${title}</text>
      
      <!-- 날짜 -->
      <text x="750" y="300" fill="${textColor}" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400">${date}</text>
      
      <!-- 작성 기자 -->
      <text x="750" y="330" fill="${textColor}" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400">작성 기자: ${reporter}</text>
      
      <!-- 본문 -->
      <text x="95" y="420" fill="${textColor}" font-size="21" font-family="'Noto Sans KR', sans-serif" font-weight="400">${content}</text>
      
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
