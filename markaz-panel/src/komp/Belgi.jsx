// BELGILAR — ichki SVG ikonkalar va logotip.
//
// NEGA EMOJI EMAS: ilgari logotip 🐑, menyu esa 🏠📈🔑⚙️ edi. Emoji —
// shriftga tegishli rasm: Windows 10 da bir xil, Windows 11 da boshqa,
// serverdagi brauzerda umuman kvadrat bo'lib chiqishi mumkin. Rangini
// boshqarib bo'lmaydi, chop etishda dog' bo'lib bosiladi va hujjatda
// "vaqtincha qo'yilgan" degan taassurot qoldiradi. Davlat nazorat
// tizimida belgi — mahsulotning bir qismi, kulgichi emas.
//
// Bu yerdagi ikonkalar: 24×24 to'r, `currentColor`, 1.75 chiziq —
// 16 px da ham, 32 px da ham o'qiladi va matn rangiga ergashadi.

const chiziq = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};

function Ramka({ olcham = 20, children, ...q }) {
  return (
    <svg viewBox="0 0 24 24" width={olcham} height={olcham}
         aria-hidden focusable="false" {...q}>{children}</svg>
  );
}

// ── LOGOTIP ──
//
// MA'NOSI: hayvon YO'LAKDAN o'tadi, tizim o'tganini sanaydi.
// Belgi shuni ko'rsatadi: ikki tomonda yo'lak ustunlari, o'rtada
// o'tish yo'nalishi.
//
// NEGA HAYVON SURATI EMAS: 16 px favicon'da qo'y ham, mol ham dog'ga
// aylanadi. Geometrik shakl har o'lchamda o'qiladi va bosmada ham
// aniq chiqadi.
//
// IKKI MARTA QAYTA CHIZILDI: birinchi variant "≡|" bo'lib matn
// tekislash tugmasiga, ikkinchisi "|>|" bo'lib media "oxiriga o't"
// tugmasiga o'xshab qolgandi. Uchinchisi — yo'lak TEPADAN: ikki
// panjara va ular orasidan o'tish. Boshqa hech qanday tugmaga
// o'xshamaydi va mahsulotning o'zini bildiradi.
export function Logo({ olcham = 36 }) {
  // "SHKALA": xira to'liq halqa + ustidagi 270° yorqin yoy va uning
  // uchidagi nuqta — "o'lchov aniq nuqtaga yetdi".
  // EXE dagi Chizma::logo va chorva.ico bilan AYNAN bir xil nisbatlar
  // (100x100 maket) — bitta mahsulot, bitta belgi.
  return (
    <svg viewBox="0 0 100 100" width={olcham} height={olcham}
         role="img" aria-label="CHORVA NAZORAT belgisi">
      <defs>
        <linearGradient id="cn-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5EEAD4" />
          <stop offset="1" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="38" fill="none" stroke="url(#cn-grad)"
              strokeWidth="11" opacity="0.22" />
      {/* Yoy chizilib ochiladi: 270° yoyning uzunligi ~179 birlik
          (0.75 x 2 x pi x 38), CSS da stroke-dasharray 180 shundan. */}
      <path className="cn-logo-yoy" d="M23 77 A38 38 0 1 1 77 77"
            fill="none" stroke="url(#cn-grad)"
            strokeWidth="11" strokeLinecap="round" />
      <g className="cn-logo-nuqta">
        <circle cx="77" cy="77" r="9" fill="#0D9488" />
        <circle cx="74" cy="74" r="3" fill="#fff" opacity="0.65" />
      </g>
    </svg>
  );
}

// Favicon uchun bir xil belgi (index.html da ham shu yo'l).
// DIQQAT: bu satr URL ichiga tushadi, shuning uchun '#' -> %23 va
// qo'shtirnoq o'rniga bittalik tirnoq ishlatiladi.
export const LOGO_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<circle cx='50' cy='50' r='38' fill='none' stroke='%230D9488' " +
  "stroke-width='11' opacity='0.22'/>" +
  "<path d='M23 77 A38 38 0 1 1 77 77' fill='none' stroke='%230D9488' " +
  "stroke-width='11' stroke-linecap='round'/>" +
  "<circle cx='77' cy='77' r='9' fill='%230D9488'/></svg>";

// ── BO'LIM IKONKALARI ──
export function BelgiBozor(p) {          // bosh sahifa: bozorlar
  return <Ramka {...p}><path {...chiziq} d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path {...chiziq} d="M9 21v-6h6v6"/></Ramka>;
}
export function BelgiStatistika(p) {
  return <Ramka {...p}><path {...chiziq} d="M4 20V10M10 20V4M16 20v-7M22 20h-20"/></Ramka>;
}
export function BelgiKalit(p) {
  return <Ramka {...p}><circle cx="8" cy="12" r="4" {...chiziq}/><path {...chiziq} d="M12 12h9M18 12v3M21 12v2"/></Ramka>;
}
export function BelgiSozlama(p) {
  // Slayderlar — tishli g'ildirak 18 px da dog'ga aylanadi, nurli
  // doira esa "yorqinlik" tugmasiga o'xshab qolgandi.
  return <Ramka {...p}><path {...chiziq} d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" {...chiziq}/><circle cx="15" cy="12" r="2" {...chiziq}/><circle cx="8" cy="17" r="2" {...chiziq}/></Ramka>;
}
export function BelgiChek(p) {           // chek / hujjat
  return <Ramka {...p}><path {...chiziq} d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path {...chiziq} d="M9 8h6M9 12h6"/></Ramka>;
}
export function BelgiPul(p) {
  return <Ramka {...p}><rect x="2" y="6" width="20" height="12" rx="2" {...chiziq}/><circle cx="12" cy="12" r="3" {...chiziq}/></Ramka>;
}
export function BelgiBosh(p) {           // jonli hayvon soni
  return <Ramka {...p}><circle cx="12" cy="12" r="8" {...chiziq}/><path {...chiziq} d="m8.5 12 2.5 2.5L15.5 10"/></Ramka>;
}
export function BelgiKirdi(p) {
  return <Ramka {...p}><path {...chiziq} d="M12 5v14M12 19l-5-5M12 19l5-5"/></Ramka>;
}
export function BelgiChiqdi(p) {
  return <Ramka {...p}><path {...chiziq} d="M12 19V5M12 5 7 10M12 5l5 5"/></Ramka>;
}
export function BelgiKamera(p) {
  return <Ramka {...p}><rect x="2" y="7" width="13" height="10" rx="2" {...chiziq}/><path {...chiziq} d="m15 11 6-3v8l-6-3z"/></Ramka>;
}
export function BelgiVideo(p) {
  return <Ramka {...p}><rect x="3" y="5" width="18" height="14" rx="2" {...chiziq}/><path {...chiziq} d="M10 9.5v5l4-2.5z"/></Ramka>;
}
export function BelgiQulf(p) {
  return <Ramka {...p}><rect x="5" y="10" width="14" height="10" rx="2" {...chiziq}/><path {...chiziq} d="M8 10V7a4 4 0 0 1 8 0v3"/></Ramka>;
}
export function BelgiQalam(p) {          // qo'lda kiritish
  return <Ramka {...p}><path {...chiziq} d="M4 20h4L20 8l-4-4L4 16z"/><path {...chiziq} d="m14 6 4 4"/></Ramka>;
}
export function BelgiPaket(p) {
  return <Ramka {...p}><path {...chiziq} d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path {...chiziq} d="M4 7.5 12 12l8-4.5M12 12v9"/></Ramka>;
}
export function BelgiBosh_(p) {          // bo'sh holat
  return <Ramka {...p}><rect x="3" y="6" width="18" height="13" rx="2" {...chiziq}/><path {...chiziq} d="M3 11h18"/></Ramka>;
}
export function BelgiSoat(p) {
  return <Ramka {...p}><circle cx="12" cy="12" r="8.5" {...chiziq}/><path {...chiziq} d="M12 7.5V12l3 2"/></Ramka>;
}

export function BelgiOdam(p) {           // administrator
  return <Ramka {...p}><circle cx="12" cy="8" r="3.5" {...chiziq}/><path {...chiziq} d="M5 20a7 7 0 0 1 14 0"/></Ramka>;
}
export function BelgiKoz(p) {            // nazoratchi (faqat ko'radi)
  return <Ramka {...p}><path {...chiziq} d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5" {...chiziq}/></Ramka>;
}
export function BelgiMenyu(p) {
  return <Ramka {...p}><path {...chiziq} d="M4 7h16M4 12h16M4 17h16"/></Ramka>;
}
export function BelgiChop(p) {
  return <Ramka {...p}><path {...chiziq} d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2" {...chiziq}/><path {...chiziq} d="M7 16h10v4H7z"/></Ramka>;
}
// Ulanish nuqtasi — emoji 🟢/🔴 o'rniga. Emoji rangini boshqarib
// bo'lmasdi va har OS da boshqa o'lchamda chiqardi.
export function Nuqta({ ok }) {
  return (
    <span className="inline-block rounded-full shrink-0"
          style={{ width: 8, height: 8,
                   background: ok ? 'var(--color-asos-500)' : '#ef4444' }}
          aria-hidden />
  );
}
