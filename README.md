# YKS Çalışma Takip

TYT ve AYT konularını takip etmek için tek dosyalık web uygulaması. Kurulum yok, sunucu yok — tarayıcıda çalışır, veriler cihazın kendi tarayıcısında (localStorage) saklanır.

Cloudflare Workers üzerinden yayınlanır: https://yks-takip.doganaym22.workers.dev — güncellemek için `npx wrangler deploy`, yerel deneme için `npx wrangler dev`.

## Ne yapar

- **Bugün** — çalışma sayacı (sayfa kapansa da akar), günlük çalışma kaydı (ders, konu, süre, soru), gün gün çalışma geçmişi, koçun programı.
- **Konular** — TYT/AYT konu listesi. Her konu için: kaç kez çalıştın, kaç test çözdün, konuyu ne kadar öğrendiğini düşünüyorsun (0–100%).
- **İstatistik** — genel ilerleme halkası, ders bazlı öğrenme grafiği, 12 haftalık çalışma ısı haritası, TYT/AYT karşılaştırması.
- **Denemeler** — deneme sınavı ekle, ders bazlı doğru/yanlış gir, net otomatik hesaplanır (D − Y/4), net trend grafiği.
- **Ayarlar** — hedef üniversite/bölüm, konu ekleme/silme, JSON yedek alma ve geri yükleme.

Bilinçli olarak **geri sayım / kalan gün sayacı yok** — takip aracı, stres kaynağı değil.

## Kullanım

Canlı adresi aç, ya da `index.html` dosyasını indirip çift tıkla. İkisi de aynı şekilde çalışır.

## Veri

Veriler tarayıcıya kaydedilir, hiçbir yere gönderilmez. Başka bir cihaza taşımak için: **Ayarlar → Yedek indir**, diğer cihazda **Geri yükle**.

> Not: Aynı adresi farklı tarayıcı veya cihazda açarsan veriler ayrı olur.

### Koç bağlantısı

Öğrenci **Ayarlar → Koç bağlantısı → Koçla paylaşmayı aç** der, çıkan bağlantıyı koça gönderir. Koç bağlantıyı açınca öğrencinin verisini salt okunur görür ve **Bugün** sekmesinden program yazar. Veri `worker.js` üzerinden Cloudflare KV'de (`YKS` binding), tahmin edilemez bir kodla saklanır; öğrenci paylaşımı kapatınca silinir.

## Teknik

Tek `index.html` — vanilla JS + CSS, bağımlılık ve build adımı yok. Grafikler elle çizilmiş SVG. Koyu/açık tema otomatik, mobil öncelikli.
