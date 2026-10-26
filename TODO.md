# MezoBribe — Delivery TODO

## P0 — Bribe marketplace dan epoch aktif

- [ ] **Daftar bribe aktif dan status epoch**
  - Tabel gauge menampilkan pool, DEX, total bribe dalam nilai USD, total vote saat ini, bribe per 1.000 vote, dan perubahan dari epoch sebelumnya.
  - Daftar dapat diurutkan dan difilter berdasarkan DEX, token bribe, dan imbal hasil.
  - Data menampilkan stempel waktu pembaruan terakhir, sumber oracle harga, serta peringatan jika harga tidak tersedia.
  - Status epoch selalu terlihat sebagai terbuka, ditutup, sengketa, atau klaim dibuka.
  - Jika indexer tidak tersedia, UI tetap dapat menampilkan data penting dari adapter kontrak dan memberi peringatan keterbatasan data.

- [ ] **Deposit bribe untuk gauge dan epoch**
  - Briber dapat memilih gauge, epoch target, token, dan jumlah serta melihat pratinjau biaya per vote berdasarkan total vote saat ini.
  - Hanya token allowlist yang diterima; daftar awal adalah MUSD dan MEZO.
  - Deposit memiliki jumlah minimum, hanya diterima sebelum batas tutup epoch, dan penolakan setelah batas menampilkan pesan yang jelas.
  - Briber dapat menambah deposit pada bribe yang sama selama jendela terbuka; penarikan tidak tersedia setelah voting dimulai kecuali gauge dibatalkan.
  - Ringkasan tindakan menyebutkan briber, gauge, epoch, token, jumlah, dan status demo/on-chain tanpa meminta approval veMEZO.

- [ ] **Vote Advisor dengan perhitungan dilusi**
  - Input bobot suara veMEZO dibaca dari adapter dan daftar gauge.
  - Output membagi vote ke gauge, menampilkan estimasi pendapatan per epoch dan estimasi imbal hasil tahunan.
  - Perhitungan memasukkan dilusi dari suara pengguna sendiri dengan rumus `B(g) * v(g) / (V(g) + v(g))`.
  - Pengguna dapat mengunci gauge yang wajib dipilih atau mengecualikan gauge, lalu rekomendasi dihitung ulang.
  - UI menjelaskan alasan singkat untuk setiap alokasi.

- [ ] **Voting satu klik dengan kendali pengguna**
  - UI membentuk satu ringkasan transaksi voting ke kontrak gauge Mezo sesuai alokasi yang disetujui pengguna.
  - Sebelum tanda tangan, UI menampilkan gauge, persentase, peringatan jika pengguna sudah vote, dan peringatan jika jendela hampir tutup.
  - UI tidak pernah meminta approval transfer atas NFT atau lock veMEZO.
  - Mode demo menandai simulasi secara eksplisit; mode live tidak mengarang alamat kontrak atau bukti transaksi.

- [ ] **Klaim bribe dan riwayat**
  - Bagian voter dihitung sebagai bobot vote voter dibagi total bobot gauge, dikali total bribe gauge/token.
  - Klaim hanya dapat dilakukan sekali per voter, gauge, epoch, dan token.
  - Satu tindakan dapat mengklaim banyak gauge dan epoch sekaligus.
  - Pembulatan ke bawah dan sisa dust dicatat secara transparan.
  - UI menampilkan klaim tersedia, CTA klaim semua, status root, dan riwayat klaim.

## P1 — Transparansi, briber workspace, dan verifikasi

- [ ] **Penutupan epoch dan verifikasi root**
  - Panel verifikasi menampilkan hash Merkle root per epoch, tautan data bukti, formula bagian voter, dan instruksi menjalankan ulang skrip.
  - Model status mendukung penutupan, sengketa, dan pembukaan klaim.
  - Keeper/open-source calculation boundary didokumentasikan; root live hanya ditampilkan bila sumber terverifikasi.

- [ ] **Halaman briber**
  - Menampilkan daftar bribe milik briber, status per epoch, biaya per vote efektif, dan perbandingan dengan rata-rata pasar.
  - Menampilkan pratinjau dampak jika briber menambah jumlah tertentu, berdasarkan imbal hasil voter saat ini.

- [~] **Penanganan gauge tidak valid**
  - [x] Adapter Solidity `MezoGaugeAdapter` membaca status dari `VeBTCVoter` resmi dan menerima pool key maupun gauge address.
  - [x] Adapter `0x9E3439387B685FD4731Fdc7b3382B3348C03998a` telah dideploy dan dipasang di BribeMarket; transaksi deploy dan `setGaugeAdapter` tercatat pada blok `16379346`.
  - [x] RPC mengonfirmasi `isGaugeValid(pool)` dan `isGaugeValid(gauge)` untuk pool MUSD/BTC serta MUSD/mUSDC; runtime bytecode cocok dengan artifact workspace setelah normalisasi immutable voter.
  - [x] Unit test mencakup resolusi pool-ke-gauge, gauge langsung, mapping kosong, gauge mati, dan hasil resolver yang bukan gauge terdaftar.
  - [x] Model UI menyediakan keadaan gauge dibatalkan dan menjelaskan bahwa refund hanya berlaku untuk gauge yang tidak valid.
  - [ ] Uji end-to-end transaksi refund live untuk epoch/gauge yang benar-benar tidak valid belum dilakukan.

## Non-fungsional dan submission

- [ ] Antarmuka bawaan berbahasa Inggris, siap dilokalkan, dapat dinavigasi keyboard, dan memiliki kontras memadai.
- [ ] Istilah epoch, gauge, dan dilusi memiliki tooltip atau penjelasan singkat.
- [ ] Angka penting memiliki tautan ke transaksi atau kontrak explorer bila tersedia; data demo tidak dipresentasikan sebagai data on-chain.
- [ ] README memuat masalah, solusi, arsitektur, cara menjalankan, model ancaman, batasan jujur, rumus Advisor, dan pemetaan kriteria.
- [x] Adapter Mezo dipisahkan agar perubahan antarmuka gauge hanya memengaruhi boundary adapter; kontrak, skrip deployment, dan konfigurasi testnet on-chain selesai. Deployment mainnet, audit, dan uji refund live tetap pekerjaan terpisah.
- [ ] Unit checks Advisor memverifikasi total alokasi, pengecualian gauge, dan perilaku dilusi.
- [ ] Route manifest mencakup seluruh route halaman aplikasi.
- [ ] Konfigurasi proyek memiliki `logoUrl` literal HTTPS sebelum checkpoint.
