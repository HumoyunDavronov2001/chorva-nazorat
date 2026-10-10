// APP — panel qobig'i: kirish darvozasi, yon menyu, marshrut.
//
// MAVZU BITTA — OQ. Ilgari to'q mavzu ham bor edi va operatsion tizim
// to'q rejimda bo'lsa panel O'ZI to'qqa o'tardi. Idorada ekran
// proyektorga uzatiladi, hujjat qog'ozga bosiladi va bir necha xodim
// bir xil ekranni ko'radi — bunda mavzu "kimningdir sozlamasiga"
// bog'liq bo'lmasligi kerak. Panel har doim oq.
//
// Marshrut ATAYLAB oddiy (kutubxonasiz): panelda 6 ta bo'lim bor va
// ular URL manzilida ko'rinishi kerak (nazoratchi havolani hamkasbiga
// yuborishi mumkin). location.hash yetarli — qo'shimcha bog'liqlik yo'q.

import { useCallback, useEffect, useState } from 'react';
import { api, ApiXato } from './api.js';
import { sanaToliq, vaqt } from './format.js';
import { Yuklanmoqda } from './komp/asos.jsx';
import XatoTutqich from './komp/XatoTutqich.jsx';
import Kirish from './sahifa/Kirish.jsx';
import Bozorlar from './sahifa/Bozorlar.jsx';
import Bozor from './sahifa/Bozor.jsx';
import Statistika from './sahifa/Statistika.jsx';
import Litsenziya from './sahifa/Litsenziya.jsx';
import Sozlamalar from './sahifa/Sozlamalar.jsx';
import { Logo, BelgiBozor, BelgiStatistika, BelgiKalit, BelgiSozlama,
         BelgiOdam, BelgiKoz, BelgiMenyu } from './komp/Belgi.jsx';

const BOLIMLAR = [
  { kalit: 'bozorlar', nom: 'Bozorlar', Belgi: BelgiBozor,
    izoh: 'Bugungi holat, xarita va bozorlar roʻyxati' },
  { kalit: 'statistika', nom: 'Statistika', Belgi: BelgiStatistika,
    izoh: 'Kunlik sanoq va kassa — tur boʻyicha aniq raqamlar' },
  { kalit: 'litsenziya', nom: 'Litsenziya', Belgi: BelgiKalit, faqatAdmin: true,
    izoh: 'Kalit chiqarish va bekor qilish' },
  { kalit: 'sozlamalar', nom: 'Sozlamalar', Belgi: BelgiSozlama,
    izoh: 'Bozorlar reyestri, dastur yuklash, audit jurnali' },
];

function marshrutOq() {
  const h = (location.hash || '#bozorlar').slice(1);
  const [bolim, arg] = h.split('/');
  return { bolim: bolim || 'bozorlar', arg: arg ? Number(arg) : 0 };
}

export default function App() {
  const [kim, setKim] = useState(null);          // null = tekshirilmoqda
  const [marshrut, setMarshrut] = useState(marshrutOq);
  const [menyu, setMenyu] = useState(false);
  const [sessiyaTugadi, setSessiyaTugadi] = useState(false);

  useEffect(() => {
    const f = () => { setMarshrut(marshrutOq()); setMenyu(false); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  useEffect(() => {
    api.men().then(setKim).catch(() => setKim({ kirgan: false }));
  }, []);

  // Sahifa sarlavhasi brauzer tabida ham ko'rinsin (idorada bir necha
  // tab ochiq turadi)
  useEffect(() => {
    const b = BOLIMLAR.find((x) => x.kalit === marshrut.bolim);
    document.title = b ? `${b.nom} · CHORVA NAZORAT` : 'CHORVA NAZORAT';
  }, [marshrut.bolim]);

  // Sessiya tugasa — kirish ekraniga, LEKIN sababni aytib
  const xatoUshla = useCallback((e) => {
    if (e instanceof ApiXato && e.holat === 401) {
      setSessiyaTugadi(true);
      setKim({ kirgan: false });
    }
  }, []);

  const chiq = async () => {
    try { await api.chiqish(); } catch { /* baribir chiqamiz */ }
    setSessiyaTugadi(false);
    setKim({ kirgan: false });
  };

  if (!kim) return <div className="p-10"><Yuklanmoqda matn="Tekshirilmoqda…" /></div>;
  if (!kim.kirgan) {
    return (
      <Kirish sessiyaTugadi={sessiyaTugadi}
              tugadi={(rol) => {
                setSessiyaTugadi(false);
                // Rolni darhol qo'yamiz (ekran kutib qolmasin), lekin
                // /api/men ni QAYTA so'raymiz: server sozlamalari
                // (api_url, xarita_plitka) faqat shu javobda keladi.
                // Ilgari ular kirgandan keyin BO'SH qolib, xarita sxema
                // rejimiga tushib qolardi va yangi bozor kartasida
                // server manzili noto'g'ri ko'rsatilardi.
                setKim({ kirgan: true, rol });
                api.men().then((m) => m?.kirgan && setKim(m)).catch(() => {});
              }} />
    );
  }

  const bolimlar = BOLIMLAR.filter((b) => !b.faqatAdmin || kim.rol === 'admin');
  const joriy = BOLIMLAR.find((b) => b.kalit === marshrut.bolim);
  const Sahifa = { bozorlar: Bozorlar, statistika: Statistika,
                   litsenziya: Litsenziya, sozlamalar: Sozlamalar,
                   bozor: Bozor }[marshrut.bolim] || Bozorlar;

  return (
    <div className="min-h-screen flex">
      <a href="#mazmun" className="sr-only otish-havola">Mazmunga oʻtish</a>

      {/* ── Yon menyu ──
          h-screen + flex-col SHART: ilgari "h-full" edi va ota-element
          balandligi aniqlanmagani uchun pastdagi blok menyu ustiga
          chiqib qolardi. */}
      <aside className={'fixed md:sticky top-0 z-30 h-screen w-60 shrink-0 border-r ' +
                        'flex flex-col transition-transform md:translate-x-0 ' +
                        (menyu ? 'translate-x-0' : '-translate-x-full')}
             style={{ borderColor: 'var(--chegara)', background: 'var(--panel)' }}>
        <div className="px-4 py-4 flex items-center gap-2.5 border-b"
             style={{ borderColor: 'var(--chegara)' }}>
          <Logo olcham={36} />
          <div className="min-w-0">
            <div className="font-bold leading-tight">CHORVA NAZORAT</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--matn-3)' }}>
              markaziy nazorat serveri
            </div>
          </div>
        </div>

        <nav className="px-2 py-2 flex flex-col gap-0.5 flex-1 overflow-y-auto"
             aria-label="Asosiy menyu">
          {bolimlar.map((b) => {
            const faol = marshrut.bolim === b.kalit ||
                         (b.kalit === 'bozorlar' && marshrut.bolim === 'bozor');
            return (
              <a key={b.kalit} href={'#' + b.kalit} title={b.izoh}
                 aria-current={faol ? 'page' : undefined}
                 className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5"
                 style={faol
                   ? { background: 'color-mix(in srgb, var(--color-asos-500) 14%, transparent)',
                       color: 'var(--color-asos-600)' }
                   : { color: 'var(--matn-2)' }}>
                <b.Belgi olcham={18} />{b.nom}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto p-3 text-xs border-t"
             style={{ color: 'var(--matn-3)', borderColor: 'var(--chegara)' }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="truncate">
              {kim.rol === 'admin'
                ? <><BelgiOdam olcham={14} /> Administrator</>
                : <><BelgiKoz olcham={14} /> Nazoratchi</>}
            </span>
            <button onClick={chiq} className="underline shrink-0">chiqish</button>
          </div>
        </div>
      </aside>

      {menyu && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden"
             onClick={() => setMenyu(false)} aria-hidden />
      )}

      {/* ── Asosiy qism ── */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 border-b px-4 py-2.5 flex items-center gap-3"
                style={{ borderColor: 'var(--chegara)',
                         background: 'color-mix(in srgb, var(--fon) 88%, transparent)',
                         backdropFilter: 'blur(8px)' }}>
          <button className="md:hidden px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--chegara)' }}
                  onClick={() => setMenyu(true)} aria-label="Menyuni ochish"><BelgiMenyu olcham={20} /></button>
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">
              {joriy ? joriy.nom : (marshrut.bolim === 'bozor' ? 'Bozor tafsiloti' : '')}
            </div>
            <div className="text-[11px] truncate chop-yashir" style={{ color: 'var(--matn-3)' }}>
              {joriy ? joriy.izoh : 'Bitta bozorning toʻliq holati'}
            </div>
          </div>
          <div className="flex-1" />
          <Soat />
        </header>

        {/* Chop etishda qog'ozning boshiga rasmiy sarlavha chiqadi */}
        <div className="chop-sarlavha" style={{ padding: '0 0 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            CHORVA NAZORAT — {joriy ? joriy.nom : 'Bozor tafsiloti'}
          </div>
          <div style={{ fontSize: 12 }}>
            Chop etilgan: {sanaToliq(new Date(), true)} · {vaqt(new Date())} ·{' '}
            {kim.rol === 'admin' ? 'Administrator' : 'Nazoratchi'}
          </div>
        </div>

        <main id="mazmun" className="p-4 md:p-6 max-w-[1500px]">
          <XatoTutqich key={marshrut.bolim + marshrut.arg}>
            <Sahifa rol={kim.rol} arg={marshrut.arg} xatoUshla={xatoUshla}
                    sozlama={kim} />
          </XatoTutqich>
        </main>
      </div>
    </div>
  );
}

function Soat() {
  const [hozir, setHozir] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setHozir(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right leading-tight shrink-0">
      <div className="text-xs font-medium tabular-nums">{vaqt(hozir, true)}</div>
      <div className="text-[11px]" style={{ color: 'var(--matn-3)' }}>
        {sanaToliq(hozir, true)}
      </div>
    </div>
  );
}
