// API — server bilan aloqa.
//
// MUHIM QOIDA: har bir chaqiruv xatoni TASHLAYDI, chaqiruvchi esa uni
// albatta ushlaydi va EKRANGA chiqaradi. Eski panelda 13 ta joyda
// ishlovchi yo'q edi va sahifa abadiy "Yuklanmoqda…" da qotib qolardi —
// mijoz aynan shundan shikoyat qilgan edi. Shuning uchun bu yerda
// yagona darvoza bor va `useSorov` ilmog'i xato holatini majburiy
// qaytaradi.

export class ApiXato extends Error {
  constructor(xabar, holat, tana) {
    super(xabar);
    this.holat = holat;      // HTTP kodi (401 = kirilmagan)
    this.tana = tana || null;
    // Kirish ekrani uchun: server bergan kutish soniyalari
    this.qoldi = tana?.qoldi;
  }
}

async function sorov(yol, sozlama = {}) {
  let javob;
  try {
    javob = await fetch(yol, {
      credentials: 'same-origin',    // sessiya cookie'si ketsin
      headers: sozlama.body ? { 'Content-Type': 'application/json' } : undefined,
      ...sozlama,
    });
  } catch {
    // Tarmoq umuman yo'q (server o'chgan, internet uzilgan)
    throw new ApiXato('server bilan aloqa yoʻq', 0);
  }

  const tur = javob.headers.get('content-type') || '';
  let tana = null;
  if (tur.includes('application/json')) {
    try { tana = await javob.json(); } catch { tana = null; }
  }

  if (!javob.ok) {
    const xabar = tana?.natija || tana?.message ||
                  `server xatosi (HTTP ${javob.status})`;
    throw new ApiXato(xabar, javob.status, tana);
  }
  // Server 200 bilan ham xato qaytarishi mumkin ({"natija":"..."}).
  // "ok"/"tayyor"/"so'raldi" — normal javoblar.
  if (tana && typeof tana.natija === 'string' &&
      !['ok', 'tayyor', "so'raldi", "o'chirildi", 'mavjud'].includes(tana.natija))
    throw new ApiXato(tana.natija, javob.status, tana);
  return tana;
}

export const api = {
  ol: (yol) => sorov(yol),
  yubor: (yol, tana) => sorov(yol, { method: 'POST', body: JSON.stringify(tana ?? {}) }),

  kirish: (login, parol) => sorov('/api/kirish',
    { method: 'POST', body: JSON.stringify({ login, parol }) }),
  chiqish: () => sorov('/api/chiqish', { method: 'POST', body: '{}' }),
  men: () => sorov('/api/men'),
};

// Formatlash (sana, son, pul) `format.js` da — bitta joyda turadi,
// chunki chop etish va CSV eksporti ham AYNAN o'sha formatdan foydalanadi.
export { soz, pul, sana, sanaVaqt, sanaStr, kunOldin, aloqaMatn, foizMatn,
         hajm, csvYukla } from './format.js';
