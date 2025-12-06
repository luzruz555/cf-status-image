export async function onRequest(context) {
  const url = new URL(context.request.url);

  const location = url.searchParams.get('location') || '???';
  const date = url.searchParams.get('date') || 'MM/DD';
  const time = url.searchParams.get('time') || 'HH:MM';
  const job = url.searchParams.get('job') || '???';
  const faction = url.searchParams.get('faction') || '???';
  const ability = url.searchParams.get('ability') || '???';
  const char = url.searchParams.get('char') || '???';
  const emoji = url.searchParams.get('emoji') || '?';
  const relation = url.searchParams.get('relation') || '???';
  const incident = url.searchParams.get('incident') || '???';

  const factionDisplay = faction === 'ETERNAL ARKIVE' ? 'ETERNAL ARKIVE' : faction;

  const chars = char.split('.');
  const emojis = emoji.split('.');
  const relations = relation.split('.');

  let relationLines = '';
  for (let i = 0; i < chars.length; i++) {
    let x, y;
    if (i < 5) {
      x = 460;
      y = 460 + (i * 40);
    } else {
      x = 870;
      y = 460 + ((i - 5) * 40);
    }
    relationLines += `<text x="${x}" y="${y}" fill="white" font-size="28" font-family="'Noto Sans KR', sans-serif" font-weight="200">${chars[i]} | ${emojis[i] || '?'} | ${relations[i] || '???'}</text>`;
  }

  const bgUrl = url.origin + '/status-bg.png';
  const bgResponse = await fetch(bgUrl);
  const bgBuffer = await bgResponse.arrayBuffer();
  const bgBase64 = btoa(String.fromCharCode(...new Uint8Array(bgBuffer)));

  const svg = `
    <svg width="2000" height="852" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@200;700&amp;display=swap');
        </style>
      </defs>
      <image href="data:image/png;base64,${bgBase64}" width="2000" height="852"/>
      <text x="58" y="240" fill="white" font-size="44" font-family="'Noto Sans KR', sans-serif" font-weight="200">${location}</text>
      <text x="654" y="240" fill="white" font-size="44" font-family="'Noto Sans KR', sans-serif" font-weight="200">${date}</text>
      <text x="949" y="240" fill="white" font-size="44" font-family="'Noto Sans KR', sans-serif" font-weight="200">${time}</text>
      <text x="1245" y="240" fill="white" font-size="44" font-family="'Noto Sans KR', sans-serif" font-weight="200">${job}</text>
      <text x="220" y="520" fill="white" font-size="60" font-family="'Noto Sans KR', sans-serif" font-weight="700" text-anchor="middle">${factionDisplay}</text>
      <text x="220" y="594" fill="white" font-size="30" font-family="'Noto Sans KR', sans-serif" font-weight="200" text-anchor="middle">${ability}</text>
      ${relationLines}
      <text x="460" y="775" fill="white" font-size="35" font-family="'Noto Sans KR', sans-serif" font-weight="200">${incident}</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
