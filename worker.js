// Hesaplar, oturumlar, öğrenci verisi ve koç programı (KV: YKS). Geri kalan her şey statik dosya.
// KV anahtarları: kul:AD {rol,tuz,hash,koc?,ogrenciler?} · oturum:TOKEN → AD · veri:AD · program:AD
// ponytail: giriş denemesinde hız sınırı yok; kötüye kullanım görülürse /api/giris için Cloudflare rate limiting kuralı ekle.
const AD = /^[a-z0-9_.]{3,24}$/;
const MAX = 1_000_000;
const OTURUM_SN = 180 * 86400;
const enc = new TextEncoder();

const json = (v, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const hata = (mesaj, status = 400) => json({ hata: mesaj }, status);
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const rastgele = n => hex(crypto.getRandomValues(new Uint8Array(n)));

async function hashle(sifre, tuz) {
  const k = await crypto.subtle.importKey("raw", enc.encode(sifre), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(tuz), iterations: 100000 }, k, 256));
}
async function oturumAc(env, ad) {
  const token = rastgele(24);
  await env.YKS.put("oturum:" + token, ad, { expirationTtl: OTURUM_SN });
  return token;
}
const kul = async (env, ad) => AD.test(ad || "") ? env.YKS.get("kul:" + ad, "json") : null;
const kulYaz = (env, ad, k) => env.YKS.put("kul:" + ad, JSON.stringify(k));
const profil = (ad, k) => ({ ad, rol: k.rol, koc: k.koc || null, ogrenciler: k.ogrenciler || [] });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const yol = url.pathname.slice(5).split("/");
    const m = request.method;
    const govde = async () => { try { return await request.json(); } catch { return {}; } };

    if (yol[0] === "kayit" && m === "POST") {
      const { ad: ham, sifre, rol } = await govde();
      const ad = String(ham || "").trim().toLowerCase();
      if (!AD.test(ad)) return hata("Kullanıcı adı 3-24 karakter olmalı: küçük harf, rakam, nokta, alt çizgi.");
      if (typeof sifre !== "string" || sifre.length < 6) return hata("Şifre en az 6 karakter olmalı.");
      if (!["ogrenci", "koc"].includes(rol)) return hata("Rol seçilmedi.");
      if (await env.YKS.get("kul:" + ad)) return hata("Bu kullanıcı adı alınmış.", 409);
      const tuz = rastgele(16);
      const k = { rol, tuz, hash: await hashle(sifre, tuz), ...(rol === "koc" ? { ogrenciler: [] } : {}) };
      await kulYaz(env, ad, k);
      return json({ token: await oturumAc(env, ad), ...profil(ad, k) });
    }
    if (yol[0] === "giris" && m === "POST") {
      const { ad: ham, sifre } = await govde();
      const ad = String(ham || "").trim().toLowerCase();
      const k = await kul(env, ad);
      const ok = k && typeof sifre === "string" &&
        crypto.subtle.timingSafeEqual(enc.encode(await hashle(sifre, k.tuz)), enc.encode(k.hash));
      if (!ok) return hata("Kullanıcı adı ya da şifre yanlış.", 401);
      return json({ token: await oturumAc(env, ad), ...profil(ad, k) });
    }

    // buradan sonrası oturum ister
    const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
    const benAd = /^[a-f0-9]{48}$/.test(token) ? await env.YKS.get("oturum:" + token) : null;
    const ben = benAd && await kul(env, benAd);
    if (!ben) return hata("Oturum yok ya da süresi doldu.", 401);

    if (yol[0] === "cikis" && m === "POST") {
      await env.YKS.delete("oturum:" + token);
      return new Response(null, { status: 204 });
    }
    if (yol[0] === "ben" && m === "GET") return json(profil(benAd, ben));

    // öğrenci koçunu bağlar/kaldırır: {koc:"ad"} ya da {koc:null}
    if (yol[0] === "koc" && m === "PUT") {
      if (ben.rol !== "ogrenci") return hata("Sadece öğrenci koç bağlayabilir.", 403);
      const yeniAd = String((await govde()).koc || "").trim().toLowerCase();
      const yeni = yeniAd && await kul(env, yeniAd);
      if (yeniAd && (!yeni || yeni.rol !== "koc")) return hata("Bu kullanıcı adıyla bir koç bulunamadı.", 404);
      if (ben.koc && ben.koc !== yeniAd) {
        const eski = await kul(env, ben.koc);
        if (eski) { eski.ogrenciler = (eski.ogrenciler || []).filter(x => x !== benAd); await kulYaz(env, ben.koc, eski); }
      }
      if (yeni && !(yeni.ogrenciler || []).includes(benAd)) { yeni.ogrenciler = [...(yeni.ogrenciler || []), benAd]; await kulYaz(env, yeniAd, yeni); }
      if (yeniAd) ben.koc = yeniAd; else delete ben.koc;
      await kulYaz(env, benAd, ben);
      return json(profil(benAd, ben));
    }

    if ((yol[0] === "veri" || yol[0] === "program") && yol[1]) {
      const ogrAd = yol[1], ogr = ogrAd === benAd ? ben : await kul(env, ogrAd);
      if (!ogr || ogr.rol !== "ogrenci") return hata("Öğrenci bulunamadı.", 404);
      const kendisi = ogrAd === benAd, koc = ben.rol === "koc" && ogr.koc === benAd;
      if (!kendisi && !koc) return hata("Bu öğrencinin verisine erişimin yok.", 403);
      const key = yol[0] + ":" + ogrAd;
      if (m === "GET") return new Response((await env.YKS.get(key)) || "null", { headers: { "content-type": "application/json", "cache-control": "no-store" } });
      if (m === "PUT") {
        if (yol[0] === "veri" ? !kendisi : !koc) return hata("Buna yazma iznin yok.", 403);
        const body = await request.text();
        if (body.length > MAX) return hata("Veri çok büyük.", 413);
        try { JSON.parse(body); } catch { return hata("JSON değil."); }
        await env.YKS.put(key, body);
        return new Response(null, { status: 204 });
      }
    }
    return hata("Bulunamadı.", 404);
  },
};
