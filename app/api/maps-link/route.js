// Abre un link corto de Google Maps (maps.app.goo.gl/…) y devuelve el link largo al que lleva.
// El navegador no puede hacerlo solo (Google no lo permite desde otra página), por eso va aquí.
// Solo acepta links cortos de Google y solo sigue redirecciones a dominios de Google.

const START_HOSTS = ["maps.app.goo.gl", "goo.gl", "g.co"];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

function isGoogleHost(host) {
  return (
    START_HOSTS.includes(host) ||
    /(^|\.)google\.[a-z.]+$/i.test(host) ||
    /(^|\.)goo\.gl$/i.test(host)
  );
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("u") || "";
  let current;
  try {
    current = new URL(raw);
  } catch {
    return Response.json({ error: "Link no válido." }, { status: 400 });
  }
  if (current.protocol !== "https:" || !START_HOSTS.includes(current.hostname.replace(/^www\./, ""))) {
    return Response.json({ error: "Solo se abren links cortos de Google Maps (maps.app.goo.gl)." }, { status: 400 });
  }

  try {
    // Sigue hasta 6 redirecciones, siempre dentro de Google
    for (let i = 0; i < 6; i++) {
      const res = await fetch(current, {
        redirect: "manual",
        headers: { "user-agent": UA, "accept-language": "es-MX,es;q=0.9" },
        signal: AbortSignal.timeout(8000),
      });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, current);
        if (!isGoogleHost(next.hostname)) break;
        current = next;
        continue;
      }
      // Ya llegó: si el link largo no trae el lugar, se busca dentro de la página
      let pageFeature = null;
      let pagePlaceId = null;
      if (!/0x[0-9a-f]+:0x[0-9a-f]+|ChIJ[\w-]{20,}/i.test(decodeURIComponent(current.href)) && res.ok) {
        const html = (await res.text()).slice(0, 2_000_000);
        pageFeature = /(0x[0-9a-f]{6,16}:0x[0-9a-f]{6,16})/i.exec(html)?.[1] || null;
        pagePlaceId = /(ChIJ[\w-]{20,})/.exec(html)?.[1] || null;
      }
      return Response.json({ url: current.href, pageFeature, pagePlaceId });
    }
    return Response.json({ url: current.href });
  } catch (err) {
    console.error("maps-link:", err);
    return Response.json({ error: "No se pudo abrir el link corto. Intenta con el link completo." }, { status: 502 });
  }
}
