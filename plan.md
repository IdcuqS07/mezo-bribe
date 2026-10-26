# Rencana Implementasi MezoBribe

## Ringkasan pendekatan

MezoBribe akan dibangun sebagai aplikasi web dashboard-first untuk demo hackathon: pengguna dapat memahami epoch aktif, membandingkan bribe, menerima rekomendasi alokasi vote, meninjau ringkasan transaksi, dan mengikuti alur klaim dari satu tempat. Karena PRD sendiri menetapkan beberapa hal yang masih harus diverifikasi—alamat kontrak, ABI gauge Mezo, sumber oracle, dan mode snapshot—versi pertama akan memisahkan data demo dan adapter jaringan dari UI. UI tetap fungsional dengan dataset epoch yang deterministik dan kalkulator advisor yang nyata, tetapi tidak akan menyamarkan data simulasi sebagai transaksi on-chain. Semua status demo akan diberi label yang jelas dan struktur adapter akan siap dihubungkan ke kontrak testnet chain ID 31611 setelah alamat/ABI dikonfirmasi.

Prioritas implementasi adalah P0 yang paling mudah didemokan: daftar bribe aktif, deposit bribe, Vote Advisor dengan dilusi, ringkasan voting satu tanda tangan, dan klaim massal. Halaman Briber, Verifikasi, status epoch, serta transparansi formula akan ikut dibangun karena membantu juri memahami produk end-to-end. P1 keeper/Merkle akan direpresentasikan lewat panel verifikasi dan model data bukti; publikasi root live menunggu kontrak dan data snapshot terverifikasi. Auto-voter P2 dan notifikasi eksternal tidak akan dipura-purakan sebagai fitur live.

## Ruang lingkup pengalaman

- **Market Home (`/`)**: status epoch berjalan, countdown, total bribe, jumlah gauge berinsentif, filter DEX/token/hasil, pengurutan tabel, dan tautan explorer.
- **Gauge Detail (`/gauge/:id`)**: bribe per token, biaya per vote, perubahan epoch sebelumnya, preview deposit, dan CTA deposit.
- **Vote Advisor (`/advisor`)**: bobot veMEZO, alokasi water-filling yang memperhitungkan dilusi, estimasi hasil epoch/APY, lock/exclude gauge, alasan per alokasi, dan ringkasan voting.
- **Claims (`/claims`)**: klaim tersedia, klaim semua, status root, dust, riwayat klaim, dan tautan bukti.
- **Briber (`/briber`)**: bribe milik wallet, status epoch, biaya efektif, perbandingan pasar, dan dampak penambahan deposit.
- **Verification (`/verify`)**: hash root, data bukti, formula bagian voter, sumber data, dan instruksi reproduce.

Navigasi memakai routing client-side ringan agar URL dan route manifest tetap eksplisit. Semua layar memakai status epoch yang konsisten: Open, Voting closed, Dispute, dan Claims open.

## Arsitektur teknis

- **Frontend**: React + TypeScript + Vite, dengan CSS modular berbasis custom properties untuk visual yang konsisten dan responsif.
- **State demo**: store React sederhana dengan data seed deterministik; aksi deposit, lock/exclude, vote, dan claim memperbarui state lokal agar alurnya bisa dicoba tanpa wallet.
- **Domain layer**: `src/domain/types.ts` untuk model gauge/bribe/epoch/claim; `src/domain/advisor.ts` untuk rumus pendapatan dan water-filling; `src/domain/format.ts` untuk angka dan address; `src/domain/fixtures.ts` untuk data demo.
- **Chain boundary**: `src/adapters/mezoGaugeAdapter.ts` mendefinisikan antarmuka baca untuk status gauge, total vote, veMEZO weight, dan epoch. Adapter demo menjadi default; adapter live akan menerima konfigurasi alamat/ABI tanpa mengubah komponen UI.
- **Actions boundary**: `src/adapters/wallet.ts` menangani connect wallet dan ringkasan tanda tangan secara aman. Versi demo tidak meminta approval veMEZO dan menandai transaksi simulasi dengan jelas.
- **Presentation**: `src/components/` untuk AppShell, status pills, metric cards, tables, advisor controls, modals, dan empty/error states; `src/pages/` untuk setiap route.
- **Static contract**: `public/manus-routes.json` mendeklarasikan semua route halaman dan disinkronkan setiap kali route berubah.
- **Docs**: `README.md` menjelaskan masalah, arsitektur, mode demo, rumus, batasan integrasi, dan cara menjalankan ulang kalkulator; `TODO.md` menyimpan outcome dan kriteria penerimaan lengkap dari PRD.

## Model perhitungan Advisor

Untuk setiap gauge, model memakai `B(g)` sebagai nilai bribe USD dan `V(g)` sebagai vote yang sudah ada. Pendapatan kandidat dihitung sebagai `B(g) * v(g) / (V(g) + v(g))`. Alokasi awal dilakukan dengan iterasi water-filling berbasis pendapatan marjinal `B(g) * V(g) / (V(g) + v(g))^2`, menghormati gauge yang dikunci dan gauge yang dikecualikan. Hasil menampilkan total estimasi per epoch, annualized estimate berdasarkan 365/epochDays, dan penjelasan singkat yang mengacu pada bribe, kompetisi, serta efek dilusi. Fungsi akan memiliki unit checks untuk jumlah alokasi sama dengan bobot veMEZO dan tidak mengalokasikan ke gauge yang dikecualikan.

## Keputusan dan batasan integrasi

- Target jaringan pada UI: Mezo testnet `31611`; mainnet `31612` dicantumkan sebagai target kompatibilitas.
- Token allowlist awal: MUSD dan MEZO.
- Harga USD pada fixture demo diberi label sebagai oracle reference; UI menampilkan warning bila harga tidak tersedia.
- Tidak ada klaim alamat kontrak, bukti transaksi, atau root Merkle live yang belum diberikan/verifikasi.
- Tidak ada custody atau approval NFT/lock veMEZO; CTA hanya menampilkan tindakan vote yang akan ditandatangani.
- Kontrak belum diaudit dan estimasi bukan jaminan—keduanya terlihat di UI dan README.

## Desain

### Tiga arah alternatif

1. **Editorial dark DeFi terminal** — panel gelap seperti terminal pasar dengan aksen chartreuse yang tajam dan tipografi editorial. *(probabilitas 0,07)*
2. **Neon cyberpunk liquidity lab** — permukaan hitam dengan glow cyan-magenta, lebih eksperimental dan teatrikal. *(probabilitas 0,04)*
3. **Warm fintech observatory** — latar krem hangat, kartu putih, dan aksen biru tua yang terasa seperti riset finansial. *(probabilitas 0,08)*

### Arah terpilih: Editorial dark DeFi terminal

- **Design movement**: editorial data-dense interface bertemu terminal trading modern; fokus pada hirarki informasi, bukan dekorasi.
- **Core principles**: transparansi sebelum persuasi; satu CTA utama per layar; data penting selalu dekat dengan konteks on-chain; setiap angka dapat ditelusuri.
- **Color philosophy**: charcoal `#121416` menjadi kanvas tenang untuk data; chartreuse `#D8F56A` adalah signature color yang menandai peluang dan tindakan; cyan muted `#79D3D6` menandai data jaringan; amber `#F5B95B` menyatakan perhatian; merah koral hanya untuk risiko/error.
- **Layout paradigm**: split-pane editorial dengan rail navigasi tipis, headline besar di kiri, dan panel data berlapis di kanan; tabel melebar seperti lembar pasar dan detail muncul sebagai drawer/modal, bukan tumpukan kartu simetris.
- **Signature elements**: garis grid halus seperti kertas kalkulasi, pill epoch dengan titik status aktif, dan highlight chartreuse berbentuk bracket pada angka peluang terbaik.
- **Interaction philosophy**: interaksi terasa seperti memeriksa pasar, bukan mengisi formulir; filter langsung memperkecil noise, hover/focus mengungkap alasan, dan tindakan berisiko selalu didahului ringkasan yang mudah dibaca.
- **Animation**: entry halaman berupa fade/translate pendek; angka metric count-up hanya sekali; bar alokasi mengisi dengan easing lembut; tidak ada animasi berulang yang mengganggu pembacaan atau aksesibilitas reduced-motion.
- **Typography system**: `Space Grotesk` untuk judul dan angka besar, `DM Sans` untuk body/UI, dan `IBM Plex Mono` untuk address, chain ID, hash, dan formula.
- **Brand essence**: “Vote smarter, route deeper liquidity.” Ditujukan untuk voter dan briber Mezo yang membutuhkan pasar insentif transparan. Kepribadian: tajam, terbuka, operator-minded.
- **Brand voice**: headline berbicara langsung dan faktual; CTA singkat tanpa hype. Contoh: “Put your veMEZO to work.” dan “Every vote has a clearing price.”
- **Wordmark & logo**: wordmark `MezoBribe` dengan bracket terbuka di antara “Mezo” dan “Bribe”, menggambarkan pasar yang mempertemukan dua sisi; ikon kecil berupa dua kurung siku yang saling mengunci.
- **Signature brand color**: chartreuse `#D8F56A`, dipakai hemat untuk peluang terbaik, CTA utama, dan fokus keyboard.

## Struktur proyek

```text
/Users/idcuq/Documents/Mezo Bribe/
├── public/
│   ├── manus-routes.json
│   └── favicon.svg
├── src/
│   ├── adapters/
│   ├── components/
│   ├── domain/
│   ├── pages/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── tests/
│   └── advisor.test.ts
├── app.config.ts
├── index.html
├── package.json
├── README.md
├── TODO.md
└── plan.md
```

## Alur build dan delivery

1. Siapkan package dan toolchain Vite/React/TypeScript, lalu daftarkan diagnostics TypeScript sebelum batch kode pertama.
2. Bangun domain model dan advisor terlebih dahulu agar UI memakai rumus yang teruji.
3. Bangun AppShell, route pages, seeded state, responsive CSS, serta route manifest.
4. Tambahkan README/TODO dan konfigurasi logo metadata; jangan menambahkan secret atau alamat kontrak fiktif.
5. Jalankan diagnostics, unit test, production build, verifikasi HTTP root dan `/manus-routes.json`, lalu perbaiki issue yang ditemukan.
6. Jalankan dev server pada port sesi yang dideklarasikan dan serahkan workspace/Preview untuk dicoba. Publikasi tidak dilakukan otomatis karena belum diminta.
