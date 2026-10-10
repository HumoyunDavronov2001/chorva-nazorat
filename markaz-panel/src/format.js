// FORMAT — sana, vaqt, son va pul.
//
// NEGA O'ZIMIZ: `toLocaleString('uz-UZ')` brauzerdagi ICU ma'lumotiga
// tayanadi va u sanani "2026 M08 15" ko'rinishida beradi ("M08" — oyning
// ICU belgisi). Davlat idorasi ko'radigan hujjatda bunday yozuv xato
// bosilgandek ko'rinadi. Shuning uchun formatlash SHU YERDA, qat'iy va
// bir xil: 15.08.2026 · 15-avgust, 2026 · 1 234 567 soʻm.

const OYLAR = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul',
               'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const OY_QISQA = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl',
                  'avg', 'sen', 'okt', 'noy', 'dek'];
const KUNLAR = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba',
                'payshanba', 'juma', 'shanba'];

const ik = (n) => String(n).padStart(2, '0');
const dat = (d) => (d instanceof Date ? d : new Date(d));

// "2026-08-15" → Date (vaqt zonasi siljitmasin uchun mahalliy tush payti)
export function sanadanDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : new Date(s);
}

// Baza formati: 2026-08-15
export function sanaStr(d = new Date()) {
  const x = dat(d);
  return `${x.getFullYear()}-${ik(x.getMonth() + 1)}-${ik(x.getDate())}`;
}
export function kunOldin(n) {
  return sanaStr(new Date(Date.now() - n * 86400000));
}

// Ko'rsatish: 15.08.2026
export function sana(s) {
  if (!s) return '—';
  const d = typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s) ? sanadanDate(s) : dat(s);
  if (Number.isNaN(d.getTime())) return '—';
  return `${ik(d.getDate())}.${ik(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// To'liq: 15-avgust, 2026 (payshanba)
export function sanaToliq(s, kunBilan = false) {
  const d = typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s) ? sanadanDate(s) : dat(s);
  if (Number.isNaN(d.getTime())) return '—';
  const asos = `${d.getDate()}-${OYLAR[d.getMonth()]}, ${d.getFullYear()}`;
  return kunBilan ? `${asos} (${KUNLAR[d.getDay()]})` : asos;
}

// Grafik o'qi uchun qisqa: 15 avg
export function sanaQisqa(s) {
  const d = typeof s === 'string' ? sanadanDate(s) : dat(s);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${OY_QISQA[d.getMonth()]}`;
}

export function vaqt(s, sekundBilan = false) {
  const d = dat(s);
  if (Number.isNaN(d.getTime())) return '—';
  return sekundBilan
    ? `${ik(d.getHours())}:${ik(d.getMinutes())}:${ik(d.getSeconds())}`
    : `${ik(d.getHours())}:${ik(d.getMinutes())}`;
}

// 15.08.2026, 23:09
export function sanaVaqt(s, sekundBilan = false) {
  return `${sana(s)}, ${vaqt(s, sekundBilan)}`;
}

// ── SONLAR ──
// Ajratgich — TOR AJRATILMAYDIGAN bo'shliq (U+202F): raqam qator
// oxirida ikkiga bo'linib ketmaydi va chop etishda ham but qoladi.
const AJRAT = ' ';
export function soz(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  const manfiy = x < 0;
  const s = Math.round(Math.abs(x)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, AJRAT);
  return (manfiy ? '−' : '') + s;      // ATAYLAB minus belgisi (U+2212)
}

// Pul. qisqa=true bo'lsa katta summalar "12,4 mln" ko'rinishida —
// KPI kartalarida uzun raqam ikki qatorga tushib ketmasin.
export function pul(n, { qisqa = false, valyuta = true } = {}) {
  const x = Math.round(Number(n) || 0);
  const belgi = valyuta ? ' soʻm' : '';
  if (qisqa && Math.abs(x) >= 1_000_000)
    return `${(x / 1_000_000).toFixed(x >= 100_000_000 ? 0 : 1).replace('.', ',')} mln${belgi}`;
  if (qisqa && Math.abs(x) >= 100_000)
    return `${(x / 1000).toFixed(0)} ming${belgi}`;
  return soz(x) + belgi;
}

export function foizMatn(f) {
  if (f === null || f === undefined) return '—';
  return `${String(f).replace('.', ',')}%`;
}

// Aloqa yoshi: odam o'qiydigan matn
export function aloqaMatn(s) {
  if (s === null || s === undefined || s < 0) return 'hech qachon';
  if (s < 90) return `${Math.round(s)} soniya oldin`;
  if (s < 5400) return `${Math.round(s / 60)} daqiqa oldin`;
  if (s < 172800) return `${Math.round(s / 3600)} soat oldin`;
  return `${Math.round(s / 86400)} kun oldin`;
}

// Fayl hajmi
export function hajm(bayt) {
  const b = Number(bayt) || 0;
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1).replace('.', ',')} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(1).replace('.', ',')} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

// ── CSV EKSPORT ──
// Idorada ma'lumot Excel'ga olinadi. Nuqtali vergul — Excel'ning
// mintaqaviy sozlamasi uchun (vergul ishlatilsa ustunlar birlashib
// ketadi), BOM esa kirill/lotin harflar buzilmasligi uchun.
export function csvYukla(nom, ustunlar, qatorlar) {
  const qoch = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const satrlar = [ustunlar.map((u) => qoch(u.nom)).join(';')];
  for (const q of qatorlar)
    satrlar.push(ustunlar.map((u) => qoch(u.qiymat(q))).join(';'));
  const matn = '﻿' + satrlar.join('\r\n');
  const havola = document.createElement('a');
  havola.href = URL.createObjectURL(new Blob([matn], { type: 'text/csv;charset=utf-8' }));
  havola.download = `${nom}_${sanaStr()}.csv`;
  havola.click();
  setTimeout(() => URL.revokeObjectURL(havola.href), 5000);
}
