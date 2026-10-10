// ASOSIY KOMPONENTLAR — kartalar, KPI, jadval, yuklanish va XATO holatlari.
//
// Bu fayl panelning "ko'rinish tili": har bo'lim shu komponentlardan
// yig'iladi, shuning uchun tajriba hamma joyda BIR XIL bo'ladi —
// yuklanish ham, xato ham, bo'sh holat ham.
//
// Davlat idorasi uchun muhim qoidalar shu yerda bajarilgan:
//   * jadval sarlavhasi aylantirilganda yopishib turadi (uzun ro'yxat);
//   * har jadvalni CSV ga olish mumkin (Excel bilan ishlanadi);
//   * chop etishda ortiqcha narsa bosilmaydi (@media print);
//   * har ustun to'g'ri belgilangan (scope="col") — ekran o'quvchi uchun.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { csvYukla } from '../format.js';

/* ── Ma'lumot yuklovchi ilmoq ──
   Har doim uchta holat qaytaradi: yuklanmoqda / xato / ma'lumot.
   `oxirgiYangilangan` — foydalanuvchi ma'lumot qachonlik ekanini
   bilishi uchun (avtomatik yangilanadigan ekranlarda shart). */
export function useSorov(fn, bogliq = [], { interval = 0 } = {}) {
  const [holat, setHolat] = useState({
    yuklanmoqda: true, xato: null, malumot: null, oxirgiYangilangan: null,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const yukla = useCallback(async (jim = false) => {
    if (!jim) setHolat((h) => ({ ...h, yuklanmoqda: true, xato: null }));
    try {
      const m = await fnRef.current();
      setHolat({ yuklanmoqda: false, xato: null, malumot: m, oxirgiYangilangan: new Date() });
    } catch (e) {
      setHolat((h) => ({ ...h, yuklanmoqda: false, xato: e,
                         malumot: jim ? h.malumot : null }));
    }
  }, []);

  useEffect(() => {
    yukla();
    if (!interval) return undefined;
    const t = setInterval(() => yukla(true), interval);
    // Ko'rinmaydigan tab bekorga so'rov yubormasin (server yuki va
    // noutbukda batareya)
    const korinish = () => { if (!document.hidden) yukla(true); };
    document.addEventListener('visibilitychange', korinish);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', korinish); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, bogliq);

  return { ...holat, yangila: yukla };
}

/* ── YUKLANISH ──
   Skelet (kul rang bloklar) aylanma belgidan afzal: sahifa tuzilishi
   darhol ko'rinadi va ma'lumot kelganda "sakrash" bo'lmaydi. */
// ── RAQAM SANAB CHIQISHI ──
// Bu SANOQ tizimi: raqamning 0 dan haqiqiy qiymatga o'sib borishi
// mahsulot qiladigan ishning o'zini takrorlaydi.
//
// Uchta ehtiyot chorasi:
//   1. Faqat SON uchun. Qiymat matn bo'lsa (masalan "12 340 so'm"
//      yoki "—") o'zgarishsiz qaytariladi, aks holda ekranda axlat
//      chiqardi.
//   2. prefers-reduced-motion so'ralsa darhol oxirgi qiymat.
//   3. Katta sakrashda ham davomiylik qat'iy — 700 ms. Uzunroq bo'lsa
//      nazoratchi raqam "qotib qolgan" deb o'ylardi.
export function useSanoq(qiymat, davomiylik = 700) {
  const son = typeof qiymat === 'number' && Number.isFinite(qiymat);
  // NOLDAN BOSHLAYMIZ. Ilgari boshlang'ich holat darhol yakuniy
  // qiymatga qo'yilardi — KPI esa ma'lumot KELGANDAN KEYIN paydo
  // bo'ladi, ya'ni birinchi ko'rinishda sanashga o'rin qolmasdi va
  // animatsiya hech qachon ishlamasdi (o'lchandi: 30 ms da allaqachon
  // 2 395 turardi).
  const [joriy, setJoriy] = useState(0);
  const oldingi = useRef(0);

  useEffect(() => {
    if (!son) return;
    const kam = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bosh = oldingi.current;
    if (kam || bosh === qiymat) {
      oldingi.current = qiymat;
      setJoriy(qiymat);
      return;
    }
    let ram = 0;
    const t0 = performance.now();
    const yur = (t) => {
      const p = Math.min(1, (t - t0) / davomiylik);
      // easeOutCubic — oxirida sekinlashadi, tabiiy ko'rinadi
      const e = 1 - Math.pow(1 - p, 3);
      setJoriy(Math.round(bosh + (qiymat - bosh) * e));
      if (p < 1) ram = requestAnimationFrame(yur);
      else oldingi.current = qiymat;
    };
    ram = requestAnimationFrame(yur);
    return () => cancelAnimationFrame(ram);
  }, [qiymat, son, davomiylik]);

  return son ? joriy : qiymat;
}

export function Skelet({ qator = 5, balandlik = 16 }) {
  return (
    <div className="flex flex-col gap-2 py-1" aria-busy="true" aria-live="polite">
      {Array.from({ length: qator }, (_, i) => (
        <div key={i} className="rounded cn-skelet"
             style={{ height: balandlik,
                      width: `${100 - (i % 3) * 12}%` }} />
      ))}
      <span className="sr-only">Yuklanmoqda…</span>
    </div>
  );
}

export function Yuklanmoqda({ matn = 'Yuklanmoqda…' }) {
  return (
    <div className="flex items-center gap-3 p-8 justify-center" aria-live="polite"
         style={{ color: 'var(--matn-3)' }}>
      <span className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--chegara)', borderTopColor: 'var(--color-asos-500)' }} />
      {matn}
    </div>
  );
}

/* ── XATO ──
   SABAB + nima qilish kerak + qayta urinish. Tugma sahifani QAYTA
   YUKLAMAYDI (ilgari location.reload() edi va foydalanuvchini tizimdan
   chiqarib yuborardi). */
export function XatoPanel({ xato, qayta, izoh }) {
  const xabar = String(xato?.message || xato || 'nomaʼlum xato');
  const aloqaYoq = /aloqa|server|tarmoq|fetch/i.test(xabar);
  return (
    <div className="rounded-xl border p-5" role="alert"
         style={{ borderColor: 'rgba(239,68,68,.35)', background: 'var(--panel)' }}>
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden>⚠</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold" style={{ color: '#ef4444' }}>Yuklanmadi</div>
          <div className="mt-1 text-sm break-words" style={{ color: 'var(--matn-2)' }}>{xabar}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--matn-3)' }}>
            {izoh || (aloqaYoq
              ? 'Server oʻchgan yoki tarmoq uzilgan boʻlishi mumkin. '
                + 'Bir necha soniyadan keyin qayta urinib koʻring.'
              : 'Muammo takrorlansa qoʻllab-quvvatlashga xabar bering.')}
          </div>
          {qayta && (
            <button onClick={() => qayta()}
                    className="mt-3 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--color-asos-600)', color: '#fff' }}>
              Qayta urinish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Kart({ sarlavha, izoh, ong, children, className = '', chopEt = true }) {
  return (
    // min-w-0 SHART: karta grid/flex ichida turadi, ularning elementi esa
    // sukut bo'yicha `min-width: auto` — ya'ni ichidagi jadvaldan KICHIK
    // bo'la olmaydi. Natijada telefonda jadval kartani, karta esa butun
    // sahifani kengaytirib yuborardi va EKRAN YONBOSHGA SURILARDI
    // (390 px ekranda 506 px kontent). `.jadval-orash` dagi overflow-x
    // ham aynan shu sababdan ishlamasdi.
    <section className={'rounded-xl border min-w-0 cn-kart ' + className + (chopEt ? '' : ' chop-yashir')}
             style={{ borderColor: 'var(--chegara)', background: 'var(--panel)',
                      boxShadow: 'var(--soya)' }}>
      {(sarlavha || ong) && (
        <header className="flex flex-wrap items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: 'var(--chegara)' }}>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide uppercase"
                style={{ color: 'var(--matn-2)' }}>{sarlavha}</h3>
            {izoh && <p className="text-xs mt-0.5" style={{ color: 'var(--matn-3)' }}>{izoh}</p>}
          </div>
          <div className="flex-1" />
          {ong}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/* KPI kartasi. `holat` — 'yaxshi' | 'ogoh' | 'xavf' | undefined */
const HOLAT_RANG = {
  yaxshi: 'var(--color-asos-600)', ogoh: '#f59e0b', xavf: '#ef4444',
};
// `qiymat` XOM SON bo'lsa raqam sanab chiqadi; `format` esa uni
// ko'rsatishdan oldin bezaydi (masalan mingliklarni ajratadi).
// Ilgari chaqiruvchilar soz(...) natijasini — MATNNI — uzatishardi,
// shuning uchun sanash hech qachon ishlamasdi.
export function Kpi({ nom, qiymat, izoh, holat, belgi, yuklanmoqda,
                     kechikish, format }) {
  const son = useSanoq(qiymat);
  const korinadigan = format && typeof son === 'number' ? format(son) : son;
  return (
    <div className={'rounded-xl border px-4 py-3 min-w-0 cn-kart cn-kir'
                    + (kechikish ? ' cn-kir-' + kechikish : '')}
         style={{ borderColor: 'var(--chegara)', background: 'var(--panel)',
                  boxShadow: 'var(--soya)' }}>
      <div className="text-[11px] uppercase tracking-wider flex items-center gap-1.5 truncate"
           style={{ color: 'var(--matn-3)' }}>
        {/* `belgi` — matn (masalan ↑) yoki SVG komponent bo'lishi mumkin */}
        {typeof belgi === 'function'
          ? (() => { const B = belgi; return <B olcham={14} />; })()
          : (belgi && <span aria-hidden>{belgi}</span>)}
        {nom}
      </div>
      {yuklanmoqda ? (
        <div className="h-8 mt-1.5 rounded cn-skelet" />
      ) : (
        <div className="text-[26px] leading-tight font-bold mt-1 tabular-nums truncate"
             style={{ color: HOLAT_RANG[holat] || 'var(--matn)' }} title={String(qiymat)}>
          {korinadigan}
        </div>
      )}
      {izoh && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--matn-3)' }}
                    title={izoh}>{izoh}</div>}
    </div>
  );
}

export function Teg({ children, holat, rang }) {
  const r = rang || HOLAT_RANG[holat] || 'var(--matn-3)';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                     whitespace-nowrap"
          style={{ color: r, background: `color-mix(in srgb, ${r} 13%, transparent)` }}>
      {children}
    </span>
  );
}

export function Tugma({ turi = 'oddiy', kichik, children, ...qolgan }) {
  const uslub = {
    asosiy: { background: 'var(--color-asos-600)', color: '#fff', borderColor: 'transparent' },
    xavf: { background: 'transparent', color: '#ef4444', borderColor: 'rgba(239,68,68,.4)' },
    oddiy: { background: 'var(--panel-2)', color: 'var(--matn)', borderColor: 'var(--chegara)' },
  }[turi];
  return (
    <button type="button" {...qolgan}
            className={(kichik ? 'px-2 py-1 text-xs ' : 'px-3 py-1.5 text-sm ') +
                       'rounded-lg font-medium border transition whitespace-nowrap ' +
                       'disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 ' +
                       (qolgan.className || '')}
            style={{ ...uslub, ...(qolgan.style || {}) }}>
      {children}
    </button>
  );
}

// ── AMALLAR MENYUSI ──
//
// NEGA: bozorlar reyestrida har qatorda BESHTA tugma turardi (Tahrir,
// Superni bloklash, Kalit, To'xtatish, O'chirish) — besh bozorda 25 ta
// tugma. Ikki zarari bor edi:
//   1) ko'z qayerga qarashni bilmaydi, jadval tugmalar devoriga aylanadi
//      va tor ekranda ular buzilib o'raladi;
//   2) QAYTARIB BO'LMAYDIGAN "O'chirish" kundalik "Tahrir" yonida
//      turardi — bir piksel xato bilan butun bozor tarixi o'chardi.
// Endi amallar menyuda, xavfli amal esa alohida, ajratkichdan keyin.
export function Amallar({ elementlar, yorliq = 'Amallar' }) {
  const [ochiq, setOchiq] = useState(false);
  const orash = useRef(null);

  useEffect(() => {
    if (!ochiq) return undefined;
    const tashqari = (e) => { if (!orash.current?.contains(e.target)) setOchiq(false); };
    const esc = (e) => { if (e.key === 'Escape') setOchiq(false); };
    document.addEventListener('mousedown', tashqari);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', tashqari);
      document.removeEventListener('keydown', esc);
    };
  }, [ochiq]);

  const kor = elementlar.filter(Boolean);
  return (
    <div className="relative inline-block text-left" ref={orash}>
      <Tugma kichik aria-haspopup="menu" aria-expanded={ochiq} aria-label={yorliq}
             onClick={() => setOchiq((x) => !x)}>⋯</Tugma>
      {ochiq && (
        <div role="menu"
             className="absolute right-0 mt-1 z-30 min-w-44 rounded-lg border py-1 text-left"
             style={{ background: 'var(--panel)', borderColor: 'var(--chegara)',
                      boxShadow: '0 8px 24px rgba(16,24,40,.12)' }}>
          {kor.map((e, i) => (
            <div key={e.nom}>
              {e.ajrat && i > 0 && (
                <div className="my-1 border-t" style={{ borderColor: 'var(--chegara)' }} />
              )}
              <button type="button" role="menuitem"
                      onClick={() => { setOchiq(false); e.bosildi(); }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:brightness-95"
                      style={{ color: e.xavf ? '#dc2626' : 'var(--matn)',
                               background: 'transparent' }}>
                {e.nom}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// BO'SH HOLAT. `belgi` — SVG komponent (tavsiya) yoki matn.
// Emoji ishlatilmaydi: har OS da boshqacha chiziladi va bosmada dog'
// bo'lib chiqadi.
export function Bosh({ children, belgi }) {
  const B = typeof belgi === 'function' ? belgi : null;
  return (
    <div className="text-center py-10" style={{ color: 'var(--matn-3)' }}>
      {B ? <div className="flex justify-center mb-2" style={{ opacity: .5 }}>
             <B olcham={32} />
           </div>
         : belgi ? <div className="text-3xl mb-2" aria-hidden>{belgi}</div> : null}
      <div className="text-sm">{children}</div>
    </div>
  );
}

/* ── JADVAL ──
   ustunlar: [{nom, maydon?, chiz?, ong?, mono?, csv?, saralash?}]
   csv    — CSV ga qanday yozilishi (bo'lmasa maydon/chiz matni)
   saralash — solishtirish uchun qiymat (bo'lsa ustun sarlavhasi bosiladi) */
export function Jadval({ ustunlar, qatorlar, kalit, bosh = 'Maʼlumot yoʻq',
                         csvNom, jami, yopishqoq = true }) {
  const [saralash, setSaralash] = useState(null);   // {i, teskari}

  const kSaralangan = useMemo(() => {
    if (!saralash || !ustunlar[saralash.i]?.saralash) return qatorlar;
    const f = ustunlar[saralash.i].saralash;
    const n = [...(qatorlar || [])].sort((a, b) => {
      const x = f(a), y = f(b);
      if (typeof x === 'number' && typeof y === 'number') return x - y;
      return String(x).localeCompare(String(y), 'uz');
    });
    return saralash.teskari ? n.reverse() : n;
  }, [qatorlar, saralash, ustunlar]);

  if (!qatorlar?.length) return <Bosh>{bosh}</Bosh>;

  const csv = () => csvYukla(csvNom || 'jadval',
    ustunlar.filter((u) => u.nom).map((u) => ({
      nom: u.nom,
      qiymat: (q) => (u.csv ? u.csv(q) : (u.maydon ? q[u.maydon] : '')),
    })), kSaralangan);

  return (
    <div>
      {csvNom && (
        <div className="flex justify-end mb-2 chop-yashir">
          <Tugma kichik onClick={csv} title="Excel uchun CSV fayl">
            ⬇ CSV ga olish
          </Tugma>
        </div>
      )}
      <div className="jadval-orash">
        <table className="w-full text-sm border-collapse">
          <thead className={yopishqoq ? 'jadval-bosh' : ''}>
            <tr>
              {ustunlar.map((u, i) => (
                <th key={u.nom || i} scope="col"
                    onClick={() => u.saralash && setSaralash(
                      (s) => (s?.i === i ? { i, teskari: !s.teskari } : { i, teskari: false }))}
                    className={'text-left font-medium px-3 py-2 border-b whitespace-nowrap ' +
                               (u.ong ? 'text-right ' : '') +
                               (u.saralash ? 'cursor-pointer select-none' : '')}
                    style={{ color: 'var(--matn-3)', borderColor: 'var(--chegara)',
                             background: 'var(--panel)' }}>
                  {u.nom}
                  {u.saralash && (
                    <span className="ml-1 opacity-60" aria-hidden>
                      {saralash?.i === i ? (saralash.teskari ? '▼' : '▲') : '↕'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kSaralangan.map((q, i) => (
              <tr key={kalit ? kalit(q) : i} className="jadval-qator">
                {ustunlar.map((u, j) => (
                  <td key={u.nom || j}
                      className={'px-3 py-2 border-b ' +
                                 (u.ong ? 'text-right tabular-nums ' : '') +
                                 (u.mono ? 'font-mono text-xs ' : '')}
                      style={{ borderColor: 'var(--chegara)' }}>
                    {u.chiz ? u.chiz(q) : q[u.maydon]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {jami && (
            <tfoot>
              <tr>
                {ustunlar.map((u, j) => (
                  <td key={u.nom || j}
                      className={'px-3 py-2 font-semibold border-t-2 ' +
                                 (u.ong ? 'text-right tabular-nums' : '')}
                      style={{ borderColor: 'var(--chegara)' }}>
                    {jami[j] ?? ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* Sana oralig'ini tanlash — bir necha bo'limda bir xil ishlaydi */
export function OraliqTanlash({ dan, gacha, ozgardi, tezTanlov = true }) {
  const kirit = 'px-2 py-1 rounded-lg border text-sm';
  const uslub = { borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                  color: 'var(--matn)' };
  const tez = (kun) => {
    const g = new Date();
    const d = new Date(Date.now() - (kun - 1) * 86400000);
    const s = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    ozgardi(s(d), s(g));
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" value={dan} max={gacha} aria-label="Boshlanish sanasi"
             onChange={(e) => ozgardi(e.target.value, gacha)}
             className={kirit} style={uslub} />
      <span style={{ color: 'var(--matn-3)' }}>—</span>
      <input type="date" value={gacha} min={dan} aria-label="Tugash sanasi"
             onChange={(e) => ozgardi(dan, e.target.value)}
             className={kirit} style={uslub} />
      {tezTanlov && (
        <div className="flex gap-1 chop-yashir">
          {[[7, '7 kun'], [14, '14 kun'], [30, '30 kun'], [90, '3 oy']].map(([k, n]) => (
            <Tugma key={k} kichik onClick={() => tez(k)}>{n}</Tugma>
          ))}
        </div>
      )}
    </div>
  );
}
