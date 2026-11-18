// Palma Heat — shared constants, names and data tables.
// Everything original: fictional city, fictional people, fictional cars.

export const CITY = {
  blocks: 8,          // 8 x 8 blocks
  block: 30,          // block pitch (road centre to road centre)
  road: 9,            // road width
  half: 8 * 30 / 2,   // city extends -120 .. +120
};

export const DISTRICTS = [
  { name: 'Marina Bay', x0: -120, z0: -120, x1: 0, z1: -30 },
  { name: 'Old Palma', x0: 0, z0: -120, x1: 120, z1: -30 },
  { name: 'Downtown', x0: -120, z0: -30, x1: 0, z1: 60 },
  { name: 'Sunset Strip', x0: 0, z0: -30, x1: 120, z1: 60 },
  { name: 'Palma Beach', x0: -120, z0: 60, x1: 120, z1: 120 },
];

// Five stealable named cars. Each has its own colour, top speed and handling.
export const CARS = [
  { id: 'cometa', name: 'Cometa GT', color: 0xd7263d, top: 52, accel: 26, grip: 2.6, price: 4200 },
  { id: 'brisa', name: 'Brisa S', color: 0x2e86ff, top: 46, accel: 22, grip: 2.4, price: 2600 },
  { id: 'toro', name: 'Toro V8', color: 0xff8c1a, top: 49, accel: 30, grip: 2.2, price: 3100 },
  { id: 'nube', name: 'Nube Classic', color: 0x18c8a0, top: 40, accel: 18, grip: 2.8, price: 1900 },
  { id: 'halcon', name: 'Halcón RS', color: 0xf5d90a, top: 58, accel: 32, grip: 2.3, price: 5800 },
];

export const TRAFFIC_COLORS = [0x8a93a6, 0x5b6b7f, 0xc2b49a, 0x7a4a3a, 0x3f5e4a, 0xb8b8b8, 0x274060, 0x9a7bb8];

export const CHARACTERS = [
  { id: 'lucia', name: 'Lucía', role: 'Fixer — Marina Bay', skin: '#c98d64', hair: '#1c1210', hairStyle: 'bob', shirt: '#d7263d', accent: '#ffd23e' },
  { id: 'rico', name: 'Rico', role: 'Mekanik — Old Palma', skin: '#8a5a3b', hair: '#0f0c0a', hairStyle: 'buzz', shirt: '#2e86ff', accent: '#ffffff' },
  { id: 'maya', name: 'Maya', role: 'Kurir — Downtown', skin: '#e8b48c', hair: '#3a1c10', hairStyle: 'pony', shirt: '#18c8a0', accent: '#1a0f1e' },
  { id: 'don', name: 'Don Esteban', role: 'Pemilik kasino — Sunset Strip', skin: '#d9a06f', hair: '#e8e8e8', hairStyle: 'slick', shirt: '#f5d90a', accent: '#1a0f1e' },
  { id: 'ines', name: 'Inés', role: 'Hacker — Palma Beach', skin: '#c98d64', hair: '#241428', hairStyle: 'mohawk', shirt: '#9a7bb8', accent: '#7dff9a' },
  { id: 'kiko', name: 'Kiko', role: 'Pembalap liar — Marina Bay', skin: '#a06a42', hair: '#120d0b', hairStyle: 'spiky', shirt: '#ff8c1a', accent: '#ffffff' },
];

// Six chained missions. Each has a target point, a speaker and dialogue lines.
export const MISSIONS = [
  {
    title: '1 — Paket Pertama',
    who: 'lucia',
    target: [-95, 95], // beach plaza
    objective: 'Temui Lucía di Plaza Palma, lalu antar paket ke dermaga.',
    lines: [
      'Kau baru di Palma, ya? Bagus. Aku butuh kurir yang tidak dikenal polisi.',
      'Ambil paket ini, antar ke ujung dermaga. Jangan berhenti untuk siapa pun.',
      'Selesai? Kau resmi bekerja untukku. Selamat datang di Palma Heat.',
    ],
    reward: 350,
  },
  {
    title: '2 — Mobil Rico',
    who: 'rico',
    target: [85, -95], // old palma garage
    objective: 'Curi Halcón RS di Old Palma dan bawa ke bengkel Rico.',
    lines: [
      'Halcón RS itu milik kolektor sombong. Kuncinya ada di dalam, tentu saja.',
      'Bawa ke bengkelku sebelum polisi sadar. Jangan gores catnya. Oke, gores sedikit boleh.',
      'Mesinnya masih mulus. Kau punya bakat mencuri, anak muda.',
    ],
    reward: 500,
  },
  {
    title: '3 — Data Inés',
    who: 'ines',
    target: [-40, 40], // downtown rooftop lot
    objective: 'Ambil hard drive dari atap Downtown, hindari patroli.',
    lines: [
      'Hard drive itu berisi daftar nama. Polisi menginginkannya, aku lebih menginginkannya.',
      'Atap gedung Downtown, pintu darurat. Ada dua penjaga — buat mereka sibuk atau buat mereka tidur.',
      'Data aman. Kau baru saja membeli kebebasan setengah kota.',
    ],
    reward: 650,
  },
  {
    title: '4 — Utang Don Esteban',
    who: 'don',
    target: [95, 25], // sunset strip casino
    objective: 'Tagih utang di kasino Sunset Strip, lalu kabur dari pengawalnya.',
    lines: [
      'Seseorang berutang padaku. Banyak. Pergi dan ingatkan dia, dengan sopan.',
      'Pengawalnya keras kepala. Kalau mereka mengejarmu, jangan berhenti di lampu merah.',
      'Uang kembali. Kau bekerja rapi. Kasino selalu ingat yang rapi.',
    ],
    reward: 900,
  },
  {
    title: '5 — Gudang Pelabuhan',
    who: 'maya',
    target: [-95, -40], // warehouse lot, west side
    objective: 'Amankan gudang 4 di pelabuhan: kalahkan 3 penjaga, ambil kargo.',
    lines: [
      'Gudang 4 dijaga tiga orang bersenjata. Kargo di dalamnya milik kita.',
      'Masuk dari sisi utara, peti-peti itu penutup yang bagus. Jangan biarkan satu pun lolos.',
      'Kargo aman. Lucía akan senang — dan kau akan lebih kaya.',
    ],
    reward: 1200,
  },
  {
    title: '6 — Pelarian Matahari Terbenam',
    who: 'kiko',
    target: [0, 105], // beach road, far west end
    objective: 'Balapan terakhir: kalahkan Kiko di jalan pantai, wanted 5 tidak masalah.',
    lines: [
      'Kau sudah dengar namaku? Aku tercepat di jalan pantai. Buktikan aku salah.',
      'Start di ujung barat, finish di mercusuar. Polisi pasti ikut — anggap saja penonton.',
      'Kau menang. Palma milikmu sekarang. Sampai jumpa di garis finish berikutnya.',
    ],
    reward: 2000,
  },
];

export const WEAPONS = [
  { id: 'fist', name: 'Tinju', ammo: Infinity, dmg: 25, rate: 0.35 },
  { id: 'pistol', name: 'Pistol', ammo: 24, dmg: 34, rate: 0.28 },
  { id: 'smg', name: 'SMG', ammo: 60, dmg: 18, rate: 0.09 },
  { id: 'shotgun', name: 'Shotgun', ammo: 12, dmg: 70, rate: 0.8 },
];

export const RADIOS = [
  'PALMA FM 98.6 — Sunset Drive',
  'RADIO OLA 101.2 — Beach Vibes',
  'LA NOCHE 88.4 — Night Cruise',
];

// Seeded RNG so the city is identical for every run with the same seed.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function dist2(ax, az, bx, bz) { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; }
