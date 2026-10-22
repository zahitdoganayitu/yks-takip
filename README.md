# YKS Çalışma Takip

TYT ve AYT konularını takip etmek için tek dosyalık web uygulaması. Kurulum yok, sunucu yok — tarayıcıda çalışır, veriler cihazın kendi tarayıcısında (localStorage) saklanır.

Cloudflare Workers üzerinden yayınlanır: https://yks-takip.doganaym22.workers.dev — güncellemek için `npx wrangler deploy`, yerel deneme için `npx wrangler dev`.

## Ne yapar

- **Bugün** — koçun haftalık programı (hedef/yapılan ilerlemesi, ▶ ile sayacı başlatma), çalışma sayacı (sayfa kapansa da akar), çalışma kaydı (ders, konu, süre, soru), gün gün geçmiş.
- **Konular** — TYT/AYT konu listesi. Her konu için: kaç kez çalıştın, kaç test çözdün, konuyu ne kadar öğrendiğini düşünüyorsun (0–100%).
- **İstatistik** — genel ilerleme halkası, ders bazlı öğrenme grafiği, 12 haftalık çalışma ısı haritası, TYT/AYT karşılaştırması.
- **Denemeler** — deneme sınavı ekle, ders bazlı doğru/yanlış gir, net otomatik hesaplanır (D − Y/4), net trend grafiği.
- **Ayarlar** — hedef üniversite/bölüm, konu ekleme/silme, JSON yedek alma ve geri yükleme.

Bilinçli olarak **geri sayım / kalan gün sayacı yok** — takip aracı, stres kaynağı değil.

## Kullanım

Canlı adresi aç, ya da `index.html` dosyasını indirip çift tıkla. İkisi de aynı şekilde çalışır.

## Veri

Veriler cihazda tutulur ve hesaba senkron edilir (çevrimdışıyken de çalışır, internet gelince gönderir). Elle yedek için: **Ayarlar → Yedek indir / Geri yükle**.

### Hesap ve koç

Uygulama kullanıcı adı + şifreyle açılır (öğrenci ya da koç hesabı). Öğrencinin verisi hesabına senkron olur; hangi cihaz/tarayıcı olursa olsun giriş yapınca gelir. Öğrenci **Ayarlar → Hesap** kısmına koçunun kullanıcı adını yazar; koç o öğrencinin her şeyini görür ve **Bugün** sekmesinde haftalık program yazar. Sunucu `worker.js`, veri Cloudflare KV'de (`YKS` binding), şifreler PBKDF2 ile saklanır.

## Teknik

Tek `index.html` — vanilla JS + CSS, bağımlılık ve build adımı yok. Grafikler elle çizilmiş SVG. Koyu/açık tema otomatik, mobil öncelikli.
