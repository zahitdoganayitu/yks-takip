// /api/veri ve /api/program: öğrenci verisi ve koç programı için KV deposu. Geri kalan her şey statik dosya.
// ponytail: erişim sadece tahmin edilemez koda dayanır, rate limit yok; kötüye kullanım görülürse Cloudflare WAF kuralı ekle.
const KOD = /^[a-z0-9]{24,64}$/;
const MAX = 1_000_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/api\/(veri|program)$/);
    if (!m) return env.ASSETS.fetch(request);
    const tur = m[1], k = url.searchParams.get("k") || "";
    if (!KOD.test(k)) return new Response("geçersiz istek", { status: 400 });

    if (request.method === "GET") {
      const v = await env.YKS.get(tur + ":" + k);
      return new Response(v || "null", { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
    if (request.method === "PUT") {
      const body = await request.text();
      if (body.length > MAX) return new Response("çok büyük", { status: 413 });
      try { JSON.parse(body); } catch { return new Response("JSON değil", { status: 400 }); }
      await env.YKS.put(tur + ":" + k, body);
      return new Response(null, { status: 204 });
    }
    if (request.method === "DELETE") {
      await Promise.all([env.YKS.delete("veri:" + k), env.YKS.delete("program:" + k)]);
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 405 });
  },
};
