// BOZOR TAFSILOTI — bitta bozorning hamma qismi:
//   jonli kamera · dastur holati · cheklar · video yozuvlar · sanoq/zanjir
//
// Markaz bozorga to'g'ridan-to'g'ri ULANMAYDI (bozor NAT ortida):
// panel "surat kerak" deb belgi qo'yadi, bozor dasturi keyingi sinxda
// (2 soniya) kadrni o'zi yuboradi. Shuning uchun kutish ekranida ham
// SABAB yozilgan — foydalanuvchi "nega darhol emas" deb o'ylamasin.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { soz, pul, sana, hajm, aloqaMatn, sanaStr, kunOldin } from '../format.js';
import { useSorov, Skelet, Yuklanmoqda, XatoPanel, Kart, Kpi, Jadval, Teg, Tugma, Bosh }
  from '../komp/asos.jsx';
import { SanoqTurlari, KassaTurlari } from '../komp/Turlar.jsx';
import { BelgiChiqdi, BelgiChek, BelgiBosh, BelgiPul, BelgiSoat, BelgiVideo,
         BelgiQulf, BelgiKamera, BelgiQalam, BelgiStatistika, Nuqta } from '../komp/Belgi.jsx';

// Bo'limlar: [kalit, nom, SVG belgi]
const BOLIMLAR = [
  ['sanoq', 'Kunlik sanoq va zanjir', BelgiStatistika],
  ['turlar', 'Turlar boʻyicha', BelgiBosh],
  ['cheklar', 'Cheklar', BelgiChek],
  ['jonli', 'Jonli kamera', BelgiKamera],
  ['holat', 'Dastur holati', BelgiSoat],
  ['yozuvlar', 'Video yozuvlar', BelgiVideo],
  ['qolda', 'Qoʻlda kiritish', BelgiQalam],
];

export default function Bozor({ arg: id, rol, xatoUshla }) {
  // STANDART BO'LIM — RAQAMLAR, JONLI KAMERA EMAS.
  // Ilgari sahifa "Jonli kamera" dan ochilardi: aloqasi yo'q bozorda bu
  // 300 px qora quti va abadiy "surat so'ralmoqda..." degani edi. Eng
  // ko'p kerak bo'ladigan narsa — kunlik sanoq va zanjir.
  const [bolim, setBolim] = useState('sanoq');
  const { yuklanmoqda, xato, malumot, yangila } =
    useSorov(() => api.ol(`/api/bozor?id=${id}&dan=${kunOldin(13)}&gacha=${sanaStr()}`), [id]);

  if (xato) xatoUshla?.(xato);
  if (yuklanmoqda) {
    return (
      <div className="flex flex-col gap-4">
        <Skelet qator={2} balandlik={24} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => <Kpi key={i} nom="" qiymat="" yuklanmoqda />)}
        </div>
        <Skelet qator={6} />
      </div>
    );
  }
  if (xato) return <XatoPanel xato={xato} qayta={yangila} />;

  const b = malumot;
  const jonli = b.aloqa_s >= 0 && b.aloqa_s < 180;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <a href="#bozorlar" className="px-3 py-1.5 rounded-lg border text-sm"
           style={{ borderColor: 'var(--chegara)' }}>← Roʻyxatga</a>
        <div>
          <div className="text-lg font-bold">{b.nom}</div>
          <div className="text-xs" style={{ color: 'var(--matn-3)' }}>
            {b.hudud}{b.stir ? ` · STIR ${b.stir}` : ' · STIR yoʻq'} ·{' '}
            <span style={{ color: jonli ? 'var(--color-asos-600)' : '#ef4444' }}>
              {aloqaMatn(b.aloqa_s)}
            </span>
          </div>
        </div>
        <div className="flex-1" />
        {!b.faol && <Teg holat="xavf">toʻxtatilgan</Teg>}
        {!b.super_ruxsat && <Teg holat="ogoh">super-admin bloklangan</Teg>}
        {b.versiya && <Teg>dastur v{b.versiya}</Teg>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi nom="14 kun · chiqdi" belgi={BelgiChiqdi} qiymat={soz(b.jami.chiqdi)}
             izoh={`kirdi ${soz(b.jami.kirdi)}`} />
        <Kpi nom="Cheklar" belgi={BelgiChek} qiymat={soz(b.jami.chek_soni)} />
        <Kpi nom="Chek boshi" belgi={BelgiBosh} qiymat={soz(b.jami.chek_bosh)}
             izoh="chekdagi jonli hayvon" />
        <Kpi nom="Tushum" belgi={BelgiPul}
             /* ANIQ SON HAM EKRANDA BO'LSIN. Ilgari kartada "96,8 mln",
                pastdagi jadvalda esa "96 805 000" turardi — bitta ekranda
                bitta son ikki xil, davlat hisobotida bu nomuvofiqlik
                bo'lib ko'rinadi. Endi yirik raqam — qisqa, ostidagi izoh
                — aniq qiymat: ikkalasi yonma-yon, qarama-qarshi emas. */
             qiymat={b.jami.chek_yoq ? '—'
               : pul(b.jami.chek_summa, { qisqa: true, valyuta: false })}
             izoh={b.jami.chek_yoq ? 'hali chek berilmagan'
                                   : pul(b.jami.chek_summa)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {BOLIMLAR.map(([k, nom, B]) => (
          <button key={k} onClick={() => setBolim(k)}
                  aria-pressed={bolim === k}
                  className="px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2"
                  style={bolim === k
                    ? { background: 'var(--color-asos-600)', color: '#fff', borderColor: 'transparent' }
                    : { borderColor: 'var(--chegara)', background: 'var(--panel-2)' }}>
            <B olcham={16} />{nom}
          </button>
        ))}
      </div>

      {bolim === 'jonli' && <JonliKamera id={id} />}
      {bolim === 'holat' && <DasturHolati id={id} />}
      {bolim === 'cheklar' && <Cheklar id={id} />}
      {bolim === 'yozuvlar' && <Yozuvlar id={id} />}
      {bolim === 'turlar' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <SanoqTurlari turlar={b.sanoq_turlar} turMaydoniBor={b.tur_maydoni_bor} />
          <KassaTurlari turlar={b.kassa_turlar} />
        </div>
      )}
      {bolim === 'sanoq' && <Sanoq id={id} kunlar={b.kunlar} />}
      {bolim === 'qolda' && <QoldaSanoq id={id} rol={rol} yangila={yangila} />}
    </div>
  );
}

/* ── JONLI KAMERA ── */
function JonliKamera({ id }) {
  const [kam, setKam] = useState(0);
  const texnik = useSorov(() => api.ol(`/api/bozor_texnik?id=${id}`), [id]);
  const [surat, setSurat] = useState(null);
  const [suratXato, setSuratXato] = useState('');

  useEffect(() => {
    let toxta = false;
    const ol = async () => {
      try {
        const j = await api.ol(`/api/jonli?id=${id}&kam=${kam}`);
        if (!toxta) { setSurat(j.jpeg ? j : null); setSuratXato(''); }
      } catch (e) {
        if (!toxta) setSuratXato(e.message);
      }
    };
    ol();
    const t = setInterval(ol, 2000);
    return () => { toxta = true; clearInterval(t); };
  }, [id, kam]);

  const kameralar = texnik.malumot?.holat?.kameralar || [];

  return (
    <Kart sarlavha="Jonli kamera (masofadan)">
      {texnik.xato ? (
        <XatoPanel xato={texnik.xato} qayta={texnik.yangila} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {kameralar.length === 0 && (
              <span className="text-sm" style={{ color: 'var(--matn-3)' }}>
                Kamera roʻyxati hali kelmagan (bozor dasturi keyingi sinxda yuboradi)
              </span>
            )}
            {kameralar.map((c, i) => (
              <button key={i} onClick={() => setKam(i)}
                      className="px-3 py-1.5 rounded-lg text-sm border"
                      style={kam === i
                        ? { background: 'var(--color-asos-600)', color: '#fff', borderColor: 'transparent' }
                        : { borderColor: 'var(--chegara)', background: 'var(--panel-2)' }}>
                <Nuqta ok={c.ulangan} /> {c.nom}
              </button>
            ))}
          </div>

          <div className="rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]"
               style={{ background: '#000' }}>
            {surat ? (
              <img src={`data:image/jpeg;base64,${surat.jpeg}`} alt="kamera kadri"
                   className="w-full" />
            ) : (
              <div className="text-center text-sm p-6" style={{ color: '#9aa4b2' }}>
                {suratXato
                  ? <span style={{ color: '#ef4444' }}>Surat olinmadi: {suratXato}</span>
                  : 'Kamera surati soʻralmoqda… (bozor dasturi 2 soniyada javob beradi)'}
              </div>
            )}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--matn-3)' }}>
            {surat ? `Kadr yoshi: ${surat.yosh_s} s · ` : ''}
            Markaz bozorga toʻgʻridan-toʻgʻri ulanmaydi — soʻrov bozor dasturiga
            yuboriladi, u kadrni oʻzi joʻnatadi.
          </div>
        </>
      )}
    </Kart>
  );
}

/* ── DASTUR HOLATI ── */
function DasturHolati({ id }) {
  const { yuklanmoqda, xato, malumot, yangila } =
    useSorov(() => api.ol(`/api/bozor_texnik?id=${id}`), [id], { interval: 20000 });
  if (yuklanmoqda) {
    return (
      <div className="flex flex-col gap-4">
        <Skelet qator={2} balandlik={24} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => <Kpi key={i} nom="" qiymat="" yuklanmoqda />)}
        </div>
        <Skelet qator={6} />
      </div>
    );
  }
  if (xato) return <XatoPanel xato={xato} qayta={yangila} />;

  const h = malumot?.holat;
  if (!h) return (
    <Kart sarlavha="Dastur holati">
      <Bosh belgi={BelgiSoat}>Holat hali kelmagan — bozor dasturi keyingi sinxda yuboradi.</Bosh>
    </Kart>
  );
  const t = h.texnik || {};
  const up = t.uptime_s || 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi nom="Kameralar" qiymat={`${(h.kameralar || []).filter((c) => c.ulangan).length}/${(h.kameralar || []).length}`} />
        <Kpi nom="GPU yuki" qiymat={t.gpu?.yuk != null ? `${t.gpu.yuk}%` : '—'}
             izoh={t.gpu?.nom} />
        <Kpi nom="Disk" qiymat={t.disk?.bosh_gb != null ? `${t.disk.bosh_gb} GB` : '—'}
             izoh="boʻsh joy" />
        <Kpi nom="Ishlash vaqti"
             qiymat={up > 3600 ? `${Math.floor(up / 3600)} s ${Math.floor((up % 3600) / 60)} d`
                               : `${Math.floor(up / 60)} daqiqa`}
             izoh={`holat yoshi ${malumot.yosh_s} s`} />
      </div>
      <Kart sarlavha="Kameralar">
        <Jadval qatorlar={h.kameralar || []} kalit={(c) => c.nom}
                bosh="Kamera roʻyxati kelmagan"
                ustunlar={[
                  { nom: 'Kamera', chiz: (c) => (
                      <span className="inline-flex items-center gap-2">
                        <Nuqta ok={c.ulangan} />{c.nom}</span>) },
                  { nom: 'FPS', ong: true, chiz: (c) => (c.fps ?? '—') },
                  { nom: 'Kirdi', ong: true, chiz: (c) => soz(c.kirdi) },
                  { nom: 'Chiqdi', ong: true, chiz: (c) => soz(c.chiqdi) },
                  { nom: 'Zona', chiz: (c) => (c.zona ? <Teg holat="yaxshi">bor</Teg>
                                                     : <Teg holat="ogoh">zona yoʻq — sanamaydi</Teg>) },
                ]} />
      </Kart>
    </div>
  );
}

/* ── CHEKLAR ── */
function Cheklar({ id }) {
  const [sanaQiymat, setSana] = useState(sanaStr());
  const { yuklanmoqda, xato, malumot, yangila } =
    useSorov(() => api.ol(`/api/cheklar?id=${id}&sana=${sanaQiymat}`), [id, sanaQiymat]);

  return (
    <Kart sarlavha="Cheklar"
          ong={<input type="date" value={sanaQiymat} max={sanaStr()} aria-label="Sana"
                      onChange={(e) => setSana(e.target.value)}
                      className="px-2 py-1 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                               color: 'var(--matn)' }} />}>
      {yuklanmoqda ? <Yuklanmoqda />
        : xato ? <XatoPanel xato={xato} qayta={yangila} />
        : (
          <>
            <div className="text-sm mb-3" style={{ color: 'var(--matn-2)' }}>
              {malumot.cheklar.length === 0 ? (
                <Teg holat="ogoh">bu kuni chek berilmagan</Teg>
              ) : (
                <>
                  {soz(malumot.cheklar.length)} chek · {soz(malumot.jami_bosh)} bosh
                  hayvon · <b>{pul(malumot.jami_summa)}</b>
                </>
              )}
            </div>
            <Jadval qatorlar={malumot.cheklar} kalit={(c) => c.id}
                    csvNom={`cheklar_${sanaQiymat}`}
                    bosh={`${sana(sanaQiymat)} uchun chek yoʻq`}
                    ustunlar={[
                      { nom: '#', mono: true, maydon: 'id', csv: (c) => c.id },
                      { nom: 'Vaqt', mono: true, maydon: 'vaqt', csv: (c) => c.vaqt },
                      { nom: 'Tur', maydon: 'tur', csv: (c) => c.tur, saralash: (c) => c.tur },
                      { nom: 'Chek birligi', ong: true, csv: (c) => c.soni,
                        chiz: (c) => soz(c.soni) },
                      { nom: 'Bosh', ong: true, csv: (c) => c.bosh,
                        chiz: (c) => (
                          <b title={c.bosh > c.soni ? 'ona-bola: 1 chek = 2 bosh' : ''}>
                            {soz(c.bosh)}
                          </b>) },
                      { nom: 'Narx', ong: true, csv: (c) => c.narx, chiz: (c) => soz(c.narx) },
                      { nom: 'Summa', ong: true, saralash: (c) => c.summa,
                        csv: (c) => c.summa, chiz: (c) => soz(c.summa) },
                      { nom: 'Fiskal', csv: (c) => (c.fiskal ? 'fiskal' : 'oddiy'),
                        chiz: (c) => (c.fiskal
                          ? <Teg holat="yaxshi">✓ fiskal</Teg>
                          : <Teg holat="ogoh">oddiy</Teg>) },
                    ]} />
          </>
        )}
    </Kart>
  );
}

/* ── VIDEO YOZUVLAR ── */
function Yozuvlar({ id }) {
  const texnik = useSorov(() => api.ol(`/api/bozor_texnik?id=${id}`), [id]);
  const [sorov, setSorov] = useState(null);      // {fayl, tur}
  const [holat, setHolat] = useState(null);
  const [xato, setXato] = useState('');
  const taymer = useRef(null);

  // Video so'ralganda holatni kuzatamiz. TAYMAUT bor: bozor javob
  // bermasa panel abadiy "0/? boʻlak" da turmaydi.
  useEffect(() => {
    if (!sorov) return undefined;
    let oxirgiOlingan = -1, oxirgiVaqt = Date.now();
    const tekshir = async () => {
      try {
        const j = await api.ol(`/api/video_holat?id=${id}`);
        setHolat(j);
        if (j.olingan !== oxirgiOlingan) { oxirgiOlingan = j.olingan; oxirgiVaqt = Date.now(); }
        if (j.holat === 'tayyor') clearInterval(taymer.current);
        else if (Date.now() - oxirgiVaqt > 90000) {
          clearInterval(taymer.current);
          setXato('Bozor javob bermadi (90 soniya davomida yangi boʻlak kelmadi). '
                  + 'Bozor kompyuteri oʻchgan yoki interneti uzilgan boʻlishi mumkin.');
        }
      } catch (e) {
        clearInterval(taymer.current);
        setXato(e.message);
      }
    };
    tekshir();
    taymer.current = setInterval(tekshir, 2000);
    return () => clearInterval(taymer.current);
  }, [sorov, id]);

  const sora = async (fayl) => {
    setXato(''); setHolat(null);
    try {
      const j = await api.yubor('/api/video_sorov', { id, fayl });
      setSorov({ fayl, tur: j.tur });
      if (j.natija === 'tayyor') setHolat({ holat: 'tayyor', fayl, tur: j.tur });
    } catch (e) { setXato(e.message); }
  };

  const y = texnik.malumot?.holat?.yozuvlar;
  const kameralar = y?.kameralar || [];

  return (
    <div className="flex flex-col gap-4">
      {holat?.holat === 'tayyor' || sorov ? (
        <Kart sarlavha={`Video: ${sorov?.fayl || ''}`}>
          {xato ? <div style={{ color: '#ef4444' }} className="text-sm">{xato}</div>
            : holat?.holat === 'tayyor' ? (
              <>
                <video controls autoPlay className="w-full rounded-lg"
                       style={{ background: '#000', maxHeight: '60vh' }}
                       src={`/api/video?id=${id}&fayl=${encodeURIComponent(sorov.fayl)}&tur=${holat.tur || 'mp4'}`} />
                <a className="text-sm inline-block mt-2"
                   style={{ color: 'var(--color-asos-600)' }}
                   href={`/api/video?id=${id}&fayl=${encodeURIComponent(sorov.fayl)}&tur=${holat.tur || 'mp4'}`}
                   download>⬇ Yuklab olish</a>
              </>
            ) : (
              <div>
                <div className="text-sm mb-2" style={{ color: 'var(--matn-2)' }}>
                  Bozordan oqim: {holat?.olingan ?? 0}/{holat?.jami || '?'} boʻlak
                </div>
                <div className="h-2 rounded-full overflow-hidden"
                     style={{ background: 'var(--chegara)' }}>
                  <div className="h-full transition-all"
                       style={{ width: `${holat?.jami ? Math.round(holat.olingan / holat.jami * 100) : 3}%`,
                                background: 'var(--color-asos-500)' }} />
                </div>
              </div>
            )}
        </Kart>
      ) : null}

      <Kart sarlavha="Video yozuvlar (dalil)">
        {texnik.yuklanmoqda ? <Yuklanmoqda />
          : texnik.xato ? <XatoPanel xato={texnik.xato} qayta={texnik.yangila} />
          : kameralar.length === 0 ? (
            <Bosh belgi={BelgiVideo}>
              Yozuvlar roʻyxati yoʻq (bozorda yozib olish oʻchirilgan boʻlishi mumkin).
            </Bosh>
          ) : (
            <div className="flex flex-col gap-4">
              {kameralar.map((k) => (
                <div key={k.nom}>
                  <div className="text-sm font-medium mb-2">{k.nom}</div>
                  <Jadval qatorlar={k.fayllar || []} kalit={(f) => f.nom}
                          bosh="Yozuv yoʻq"
                          ustunlar={[
                            { nom: 'Fayl', mono: true, maydon: 'nom' },
                            { nom: 'Hajm', ong: true, chiz: (f) => hajm(f.hajm) },
                            { nom: '', ong: true, chiz: (f) => (
                                <Tugma onClick={() => sora(f.nom)}>Soʻrash</Tugma>) },
                          ]} />
                </div>
              ))}
            </div>
          )}
      </Kart>
    </div>
  );
}

/* ── SANOQ VA ZANJIR ── */
// ── QO'LDA SANOQ KIRITISH ──
//
// Bozorda internet bo'lmasligi mumkin (yoki dastur hali o'rnatilmagan).
// Bunda o'sha kun hisobotda UMUMAN ko'rinmaydi. Nazoratchi sonlarni
// qo'lda kiritadi, lekin ular kamera sanaganidan AJRATIB saqlanadi —
// davlat hisobotida "qurilma o'lchadi" bilan "odam aytdi" bir xil
// ko'rinmasligi kerak.
function QoldaSanoq({ id, rol, yangila }) {
  const admin = rol === 'admin';
  const [sana_, setSana] = useState(sanaStr());
  const [qatorlar, setQatorlar] = useState([
    { tur: 'Qoʻy', kirdi: '', chiqdi: '' },
    { tur: 'Qora mol', kirdi: '', chiqdi: '' },
  ]);
  const [xato, setXato] = useState('');
  const [xabar, setXabar] = useState('');
  const [ketmoqda, setKetmoqda] = useState(false);

  // Shu kunga allaqachon kiritilgan bo'lsa — maydonlarni to'ldiramiz
  useEffect(() => {
    let bekor = false;
    api.ol(`/api/qolda_sanoq?id=${id}&sana=${sana_}`)
      .then((j) => {
        if (bekor || !j.qatorlar?.length) return;
        setQatorlar(j.qatorlar.map((q) => ({
          tur: q.tur, kirdi: String(q.kirdi || ''), chiqdi: String(q.chiqdi || ''),
        })));
      })
      .catch(() => {});
    return () => { bekor = true; };
  }, [id, sana_]);

  const ozgart = (i, maydon, qiymat) =>
    setQatorlar((r) => r.map((q, j) => (j === i ? { ...q, [maydon]: qiymat } : q)));

  const saqla = async () => {
    setXato(''); setXabar(''); setKetmoqda(true);
    try {
      const j = await api.yubor('/api/qolda_sanoq', {
        id, sana: sana_,
        qatorlar: qatorlar.map((q) => ({
          tur: q.tur.trim(),
          kirdi: Number(q.kirdi) || 0,
          chiqdi: Number(q.chiqdi) || 0,
        })),
      });
      setXabar(`Saqlandi — ${soz(j.yozuvlar)} bosh yozildi`);
      yangila?.(true);
    } catch (e) { setXato(e.message); }
    finally { setKetmoqda(false); }
  };

  const jamiK = qatorlar.reduce((a, q) => a + (Number(q.kirdi) || 0), 0);
  const jamiC = qatorlar.reduce((a, q) => a + (Number(q.chiqdi) || 0), 0);

  const maydon = {
    background: 'var(--panel-2)', borderColor: 'var(--chegara)', color: 'var(--matn)',
  };

  return (
    <Kart sarlavha="Qoʻlda sanoq kiritish"
          izoh="Aloqa boʻlmagan kunlar uchun. Kamera sanogʻidan alohida belgilanadi.">
      {!admin ? (
        <Bosh belgi={BelgiQulf}>Bu amal uchun administrator huquqi kerak.</Bosh>
      ) : (
        <>
          {xato && <XatoPanel xato={{ message: xato }} />}
          {xabar && (
            <div className="mb-3 px-3 py-2 rounded-lg text-sm"
                 style={{ background: 'var(--yaxshi-fon)', color: 'var(--yaxshi)' }}>
              {xabar}
            </div>
          )}

          <label className="text-sm block mb-3">
            Sana
            <input type="date" value={sana_} max={sanaStr()}
                   onChange={(e) => setSana(e.target.value)}
                   className="ml-2 px-3 py-1.5 rounded-lg border" style={maydon} />
          </label>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--matn-3)' }}>
                  <th className="text-left font-medium pb-2">Hayvon turi</th>
                  <th className="text-right font-medium pb-2 w-32">Kirdi</th>
                  <th className="text-right font-medium pb-2 w-32">Chiqdi</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {qatorlar.map((q, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-2">
                      <input value={q.tur} placeholder="masalan: Qoʻy"
                             onChange={(e) => ozgart(i, 'tur', e.target.value)}
                             className="w-full px-3 py-1.5 rounded-lg border" style={maydon} />
                    </td>
                    <td className="py-1 px-1">
                      <input type="number" min="0" value={q.kirdi} placeholder="0"
                             onChange={(e) => ozgart(i, 'kirdi', e.target.value)}
                             className="w-full px-3 py-1.5 rounded-lg border text-right"
                             style={maydon} />
                    </td>
                    <td className="py-1 px-1">
                      <input type="number" min="0" value={q.chiqdi} placeholder="0"
                             onChange={(e) => ozgart(i, 'chiqdi', e.target.value)}
                             className="w-full px-3 py-1.5 rounded-lg border text-right"
                             style={maydon} />
                    </td>
                    <td className="py-1 text-center">
                      {qatorlar.length > 1 && (
                        <button onClick={() => setQatorlar((r) => r.filter((_, j) => j !== i))}
                                title="qatorni oʻchirish"
                                style={{ color: 'var(--xavf)' }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '1px solid var(--chegara)' }}>
                  <td className="pt-2 font-medium">Jami</td>
                  <td className="pt-2 text-right font-mono">{soz(jamiK)}</td>
                  <td className="pt-2 text-right font-mono">{soz(jamiC)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Tugma onClick={() => setQatorlar((r) => [...r, { tur: '', kirdi: '', chiqdi: '' }])}>
              + Tur qoʻshish
            </Tugma>
            <Tugma turi="asosiy" onClick={saqla} disabled={ketmoqda || (!jamiK && !jamiC)}>
              {ketmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
            </Tugma>
          </div>

          <div className="text-xs mt-3 flex flex-col gap-1" style={{ color: 'var(--matn-3)' }}>
            <div>• Shu sana uchun qayta kiritilsa — eskisi ALMASHTIRILADI, qoʻshilmaydi.</div>
            <div>• Yozuvlar «qoʻlda kiritilgan» deb belgilanadi va audit jurnaliga tushadi.</div>
            <div>• Bozor keyin ulanganda kamera yozuvlari bilan toʻqnashmaydi.</div>
          </div>
        </>
      )}
    </Kart>
  );
}

function Sanoq({ id, kunlar }) {
  const [zanjir, setZanjir] = useState(null);
  const [tekshirilmoqda, setTekshirilmoqda] = useState(false);
  const [xato, setXato] = useState('');

  const tekshir = async () => {
    setTekshirilmoqda(true); setXato('');
    try { setZanjir(await api.ol(`/api/zanjir?id=${id}`)); }
    catch (e) { setXato(e.message); }
    finally { setTekshirilmoqda(false); }
  };

  const ok = zanjir && zanjir.hodisalar_ok && zanjir.cheklar_ok;
  return (
    <div className="flex flex-col gap-4">
      <Kart sarlavha="Yozuvlar zanjiri (oʻchirib boʻlmaslik kafolati)"
            ong={<Tugma turi="asosiy" onClick={tekshir} disabled={tekshirilmoqda}>
                   {tekshirilmoqda ? 'Tekshirilmoqda…' : 'Tekshirish'}
                 </Tugma>}>
        {xato && <div className="text-sm" style={{ color: '#ef4444' }}>{xato}</div>}
        {!zanjir && !xato && (
          <div className="text-sm" style={{ color: 'var(--matn-3)' }}>
            Har yozuv oldingisining hash'ini oʻz ichiga oladi. Oʻrtadan bitta
            qator oʻchirilsa yoki oʻzgartirilsa — zanjir uziladi va shu yerda
            koʻrinadi.
          </div>
        )}
        {zanjir && (
          <div className="text-sm" style={{ color: ok ? 'var(--color-asos-600)' : '#ef4444' }}>
            {ok
              ? `✓ ZANJIR BUT: ${soz(zanjir.hodisalar_soni)} hodisa + ${soz(zanjir.cheklar_soni)} chek — oʻzgartirilmagan`
              : `⚠ ZANJIR BUZILGAN! hodisa #${zanjir.buzilgan_hodisa || '—'}, chek #${zanjir.buzilgan_chek || '—'}`}
          </div>
        )}
      </Kart>

      <Kart sarlavha="Kunlik sanoq va kassa">
        <Jadval qatorlar={kunlar} kalit={(k) => k.sana} bosh="Maʼlumot yoʻq"
                csvNom="bozor_sanoq"
                ustunlar={[
                  { nom: 'Sana', mono: true, csv: (k) => k.sana, chiz: (k) => sana(k.sana) },
                  { nom: 'Kirdi', ong: true, csv: (k) => k.kirdi, chiz: (k) => soz(k.kirdi) },
                  { nom: 'Chiqdi', ong: true, csv: (k) => k.chiqdi, chiz: (k) => soz(k.chiqdi) },
                  { nom: 'Chekdagi bosh', ong: true, csv: (k) => k.chek_bosh,
                    chiz: (k) => soz(k.chek_bosh) },
                  { nom: 'Summa', ong: true, csv: (k) => k.chek_summa,
                    chiz: (k) => (k.chek_yoq
                      ? <Teg holat="ogoh">chek yoʻq</Teg>
                      : pul(k.chek_summa, { valyuta: false })) },
                ]} />
      </Kart>
    </div>
  );
}
