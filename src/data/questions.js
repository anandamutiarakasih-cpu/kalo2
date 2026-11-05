/**
 * THERMO CHAMPIONS: HEAT EDITION — QUESTION BANK & CURRICULUM DATA
 * Media Pembelajaran IPA Kelas VII SMP — Materi Pokok Kalor
 * 
 * Total Nilai: 100 Poin
 * - Mode 1: StarChamp Challenge (10 Soal PG, @3.5 Poin = 35 Poin)
 * - Mode 2: Memory Madness (10 Kartu Fakta + 10 Recall, @3 Poin = 30 Poin)
 * - Mode 3: Number Chains (5 Tahap Perhitungan Kalor Bertingkat = 35 Poin)
 */

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    topic: 'Konsep Dasar Kalor',
    question: 'Pernyataan yang paling tepat mengenai pengertian kalor dalam konsep fisika adalah...',
    options: [
      { key: 'A', text: 'Derajat ukuran panas atau dinginnya suatu benda secara kuantitatif' },
      { key: 'B', text: 'Bentuk energi panas yang berpindah dari benda bersuhu tinggi ke suhu lebih rendah' },
      { key: 'C', text: 'Zat cair tak terlihat yang mengalir di dalam benda panas' },
      { key: 'D', text: 'Kandungan energi dingin yang tersimpan di dalam es yang membeku' }
    ],
    correctAnswer: 'B',
    explanation: 'Kalor adalah energi panas yang berpindah dari benda bersuhu lebih tinggi ke benda bersuhu lebih rendah. Suhu adalah derajat panas/dinginnya.'
  },
  {
    id: 2,
    topic: 'Satuan Kalor & Tara Kalor',
    question: 'Dalam Sistem Internasional (SI), satuan resmi untuk kalor adalah Joule (J). Kesetaraan 1 kalori dengan Joule adalah...',
    options: [
      { key: 'A', text: '1 kalori = 0,24 Joule' },
      { key: 'B', text: '1 kalori = 1,00 Joule' },
      { key: 'C', text: '1 kalori = 4,20 Joule' },
      { key: 'D', text: '1 kalori = 4.200 Joule' }
    ],
    correctAnswer: 'C',
    explanation: 'Berdasarkan percobaan James Prescott Joule, 1 kalori setara dengan 4,2 Joule (atau 1 Joule ≈ 0,24 kalori).'
  },
  {
    id: 3,
    topic: 'Pengaruh Kalor terhadap Suhu',
    question: 'Faktor-faktor yang memengaruhi besarnya kalor (Q) yang dibutuhkan untuk menaikkan suhu suatu zat adalah...',
    options: [
      { key: 'A', text: 'Massa zat, kalor jenis zat, dan perubahan suhu (Q = m · c · ΔT)' },
      { key: 'B', text: 'Volume wadah, tekanan udara, dan kecepatan angin' },
      { key: 'C', text: 'Massa jenis zat, luas permukaan wadah, dan kedalaman zat cair' },
      { key: 'D', text: 'Kapasitas kalor, titik didih, dan warna wadah zat' }
    ],
    correctAnswer: 'A',
    explanation: 'Rumus utama kalor perubahan suhu adalah Q = m · c · ΔT, di mana m = massa (kg), c = kalor jenis (J/kg°C), dan ΔT = kenaikan suhu (°C).'
  },
  {
    id: 4,
    topic: 'Kalor Jenis Zat',
    question: 'Kalor jenis air adalah 4.200 J/kg°C, sedangkan kalor jenis pasir hanya 800 J/kg°C. Makna fisis dari perbandingan ini adalah...',
    options: [
      { key: 'A', text: 'Air lebih cepat panas dibanding pasir jika dipanaskan bersamaan' },
      { key: 'B', text: 'Pasir membutuhkan kalor lebih banyak untuk menaikkan suhunya 1°C' },
      { key: 'C', text: 'Air membutuhkan kalor 4.200 Joule untuk menaikkan suhu 1 kg air sebesar 1°C sehingga lebih lambat panas' },
      { key: 'D', text: 'Pasir tidak dapat mengalami kenaikan suhu ketika menyerap kalor' }
    ],
    correctAnswer: 'C',
    explanation: 'Kalor jenis adalah kalor yang diperlukan 1 kg zat untuk naik 1°C. Semakin besar nilai c, zat semakin lambat mengalami kenaikan suhu (seperti air laut dibanding pasir pantai di siang hari).'
  },
  {
    id: 5,
    topic: 'Kalor Laten & Perubahan Wujud',
    question: 'Saat sebongkah es sedang melebur menjadi air pada suhu 0°C, termometer yang diletakkan pada es menunjukkan suhu yang tetap. Hal ini karena...',
    options: [
      { key: 'A', text: 'Tidak ada kalor yang diserap oleh es dari lingkungan' },
      { key: 'B', text: 'Kalor yang diserap digunakan untuk memutus ikatan antarmolekul (perubahan wujud), bukan menaikkan suhu' },
      { key: 'C', text: 'Termometer membeku sehingga tidak dapat mengukur perubahan suhu' },
      { key: 'D', text: 'Kalor yang masuk langsung hilang ke udara bebas' }
    ],
    correctAnswer: 'B',
    explanation: 'Kalor laten adalah kalor yang diserap atau dilepaskan zat selama proses perubahan wujud tanpa mengalami perubahan suhu (suhu konstan).'
  },
  {
    id: 6,
    topic: 'Azas Black',
    question: 'Ketika air panas 80°C dicampur dengan air dingin 20°C di dalam wadah terisolasi, berlaku Azas Black yang berbunyi...',
    options: [
      { key: 'A', text: 'Suhu akhir campuran selalu sama dengan suhu air terpanas' },
      { key: 'B', text: 'Banyaknya kalor yang dilepas benda panas sama dengan kalor yang diserap benda dingin (Q_lepas = Q_terima)' },
      { key: 'C', text: 'Kalor selalu memusnahkan energi panas yang ada di sekitarnya' },
      { key: 'D', text: 'Massa air panas harus selalu lebih besar dibanding air dingin' }
    ],
    correctAnswer: 'B',
    explanation: 'Azas Black dicetuskan oleh Joseph Black: pada percampuran dua zat, kalor yang dilepaskan oleh zat bersuhu tinggi sama dengan kalor yang diserap zat bersuhu rendah (Q_lepas = Q_terima).'
  },
  {
    id: 7,
    topic: 'Perpindahan Kalor: Konduksi',
    question: 'Saat mengaduk teh panas dengan sendok logam, ujung sendok yang dipegang ikut terasa panas setelah beberapa saat. Peristiwa ini merupakan contoh perpindahan kalor secara...',
    options: [
      { key: 'A', text: 'Konduksi, yaitu hantaran kalor melalui zat padat tanpa disertai perpindahan partikel zat' },
      { key: 'B', text: 'Konveksi, yaitu aliran zat logam dari bawah ke atas' },
      { key: 'C', text: 'Radiasi, yaitu pancaran gelombang elektromagnetik dari teh ke tangan' },
      { key: 'D', text: 'Kondensasi, yaitu pengembunan uap panas pada sendok' }
    ],
    correctAnswer: 'A',
    explanation: 'Konduksi adalah perpindahan kalor melalui zat perantara (terutama padat/logam) tanpa disertai perpindahan partikel-partikel zat tersebut.'
  },
  {
    id: 8,
    topic: 'Perpindahan Kalor: Konveksi',
    question: 'Terjadinya angin laut pada siang hari (udara mengalir dari laut ke darat) disebabkan oleh peristiwa konveksi karena...',
    options: [
      { key: 'A', text: 'Daratan lebih cepat panas dari lautan sehingga udara di atas darat naik dan digantikan udara dingin dari laut' },
      { key: 'B', text: 'Air laut menyerap sinar matahari lebih cepat daripada daratan' },
      { key: 'C', text: 'Sinar matahari terpantul oleh gelombang air laut menuju daratan' },
      { key: 'D', text: 'Adanya gaya tarik gravitasi bulan yang menekan udara laut' }
    ],
    correctAnswer: 'A',
    explanation: 'Konveksi adalah perpindahan kalor melalui fluida (cair/gas) yang disertai aliran partikel. Di siang hari darat lebih cepat panas, udara darat memuai dan naik, digantikan aliran udara sejuk dari laut.'
  },
  {
    id: 9,
    topic: 'Perpindahan Kalor: Radiasi',
    question: 'Energi panas dari matahari dapat sampai ke permukaan bumi melewati ruang angkasa yang hampa udara. Perpindahan kalor ini terjadi secara...',
    options: [
      { key: 'A', text: 'Konduksi melalui partikel debu antariksa' },
      { key: 'B', text: 'Konveksi melalui gelombang angin kosmik' },
      { key: 'C', text: 'Radiasi melalui gelombang elektromagnetik tanpa memerlukan zat perantara' },
      { key: 'D', text: 'Evaporasi melalui pembentukan awan stratosfer' }
    ],
    correctAnswer: 'C',
    explanation: 'Radiasi adalah perpindahan energi panas dalam bentuk gelombang elektromagnetik yang tidak memerlukan zat perantara (dapat merambat di ruang hampa).'
  },
  {
    id: 10,
    topic: 'Penerapan Teknologi Kalor',
    question: 'Dinding bagian dalam termos air panas dilapisi cermin kaca mengilap dan diapit oleh ruang hampa udara. Fungsi lapisan kaca mengilap tersebut adalah...',
    options: [
      { key: 'A', text: 'Mencegah perpindahan kalor secara radiasi dengan cara memantulkannya kembali ke dalam' },
      { key: 'B', text: 'Mencegah terjadinya perpindahan kalor secara konduksi' },
      { key: 'C', text: 'Membuat air mendidih kembali secara otomatis di dalam termos' },
      { key: 'D', text: 'Mencegah termos pecah jika terjatuh' }
    ],
    correctAnswer: 'A',
    explanation: 'Dinding mengilap pada termos memantulkan radiasi panas kembali ke dalam termos, sedangkan ruang hampa (vakum) mencegah hilangnya kalor secara konduksi dan konveksi.'
  }
];

export const MEMORY_CARDS = [
  { id: 1, cat: 'Konsep', title: 'Definisi Kalor', fact: 'Energi Panas Berpindah', desc: 'Berpindah dari suhu tinggi ke suhu rendah (1 kalori = 4,2 Joule)' },
  { id: 2, cat: 'Rumus', title: 'Kalor Naik Suhu', fact: 'Q = m · c · ΔT', desc: 'm = massa (kg), c = kalor jenis, ΔT = perubahan suhu' },
  { id: 3, cat: 'Konstanta', title: 'Kalor Jenis Air', fact: '4.200 J/kg°C', desc: 'Nilai kalor jenis air murni pada tekanan normal 1 atm' },
  { id: 4, cat: 'Rumus', title: 'Kalor Melebur', fact: 'Q = m · L', desc: 'L = Kalor lebur zat (perubahan wujud padat ke cair)' },
  { id: 5, cat: 'Konstanta', title: 'Kalor Lebur Es', fact: '336.000 J/kg', desc: 'Kalor untuk meleburkan 1 kg es pada suhu 0°C' },
  { id: 6, cat: 'Rumus', title: 'Kalor Menguap', fact: 'Q = m · U', desc: 'U = Kalor uap zat (perubahan wujud cair ke gas)' },
  { id: 7, cat: 'Hukum', title: 'Azas Black', fact: 'Q_lepas = Q_terima', desc: 'Kalor dilepas benda panas = kalor diserap benda dingin' },
  { id: 8, cat: 'Perpindahan', title: 'Konduksi', fact: 'Hantaran Zat Padat', desc: 'Perpindahan kalor tanpa perpindahan partikel zat' },
  { id: 9, cat: 'Perpindahan', title: 'Konveksi', fact: 'Aliran Fluida', desc: 'Perpindahan kalor disertai perpindahan partikel cair/gas' },
  { id: 10, cat: 'Perpindahan', title: 'Radiasi', fact: 'Pancaran Gelombang', desc: 'Perpindahan kalor tanpa zat perantara (ruang hampa)' }
];

export const RECALL_QUESTIONS = [
  { id: 1, cardId: 1, prompt: 'Berdasarkan kartu fakta, apakah definisi utama dari Kalor?', options: ['Energi Panas Berpindah', 'Ukuran derajat dingin', 'Massa jenis zat cair', 'Volume partikel memuai'], answer: 'Energi Panas Berpindah', exp: 'Kalor adalah energi panas yang berpindah dari suhu tinggi ke suhu rendah.' },
  { id: 2, cardId: 2, prompt: 'Manakah rumus untuk menghitung kalor perubahan suhu zat?', options: ['Q = m · c · ΔT', 'Q = m · L', 'Q = m · U', 'Q = m / ΔT'], answer: 'Q = m · c · ΔT', exp: 'Rumus perubahan suhu: Q = m · c · ΔT.' },
  { id: 3, cardId: 3, prompt: 'Berapakah nilai kalor jenis air murni pada kartu konstanta?', options: ['800 J/kg°C', '2.100 J/kg°C', '4.200 J/kg°C', '336.000 J/kg°C'], answer: '4.200 J/kg°C', exp: 'Kalor jenis air adalah 4.200 J/kg°C.' },
  { id: 4, cardId: 4, prompt: 'Rumus yang digunakan untuk menghitung kalor saat benda melebur adalah...', options: ['Q = m · L', 'Q = m · c · ΔT', 'Q = m · U', 'Q = c · ΔT'], answer: 'Q = m · L', exp: 'Rumus melebur: Q = m · L (L = kalor lebur).' },
  { id: 5, cardId: 5, prompt: 'Berapa besarnya nilai kalor lebur es (L_es) yang dihafal?', options: ['4.200 J/kg', '80.000 J/kg', '336.000 J/kg', '2.260.000 J/kg'], answer: '336.000 J/kg', exp: 'Kalor lebur es adalah 336.000 J/kg.' },
  { id: 6, cardId: 6, prompt: 'Simbol rumus untuk kalor penguapan zat pada kartu adalah...', options: ['Q = m · U', 'Q = m · L', 'Q = m · c', 'Q = U / m'], answer: 'Q = m · U', exp: 'Rumus kalor menguap: Q = m · U (U = kalor uap).' },
  { id: 7, cardId: 7, prompt: 'Bagaimanakah persamaan hukum Azas Black yang tercantum?', options: ['Q_lepas = Q_terima', 'Q_masuk = 0', 'Q = m · c · ΔT', 'Q_lepas > Q_terima'], answer: 'Q_lepas = Q_terima', exp: 'Azas Black menyatakan Q_lepas = Q_terima.' },
  { id: 8, cardId: 8, prompt: 'Perpindahan kalor tanpa disertai perpindahan partikel zat disebut...', options: ['Konduksi', 'Konveksi', 'Radiasi', 'Evaporasi'], answer: 'Konduksi', exp: 'Konduksi terjadi pada zat padat tanpa perpindahan partikel.' },
  { id: 9, cardId: 9, prompt: 'Perpindahan kalor pada zat cair dan gas yang disertai aliran partikel adalah...', options: ['Konveksi', 'Konduksi', 'Radiasi', 'Sublimasi'], answer: 'Konveksi', exp: 'Konveksi adalah perpindahan kalor melalui aliran fluida.' },
  { id: 10, cardId: 10, prompt: 'Perpindahan kalor melalui pancaran gelombang tanpa zat perantara disebut...', options: ['Radiasi', 'Konduksi', 'Konveksi', 'Kondensasi'], answer: 'Radiasi', exp: 'Radiasi merambat sebagai gelombang elektromagnetik tanpa medium.' }
];

export const NUMBER_CHAIN_STAGES = [
  {
    stage: 1,
    difficulty: 'Easy',
    title: 'Tahap 1: Kalor Pemanasan Air Sederhana',
    desc: 'Air bermassa 2 kg dipanaskan dari suhu awal 25°C menjadi 75°C. Jika kalor jenis air c = 4.200 J/kg°C, hitunglah kalor total (Q) yang diserap air!',
    given: 'm = 2 kg, c = 4.200 J/kg°C, ΔT = 75°C - 25°C = 50°C',
    targetUnit: 'Joule (J)',
    maxPoints: 7,
    formula: 'Q = m × c × ΔT',
    steps: [
      {
        id: 's1',
        label: 'Kalor yang diserap (Joule):',
        target: 420000,
        unit: 'J',
        weight: 7,
        solution: 'Q = 2 kg × 4.200 J/kg°C × 50°C = 420.000 Joule'
      }
    ]
  },
  {
    stage: 2,
    difficulty: 'Easy',
    title: 'Tahap 2: Kalor Lebur Es (Perubahan Wujud)',
    desc: 'Sebongkah es bermassa 0,5 kg pada titik leburnya (0°C) hendak dicairkan seluruhnya menjadi air 0°C. Jika kalor lebur es L = 336.000 J/kg, berapa kalor yang dibutuhkan?',
    given: 'm = 0,5 kg, L = 336.000 J/kg',
    targetUnit: 'Joule (J)',
    maxPoints: 7,
    formula: 'Q = m × L',
    steps: [
      {
        id: 's2',
        label: 'Kalor lebur yang dibutuhkan (Joule):',
        target: 168000,
        unit: 'J',
        weight: 7,
        solution: 'Q = 0,5 kg × 336.000 J/kg = 168.000 Joule'
      }
    ]
  },
  {
    stage: 3,
    difficulty: 'Medium',
    title: 'Tahap 3: Menentukan Kenaikan Suhu (ΔT)',
    desc: 'Sepotong aluminium bermassa 2 kg (kalor jenis c = 900 J/kg°C) dipanaskan dengan menyerap kalor sebesar 54.000 Joule. Berapakah kenaikan suhu (ΔT) aluminium tersebut?',
    given: 'Q = 54.000 J, m = 2 kg, c = 900 J/kg°C',
    targetUnit: '°C',
    maxPoints: 7,
    formula: 'ΔT = Q / (m × c)',
    steps: [
      {
        id: 's3',
        label: 'Kenaikan suhu ΔT (°C):',
        target: 30,
        unit: '°C',
        weight: 7,
        solution: 'ΔT = 54.000 / (2 × 900) = 54.000 / 1.800 = 30°C'
      }
    ]
  },
  {
    stage: 4,
    difficulty: 'Medium',
    title: 'Tahap 4: Menghitung Kapasitas Kalor (C)',
    desc: 'Sebuah bejana pemanas menyerap kalor sebesar 19.000 Joule dan mengalami kenaikan suhu sebesar 50°C. Berapakah nilai kapasitas kalor (C) bejana tersebut?',
    given: 'Q = 19.000 J, ΔT = 50°C',
    targetUnit: 'J/°C',
    maxPoints: 7,
    formula: 'C = Q / ΔT',
    steps: [
      {
        id: 's4',
        label: 'Kapasitas kalor bejana C (J/°C):',
        target: 380,
        unit: 'J/°C',
        weight: 7,
        solution: 'C = 19.000 J / 50°C = 380 J/°C'
      }
    ]
  },
  {
    stage: 5,
    difficulty: 'Hard',
    title: 'Tahap 5: Rantai Bertingkat (Melebur + Memanaskan Air)',
    desc: 'Tantangan Master Kalor! Es 1 kg bersuhu 0°C dileburkan seluruhnya menjadi air 0°C (Langkah A), kemudian air tersebut dipanaskan hingga mendidih bersuhu 100°C (Langkah B). Diketahui L = 336.000 J/kg dan c_air = 4.200 J/kg°C.',
    given: 'm = 1 kg, L = 336.000 J/kg, c = 4.200 J/kg°C, ΔT = 100°C',
    targetUnit: 'Joule (J)',
    maxPoints: 7,
    formula: 'Langkah A: Q1 = m × L  |  Langkah B: Q2 = m × c × ΔT',
    steps: [
      {
        id: 's5_a',
        label: 'Langkah A: Kalor untuk meleburkan es Q1 (Joule):',
        target: 336000,
        unit: 'J',
        weight: 3.5,
        solution: 'Q1 = 1 kg × 336.000 J/kg = 336.000 Joule'
      },
      {
        id: 's5_b',
        label: 'Langkah B: Kalor untuk memanaskan air Q2 (Joule):',
        target: 420000,
        unit: 'J',
        weight: 3.5,
        solution: 'Q2 = 1 kg × 4.200 J/kg°C × 100°C = 420.000 Joule'
      }
    ]
  }
];

export function getPredicate(score) {
  const rounded = Math.round(Number(score || 0) * 10) / 10;
  if (rounded >= 86) {
    return {
      title: 'THERMO CHAMPION',
      badge: '🏆',
      bgClass: 'predicate-champ',
      color: '#d97706',
      msg: 'Luar biasa! Seluruh anggota kelompok membuktikan penguasaan konsep kalor, perpindahan kalor, dan perhitungan tingkat master!'
    };
  }
  if (rounded >= 76) {
    return {
      title: 'HEAT EXPERT',
      badge: '🥇',
      bgClass: 'predicate-expert',
      color: '#2563eb',
      msg: 'Sangat hebat! Kerja sama tim solid dan pemahaman rumus kalor Q = m·c·ΔT serta Azas Black sangat matang.'
    };
  }
  if (rounded >= 66) {
    return {
      title: 'SCIENCE CHALLENGER',
      badge: '🥈',
      bgClass: 'predicate-challenger',
      color: '#059669',
      msg: 'Bagus! Kelompok berhasil menuntaskan sebagian besar tantangan konsep dan hitungan kalor dengan baik.'
    };
  }
  if (rounded >= 56) {
    return {
      title: 'HEAT EXPLORER',
      badge: '🥉',
      bgClass: 'predicate-explorer',
      color: '#7c3aed',
      msg: 'Cukup baik. Perkuat pemahaman tentang kalor laten dan perbedaan konduksi, konveksi, serta radiasi.'
    };
  }
  return {
    title: 'THERMAL ROOKIE',
    badge: '🌱',
    bgClass: 'predicate-rookie',
    color: '#64748b',
    msg: 'Tetap semangat! Pelajari kembali materi pengaruh kalor terhadap kenaikan suhu dan perubahan wujud zat.'
  };
}
