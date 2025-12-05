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
    const y = 230 + (i * 20);
    relationLines += `<text x="230" y="${y}" fill="white" font-size="14" font-family="sans-serif">${chars[i]} | ${emojis[i] || '?'} | ${relations[i] || '???'}</text>`;
  }

  const bgUrl = url.origin + '/status-bg.png';
  const bgResponse = await fetch(bgUrl);
  const bgBuffer = await bgResponse.arrayBuffer();
  const bgBase64 = btoa(String.fromCharCode(...new Uint8Array(bgBuffer)));

  const svg = `
    <svg width="1000" height="426" xmlns="http://www.w3.org/2000/svg">
      <image href="data:image/png;base64,${bgBase64}" width="1000" height="426"/>
      <text x="45" y="110" fill="white" font-size="22" font-family="sans-serif">${location}</text>
      <text x="327" y="110" fill="white" font-size="22" font-family="sans-serif">${date}</text>
      <text x="472" y="110" fill="white" font-size="22" font-family="sans-serif">${time}</text>
      <text x="620" y="110" fill="white" font-size="22" font-family="sans-serif">${job}</text>
      <text x="110" y="265" fill="white" font-size="30" font-weight="bold" font-family="sans-serif" text-anchor="middle">${factionDisplay}</text>
      <text x="110" y="295" fill="white" font-size="14" font-family="sans-serif" text-anchor="middle">${ability}</text>
      ${relationLines}
      <text x="230" y="390" fill="white" font-size="14" font-family="sans-serif">${incident}</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
