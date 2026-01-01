export async function onRequest(context) {
  const url = new URL(context.request.url);

  const location = url.searchParams.get('location') || '???';
  const date = url.searchParams.get('date') || 'MM/DD';
  const time = url.searchParams.get('time') || 'HH:MM';
  const faction = url.searchParams.get('faction') || '???';
  const occupation = url.searchParams.get('occupation') || '???';
  const ability = url.searchParams.get('ability') || '???';
  const incident = url.searchParams.get('incident') || '???';
  const char = url.searchParams.get('char') || '???';
  const emoji = url.searchParams.get('emoji') || '?';
  const relation = url.searchParams.get('relation') || '???';

  const chars = char.split('.');
  const emojis = emoji.split('.');
  const relations = relation.split('.');

  // 관계 텍스트 (두 열)
  let relationLines = '';
  for (let i = 0; i < chars.length; i++) {
    let x, y;
    if (i < 7) {
      x = 578;
      y = 350 + (i * 22);
    } else {
      x = 798;
      y = 350 + ((i - 7) * 22);
    }
    const charName = chars[i].length > 6 ? chars[i].substring(0, 6) + '..' : chars[i];
    const rel = (relations[i] || '???').length > 10 ? (relations[i] || '???').substring(0, 8) + '..' : (relations[i] || '???');
    relationLines += `<text x="${x}" y="${y}" fill="white" font-size="17" font-family="'Noto Sans KR', sans-serif" font-weight="400">${charName} | ${emojis[i] || '?'} | ${rel}</text>`;
  }

  // 배경 이미지 로드
  const bgUrl = url.origin + '/status-bg.png';
  const bgResponse = await fetch(bgUrl);
  const bgBuffer = await bgResponse.arrayBuffer();
  const bgBase64 = btoa(String.fromCharCode(...new Uint8Array(bgBuffer)));

  const svg = `
    <svg width="1024" height="512" viewBox="0 0 1024 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&amp;display=swap');
        </style>
      </defs>
      
      <!-- 배경 이미지 -->
      <image href="data:image/png;base64,${bgBase64}" width="1024" height="512"/>
      
      <!-- 왼쪽 상단: LOC, DATE, TIME -->
      <text x="125" y="55" fill="white" font-size="19" font-family="'Noto Sans KR', sans-serif" font-weight="400">${location}</text>
      <text x="125" y="81" fill="white" font-size="19" font-family="'Noto Sans KR', sans-serif" font-weight="400">${date}</text>
      <text x="125" y="107" fill="white" font-size="19" font-family="'Noto Sans KR', sans-serif" font-weight="400">${time}</text>
      
      <!-- 왼쪽 박스: FACTION -->
      <text x="145" y="258" fill="white" font-size="27" font-family="'Noto Sans KR', sans-serif" font-weight="700" text-anchor="middle">${faction}</text>
      
      <!-- 오른쪽 상단: OCCUPATION, ABILITY, INCIDENT -->
      <text x="605" y="77" fill="white" font-size="19" font-family="'Noto Sans KR', sans-serif" font-weight="400">${occupation}</text>
      <text x="605" y="132" fill="white" font-size="19" font-family="'Noto Sans KR', sans-serif" font-weight="400">${ability}</text>
      <text x="605" y="187" fill="white" font-size="18" font-family="'Noto Sans KR', sans-serif" font-weight="400">${incident}</text>      
      <!-- 오른쪽 하단: RELATIONSHIP -->
      ${relationLines}
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
