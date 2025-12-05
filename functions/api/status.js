import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

let wasmInitialized = false;

export async function onRequest(context) {
  const url = new URL(context.request.url);

  const location = url.searchParams.get('location') || '???';
  const date = url.searchParams.get('date') || 'MM/DD';
  const time = url.searchParams.get('time') || 'HH:MM';
  const job = url.searchParams.get('job') || '???';
  let faction = url.searchParams.get('faction') || '???';
  const ability = url.searchParams.get('ability') || '???';
  const char = url.searchParams.get('char') || '???';
  const emoji = url.searchParams.get('emoji') || '?';
  const relation = url.searchParams.get('relation') || '???';
  const incident = url.searchParams.get('incident') || '???';

  const factionDisplay = faction === 'ETERNAL ARKIVE' ? 'ETERNAL\nARKIVE' : faction;

  const chars = char.split('.');
  const emojis = emoji.split('.');
  const relations = relation.split('.');

  const baseUrl = url.origin;

  const fontData = await fetch(baseUrl + '/fonts/ssaragnun.otf').then(res => res.arrayBuffer());
  const bgImageData = await fetch(baseUrl + '/status-bg.png').then(res => res.arrayBuffer());
  const bgBase64 = 'data:image/png;base64,' + btoa(String.fromCharCode(...new Uint8Array(bgImageData)));

  const relationItems = chars.map((c, i) => ({
    type: 'div',
    props: {
      style: { display: 'flex' },
      children: c + ' | ' + (emojis[i] || '?') + ' | ' + (relations[i] || '???')
    }
  }));

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'Ssaragnun',
        },
        children: [
          {
            type: 'img',
            props: {
              src: bgBase64,
              style: { position: 'absolute', width: '100%', height: '100%' }
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '45px', top: '110px', color: 'white', fontSize: '22px', display: 'flex' },
              children: location
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '327px', top: '110px', color: 'white', fontSize: '22px', display: 'flex' },
              children: date
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '472px', top: '110px', color: 'white', fontSize: '22px', display: 'flex' },
              children: time
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '620px', top: '110px', color: 'white', fontSize: '22px', display: 'flex' },
              children: job
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '15px', top: '250px', width: '190px', color: 'white', fontSize: '30px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-wrap' },
              children: factionDisplay
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '15px', top: '295px', width: '190px', color: 'white', fontSize: '14px', display: 'flex', justifyContent: 'center', textAlign: 'center' },
              children: ability
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '230px', top: '215px', color: 'white', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' },
              children: relationItems
            }
          },
          {
            type: 'div',
            props: {
              style: { position: 'absolute', left: '230px', top: '375px', color: 'white', fontSize: '14px', display: 'flex' },
              children: incident
            }
          }
        ]
      }
    },
    {
      width: 1000,
      height: 426,
      fonts: [
        {
          name: 'Ssaragnun',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  );

  if (!wasmInitialized) {
    await initWasm();
    wasmInitialized = true;
  }

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1000 },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60',
    },
  });
    }
