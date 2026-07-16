// ============================================
// 0. AMBIL DATA DARI data/kecamatan.json
// Ini bagian utamanya: JS mengambil ("fetch") isi file JSON,
// lalu memasukkan datanya ke elemen-elemen HTML yang ber-id.
// ============================================
async function muatDataKecamatan() {
  try {
    const response = await fetch('data/kecamatan.json');
    if (!response.ok) throw new Error('File data tidak ditemukan');
    const data = await response.json();
    renderHalaman(data);
  } catch (error) {
    console.error('Gagal memuat data kecamatan:', error);
    document.getElementById('heroTitle').textContent = 'Data belum diisi';
    document.getElementById('heroDesc').textContent =
      'Lengkapi file data/kecamatan.json untuk menampilkan profil kecamatan.';
  }
}

function renderHalaman(data) {
  const nama = data.profil.namaKecamatan || '(Nama kecamatan belum diisi)';

  // --- Navbar & footer brand ---
  document.getElementById('navbarBrand').textContent = 'Kec. ' + nama;
  document.getElementById('footerBrand').textContent = 'Kec. ' + nama;

  // --- Hero ---
  document.getElementById('heroEyebrow').textContent = data.profil.eyebrow || '';
  document.title = 'Kecamatan ' + nama + ' — Profil Wilayah';
  document.getElementById('heroTitle').innerHTML = 'Kecamatan<br>' + nama;
  document.getElementById('heroDesc').textContent = data.profil.deskripsiSingkat || '';

  // --- Sejarah / Timeline ---
  const timelineContainer = document.getElementById('timelineContainer');
  timelineContainer.innerHTML = '';
  (data.sejarah || []).forEach((item) => {
    const div = document.createElement('div');
    div.className = 'timeline__item';
    div.innerHTML = `
      <span class="timeline__year">${item.tahun || ''}</span>
      <p>${item.keterangan || ''}</p>
    `;
    timelineContainer.appendChild(div);
  });

  // --- Statistik (angka target diisi, animasi jalan lewat observer di bawah) ---
  const s = data.statistik || {};
  document.getElementById('statPenduduk').dataset.target = s.jumlahPenduduk || 0;
  document.getElementById('statDesa').dataset.target = s.jumlahDesaKelurahan || 0;
  document.getElementById('statLuas').dataset.target = s.luasWilayahKm2 || 0;
  document.getElementById('statSungai').dataset.target = s.jumlahSungaiUtama || 0;

  // --- Batas wilayah ---
  const bw = data.batasWilayah || {};
  const batasList = document.getElementById('batasWilayahList');
  batasList.innerHTML = `
    <li>Utara — ${bw.utara || '-'}</li>
    <li>Selatan — ${bw.selatan || '-'}</li>
    <li>Timur — ${bw.timur || '-'}</li>
    <li>Barat — ${bw.barat || '-'}</li>
  `;

  // --- Mata pencaharian ---
  const mpList = document.getElementById('mataPencaharianList');
  mpList.innerHTML = '';
  (data.mataPencaharian || []).forEach((item) => {
    if (!item) return;
    const li = document.createElement('li');
    li.textContent = item;
    mpList.appendChild(li);
  });

  // --- Peta ---
  if (data.peta && data.peta.embedUrl) {
    document.getElementById('mapFrame').src = data.peta.embedUrl;
  }

  // --- Footer kontak ---
  const k = data.kontak || {};
  document.getElementById('footerAlamat').textContent = k.alamatKantor || '';
  document.getElementById('footerKontak').textContent =
    [k.telepon, k.email].filter(Boolean).join(' · ');
  document.getElementById('footerJamLayanan').textContent = k.jamLayanan || '';
  document.getElementById('footerCopy').textContent =
    '© ' + new Date().getFullYear() + ' Pemerintah Kecamatan ' + nama + '.';

  // Setelah data masuk ke DOM, baru aktifkan animasi angka statistik
  aktifkanAnimasiStatistik();
}

muatDataKecamatan();

// ============================================
// 1. MENU MOBILE
// Menampilkan/menyembunyikan menu saat tombol ☰ diklik
// ============================================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('is-open');
});

// Tutup menu otomatis saat salah satu link diklik (khusus mobile)
navMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('is-open');
  });
});

// ============================================
// 2. ANIMASI ANGKA STATISTIK
// Angka di section "Info Umum" akan menghitung naik
// dari 0 ke angka aslinya saat pertama kali terlihat di layar
// ============================================
function animateNumber(el) {
  const target = parseInt(el.dataset.target, 10) || 0;
  const duration = 1200; // durasi animasi dalam milidetik
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value.toLocaleString('id-ID');

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toLocaleString('id-ID');
    }
  }

  requestAnimationFrame(step);
}

// Dipanggil dari renderHalaman() setelah data-target tiap angka terisi dari JSON.
// IntersectionObserver mendeteksi kapan section stats masuk ke layar,
// baru animasi dijalankan (supaya tidak jalan saat halaman pertama dibuka)
function aktifkanAnimasiStatistik() {
  const statNumbers = document.querySelectorAll('.stat__number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNumber(entry.target);
        observer.unobserve(entry.target); // hanya animasi sekali
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach((el) => observer.observe(el));
}