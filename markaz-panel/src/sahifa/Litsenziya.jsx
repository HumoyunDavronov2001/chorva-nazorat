// LITSENZIYA — kalit chiqarish va bekor qilish (faqat admin).
//
// Bu bo'lim — pul olishning yagona dastagi:
//   * kalit AYNAN bitta kompyuterga bog'lanadi (qurilma raqami);
//   * bekor qilish ham AYNAN o'sha kompyuterga tegishli — qo'shni
//     kassaga tegmaydi;
//   * bekor qilingan kalitni qaytadan kiritish YORDAM BERMAYDI:
//     markaz imzolagan yozuv bozor dasturida saqlanadi.
// To'lovdan keyin YANGI kalit chiqariladi (u katta seriya oladi va
// bekor yozuvidan ustun turadi).

import { useState } from 'react';
import { api } from '../api.js';
import { sana, sanaStr, sanadanDate } from '../format.js';
import { useSorov, Skelet, XatoPanel, Kart, Jadval, Teg, Tugma, Bosh }
  from '../komp/asos.jsx';
import { BelgiQulf } from '../komp/Belgi.jsx';

// Chiqarilgan sana + muddat (kun) -> tugash sanasi va qolgan kun.
// Bazada muddat DAVOMIYLIK bo'lib saqlanadi (365), kalit ichida esa
// MUTLAQ kun raqami — shuning uchun hisob shu yerda.
function tugash(l) {
  if (!l.muddat_kun) return null;               // muddatsiz
  const b = sanadanDate(l.chiqarilgan);
  if (Number.isNaN(b.getTime())) return null;
  const t = new Date(b.getTime() + l.muddat_kun * 86400000);
  const qolgan = Math.round((t - new Date()) / 86400000);
  return {
    sana: sanaStr(t), qolgan,
    matn: qolgan < 0 ? `${-qolgan} kun oldin tugagan`
        : qolgan === 0 ? 'bugun tugaydi' : `${qolgan} kun qoldi`,
  };
}

export default function Litsenziya({ rol, xatoUshla }) {
  const bozorlar = useSorov(() => api.ol('/api/holat'), []);
  const lits = useSorov(() => api.ol('/api/litsenziyalar'), []);
  const [shakl, setShakl] = useState({ bozor_id: '', qurilma: '', muddat_kun: 0,
                                       kamera_limit: 0, izoh: '' });
  const [natija, setNatija] = useState(null);
  const [xato, setXato] = useState('');
  const [ish, setIsh] = useState(false);

  if (lits.xato) xatoUshla?.(lits.xato);
  if (rol !== 'admin')
    return <Bosh belgi={BelgiQulf}>Litsenziya boʻlimi faqat administrator uchun.</Bosh>;

  const chiqar = async (qayta = false) => {
    setIsh(true); setXato(''); setNatija(null);
    try {
      const j = await api.yubor('/api/kalit_chiqar', {
        bozor_id: Number(shakl.bozor_id) || 0,
        qurilma: shakl.qurilma,
        muddat_kun: Number(shakl.muddat_kun) || 0,
        kamera_limit: Number(shakl.kamera_limit) || 0,
        izoh: shakl.izoh,
        qayta,
      });
      setNatija(j);
      lits.yangila(true);
    } catch (e) { setXato(e.message); }
    finally { setIsh(false); }
  };

  const bekor = async (l, bekorMi) => {
    const savol = bekorMi
      ? `"${l.bozor || l.bozor_id}" bozoridagi ${l.qurilma.slice(0, 8)}… kompyuteri `
        + 'BEKOR qilinadi: keyingi sinxda dastur toʻxtaydi.\n\nDavom etamizmi?'
      : 'Litsenziya QAYTA TIKLANADI.\n\nDavom etamizmi?';
    if (!confirm(savol)) return;
    try {
      await api.yubor('/api/litsenziya_bekor', { id: l.id, bekor: bekorMi });
      lits.yangila(true);
    } catch (e) { setXato(e.message); }
  };

  return (
    <div className="flex flex-col gap-5">
      {!lits.yuklanmoqda && lits.malumot && !lits.malumot.urug_bor && (
        <div className="rounded-xl border p-4 text-sm"
             style={{ borderColor: 'rgba(245,158,11,.4)', background: 'var(--panel)',
                      color: '#f59e0b' }}>
          ⚠ Serverda <code>litsenziya_urug</code> yoʻq — kalit chiqarib boʻlmaydi.
          <div className="mt-1" style={{ color: 'var(--matn-2)' }}>
            Yechim: <code>CHORVA_LITSENZIYA_URUG</code> muhit oʻzgaruvchisini bering
            (SERVERGA_ORNATISH.md, 3a-bo'lim) va serverni qayta ishga tushiring.
          </div>
        </div>
      )}

      <Kart sarlavha="Yangi kalit chiqarish"
            izoh="Bozor kompyuteri qurilma raqamini koʻrsatadi — shu raqamdan kalit chiqariladi">
        {/* TARTIB YOZILGAN. Ilgari sahifada faqat maydonlar turardi va
            yangi xodim "qurilma raqamini qayerdan olaman" degan savol
            bilan qolardi; sahifaning yarmi esa bo'sh edi. */}
        <ol className="text-sm mb-4 grid md:grid-cols-3 gap-3">
          {[['1', 'Bozor kompyuterida dasturni oching — u QURILMA RAQAMINI koʻrsatadi'],
            ['2', 'Raqamni shu yerga koʻchiring, muddat va kamera sonini belgilang'],
            ['3', 'Chiqqan kalitni dastur oynasiga qoʻying — dastur ishga tushadi']]
            .map(([n, m]) => (
            <li key={n} className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full text-xs flex items-center
                               justify-center font-semibold"
                    style={{ background: 'var(--panel-2)', color: 'var(--matn-2)' }}>{n}</span>
              <span style={{ color: 'var(--matn-2)' }}>{m}</span>
            </li>
          ))}
        </ol>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            Bozor
            <select value={shakl.bozor_id}
                    onChange={(e) => setShakl({ ...shakl, bozor_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                             color: 'var(--matn)' }}>
              <option value="">— bozorni tanlang —</option>
              {(bozorlar.malumot?.bozorlar || []).map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Qurilma raqami (dastur ekranidan)
            <input value={shakl.qurilma} placeholder="A1B2C3D4-E5F60718-…"
                   onChange={(e) => setShakl({ ...shakl, qurilma: e.target.value })}
                   className="w-full mt-1 px-3 py-2 rounded-lg border font-mono text-sm"
                   style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                            color: 'var(--matn)' }} />
          </label>
          <label className="text-sm">
            Muddat (kun, 0 = muddatsiz)
            <input type="number" min="0" value={shakl.muddat_kun}
                   onChange={(e) => setShakl({ ...shakl, muddat_kun: e.target.value })}
                   className="w-full mt-1 px-3 py-2 rounded-lg border"
                   style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                            color: 'var(--matn)' }} />
          </label>
          <label className="text-sm">
            Kamera limiti (0 = cheklovsiz)
            <input type="number" min="0" value={shakl.kamera_limit}
                   onChange={(e) => setShakl({ ...shakl, kamera_limit: e.target.value })}
                   className="w-full mt-1 px-3 py-2 rounded-lg border"
                   style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                            color: 'var(--matn)' }} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Tugma turi="asosiy" onClick={() => chiqar(false)}
                 disabled={ish || !shakl.bozor_id || shakl.qurilma.length < 32}>
            {ish ? 'Chiqarilmoqda…' : 'Kalit chiqarish'}
          </Tugma>
          <Tugma onClick={() => chiqar(true)}
                 disabled={ish || !shakl.bozor_id || shakl.qurilma.length < 32}>
            Qayta chiqarish (eskisini bekor qilib)
          </Tugma>
        </div>
        {xato && <div className="mt-3 text-sm" style={{ color: '#ef4444' }}>{xato}</div>}
        {natija && (
          <div className="mt-4 rounded-lg border p-3"
               style={{ borderColor: 'var(--color-asos-600)', background: 'var(--panel-2)' }}>
            <div className="text-sm font-medium mb-1">
              {natija.natija === 'mavjud'
                ? 'Bu kompyuter uchun kalit ALLAQACHON bor:'
                : `Kalit tayyor (seriya ${natija.seriya}):`}
            </div>
            <div className="font-mono text-xs break-all p-2 rounded"
                 style={{ background: 'var(--fon)' }}>{natija.kalit}</div>
            <Tugma className="mt-2"
                   onClick={() => navigator.clipboard.writeText(natija.kalit)}>
              Nusxalash
            </Tugma>
            <div className="text-xs mt-2" style={{ color: 'var(--matn-3)' }}>
              Kalitni bozor kompyuteridagi aktivatsiya oynasiga kiriting.
            </div>
          </div>
        )}
      </Kart>

      <Kart sarlavha="Chiqarilgan kalitlar"
            ong={<Tugma onClick={() => lits.yangila()}>Yangilash</Tugma>}>
        {lits.yuklanmoqda ? <Skelet qator={5} />
          : lits.xato ? <XatoPanel xato={lits.xato} qayta={lits.yangila} />
          : (
            <Jadval qatorlar={lits.malumot.litsenziyalar} kalit={(l) => l.id}
                    csvNom="litsenziyalar"
                    bosh="Hali kalit chiqarilmagan"
                    ustunlar={[
                      // Bazadagi ID (tartib raqami emas) — reyestr bilan bir xil
                      { nom: 'ID', ong: true, saralash: (l) => l.id, csv: (l) => l.id,
                        chiz: (l) => l.id },
                      { nom: 'Bozor', saralash: (l) => l.bozor || '',
                        csv: (l) => l.bozor || `#${l.bozor_id}`,
                        chiz: (l) => l.bozor || `#${l.bozor_id}` },
                      { nom: 'Qurilma', mono: true,
                        chiz: (l) => l.qurilma.replace(/(.{8})/g, '$1-').slice(0, -1) },
                      { nom: 'Seriya', ong: true, chiz: (l) => l.seriya },
                      { nom: 'Chiqarilgan', saralash: (l) => l.chiqarilgan,
                        csv: (l) => l.chiqarilgan, chiz: (l) => sana(l.chiqarilgan) },
                      // AMALIY SAVOL — "QACHON TUGAYDI", "365 KUN" EMAS.
                      // Ilgari faqat muddat uzunligi ko'rsatilardi. Nazoratchi
                      // uchun kerakli javob boshqa: qaysi sanada tugaydi va
                      // necha kun qoldi. 30 kundan kam qolsa sariq, o'tib
                      // ketgan bo'lsa qizil — dastur bir kuni ochilmay
                      // qolishidan OLDIN ko'rinsin.
                      { nom: 'Muddat', saralash: (l) => tugash(l)?.qolgan ?? 1e9,
                        csv: (l) => (tugash(l) ? tugash(l).sana : 'muddatsiz'),
                        chiz: (l) => {
                          const t = tugash(l);
                          if (!t) return <span style={{ color: 'var(--matn-3)' }}>muddatsiz</span>;
                          const rang = t.qolgan < 0 ? 'xavf' : t.qolgan <= 30 ? 'ogoh' : null;
                          return (
                            <div className="leading-tight">
                              <div>{sana(t.sana)}</div>
                              <div className="text-xs">
                                {rang ? <Teg holat={rang}>{t.matn}</Teg>
                                      : <span style={{ color: 'var(--matn-3)' }}>{t.matn}</span>}
                              </div>
                            </div>);
                        } },
                      { nom: 'Kamera', ong: true,
                        chiz: (l) => (l.kamera_limit || 'cheksiz') },
                      { nom: 'Holat', saralash: (l) => (l.bekor ? 1 : 0),
                        csv: (l) => (l.bekor ? 'BEKOR' : 'faol'),
                        chiz: (l) => (l.bekor
                          ? <Teg holat="xavf">BEKOR</Teg>
                          : <Teg holat="yaxshi">faol</Teg>) },
                      { nom: '', ong: true, chiz: (l) => (
                          <Tugma turi={l.bekor ? 'oddiy' : 'xavf'}
                                 onClick={() => bekor(l, !l.bekor)}>
                            {l.bekor ? 'Tiklash' : 'Bekor qilish'}
                          </Tugma>) },
                    ]} />
          )}
      </Kart>
    </div>
  );
}
