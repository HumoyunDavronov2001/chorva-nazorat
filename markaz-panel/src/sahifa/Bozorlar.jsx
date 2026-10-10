// BOZORLAR — bosh sahifa: bugungi jamlar, xarita va bozorlar ro'yxati.
//
// Nazoratchi shu ekranga qarab bir qarashda ko'radi:
//   * qaysi bozor ULANGAN, qaysi biri o'chgan;
//   * bugun qaysi turdan nechta hayvon kirdi/chiqdi;
//   * kassada nechta chek berilgan va necha BOSH hayvonga.
//
// PUL faqat chekdan olinadi. Markaz "kutilgan summa" degan taxminiy
// raqamni CHIQARMAYDI — chek berilmagan bo'lsa shunday deb yoziladi.

import { api } from '../api.js';
import { soz, pul, aloqaMatn, sana, vaqt } from '../format.js';
import { useSorov, Skelet, XatoPanel, Kart, Kpi, Jadval, Teg, Tugma, Bosh }
  from '../komp/asos.jsx';
import Xarita from '../komp/Xarita.jsx';
import { SanoqTurlari, KassaTurlari } from '../komp/Turlar.jsx';
import { BelgiBozor, BelgiKirdi, BelgiChiqdi, BelgiChek, BelgiPul } from '../komp/Belgi.jsx';

const ULANGAN_S = 180;   // 3 daqiqadan beri jim bo'lsa "aloqa yo'q"

export default function Bozorlar({ xatoUshla, sozlama }) {
  // 15 soniyada jimgina yangilanadi — nazorat xonasidagi ekran doim
  // tirik ko'rinsin (xato bo'lsa oxirgi ma'lumot saqlanib qoladi).
  const { yuklanmoqda, xato, malumot, yangila, oxirgiYangilangan } =
    useSorov(() => api.ol('/api/holat'), [], { interval: 15000 });

  if (xato) xatoUshla?.(xato);
  if (yuklanmoqda && !malumot) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }, (_, i) => <Kpi key={i} nom="" qiymat="" yuklanmoqda />)}
        </div>
        <Kart sarlavha="Bozorlar"><Skelet qator={6} /></Kart>
      </div>
    );
  }
  if (xato && !malumot) return <XatoPanel xato={xato} qayta={yangila} />;

  const { bozorlar = [], jami = {}, sana: bugun } = malumot || {};
  const ulangan = bozorlar.filter((b) => b.aloqa_s >= 0 && b.aloqa_s < ULANGAN_S).length;
  // Xarita ochiq/yopiq holati eslab qolinadi — har kirganda qayta
  // yopish kerak bo'lmasin
  const xaritaOchiq = localStorage.getItem('xarita') !== '0';
  const ogohlar = bozorlar.filter((b) => b.litsenziya_bekor || !b.faol || !b.super_ruxsat);

  // ── TARTIB: E'TIBOR KERAK BO'LGANLAR TEPADA ──
  // Server alifbo bo'yicha qaytaradi. Natijada to'xtatilgan, hech narsa
  // sanamayotgan bozor birinchi qatorda turib, eng yirik ishlayotgani
  // ekranning pastiga tushib ketardi. Nazorat ekranida tartib —
  // e'tibor tartibi bo'lishi kerak:
  //   1) muammosi bori (litsenziya bekor / to'xtatilgan / super yopiq)
  //   2) aloqasi uzilgani
  //   3) qolgani — bugungi hajmi bo'yicha (kattadan kichikka)
  const ogir = (b) => (b.litsenziya_bekor ? 4 : 0) + (!b.faol ? 2 : 0)
                    + (!b.super_ruxsat ? 1 : 0);
  const uzilgan = (b) => (b.aloqa_s < 0 || b.aloqa_s >= ULANGAN_S ? 1 : 0);
  const royxat = [...bozorlar].sort((a, b) =>
    ogir(b) - ogir(a) || uzilgan(b) - uzilgan(a)
    || (b.chiqdi + b.kirdi) - (a.chiqdi + a.kirdi)
    || a.nom.localeCompare(b.nom, 'uz'));

  return (
    <div className="flex flex-col gap-5">
      {xato && (
        <XatoPanel xato={xato} qayta={yangila}
                   izoh="Quyida oxirgi muvaffaqiyatli olingan maʼlumot koʻrsatilmoqda." />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi nom="Bozorlar" belgi={BelgiBozor} qiymat={`${ulangan}/${bozorlar.length}`}
             izoh="ulangan / jami"
             holat={ulangan < bozorlar.length ? 'ogoh' : 'yaxshi'} />
        {/* RANG = HOLAT, RAQAM EMAS.
            Ilgari "kirdi" yashil, "chiqdi" qizil edi. Qizil — xavf rangi,
            963 bosh mol o'tgani esa xavf emas, shunchaki son. Nazoratchi
            qizil raqamni ko'rib "muammo bor" deb o'ylardi. Bu FARQ
            ko'rsatkichini olib tashlash qarori bilan ham ziddir: dastur
            hukm chiqarmasligi kerak, rang ham hukmdir. */}
        <Kpi nom="Bugun kirdi" belgi={BelgiKirdi} qiymat={jami.kirdi} format={soz} />
        <Kpi nom="Bugun chiqdi" belgi={BelgiChiqdi} qiymat={jami.chiqdi} format={soz} />
        <Kpi nom="Chek berilgan" belgi={BelgiChek} qiymat={jami.chek_bosh} format={soz}
             izoh={`bosh · ${soz(jami.chek_soni)} ta chek`} />
        <Kpi nom="Kassa tushumi" belgi={BelgiPul}
             /* ANIQ SON HAM EKRANDA BO'LSIN. Ilgari kartada "96,8 mln",
                pastdagi jadvalda esa "96 805 000" turardi — bitta ekranda
                bitta son ikki xil, davlat hisobotida bu nomuvofiqlik
                bo'lib ko'rinadi. Endi yirik raqam — qisqa, ostidagi izoh
                — aniq qiymat: ikkalasi yonma-yon, qarama-qarshi emas. */
             qiymat={jami.chek_yoq ? '—'
               : pul(jami.chek_summa, { qisqa: true, valyuta: false })}
             izoh={jami.chek_yoq ? 'hali chek berilmagan'
                                 : pul(jami.chek_summa)} />
      </div>

      {ogohlar.length > 0 && (
        <div className="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center gap-x-4 gap-y-1"
             style={{ borderColor: 'rgba(245,158,11,.4)', background: 'var(--panel)' }}>
          <b style={{ color: '#f59e0b' }}>Eʼtibor talab qiladi:</b>
          {/* HAVOLA HAVOLAGA O'XSHASIN. Bular bosiladigan edi, lekin
              oddiy matndek ko'rinardi — foydalanuvchi ustiga sichqoncha
              olib bormaguncha bosish mumkinligini bilmasdi. */}
          {ogohlar.map((b) => (
            <a key={b.id} href={`#bozor/${b.id}`}
               className="underline underline-offset-2 decoration-dotted
                          hover:decoration-solid font-medium"
               style={{ color: 'var(--color-asos-600)' }}>
              {b.nom} —{' '}
              {b.litsenziya_bekor ? 'litsenziya bekor'
                : !b.faol ? 'toʻxtatilgan' : 'super-admin bloklangan'}
            </a>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <SanoqTurlari turlar={malumot?.sanoq_turlar}
                      turMaydoniBor={malumot?.tur_maydoni_bor}
                      sarlavha="Bugungi sanoq — tur boʻyicha" />
        <KassaTurlari turlar={malumot?.kassa_turlar}
                      sarlavha="Bugungi kassa — tur boʻyicha" />
      </div>

      <Kart sarlavha={`Bozorlar roʻyxati (${bozorlar.length})`}
            izoh={`${sana(bugun)} holatiga`}
            ong={<span className="text-xs chop-yashir" style={{ color: 'var(--matn-3)' }}>
                   {oxirgiYangilangan
                     ? `yangilandi ${vaqt(oxirgiYangilangan, true)} · har 15 s`
                     : ''}
                 </span>}>
        {bozorlar.length === 0 ? (
          <Bosh belgi={BelgiBozor}>
            Hali bironta bozor roʻyxatga olinmagan.
            <div className="mt-2">
              <Tugma onClick={() => { location.hash = 'sozlamalar'; }}>
                Sozlamalar boʻlimida qoʻshish
              </Tugma>
            </div>
          </Bosh>
        ) : (
          <Jadval
            kalit={(b) => b.id}
            qatorlar={royxat}
            csvNom="bozorlar"
            ustunlar={[
              { nom: 'Bozor', saralash: (b) => b.nom, csv: (b) => b.nom,
                chiz: (b) => (
                  <a href={`#bozor/${b.id}`} className="font-medium hover:underline">
                    {b.nom}
                    <div className="text-xs font-normal" style={{ color: 'var(--matn-3)' }}>
                      {b.hudud}{b.stir ? ` · STIR ${b.stir}` : ' · STIR yoʻq'}
                    </div>
                  </a>) },
              { nom: 'Holat', saralash: (b) => (b.aloqa_s < 0 ? 1e9 : b.aloqa_s),
                csv: (b) => aloqaMatn(b.aloqa_s),
                chiz: (b) => {
                  const jonli = b.aloqa_s >= 0 && b.aloqa_s < ULANGAN_S;
                  return (
                    <div className="flex flex-col gap-1 items-start">
                      <Teg holat={jonli ? 'yaxshi' : 'xavf'}>
                        {jonli ? '● ulangan' : '● aloqa yoʻq'}
                      </Teg>
                      <span className="text-xs" style={{ color: 'var(--matn-3)' }}>
                        {aloqaMatn(b.aloqa_s)}
                      </span>
                    </div>); } },
              { nom: 'Kirdi', ong: true, saralash: (b) => b.kirdi,
                csv: (b) => b.kirdi, chiz: (b) => soz(b.kirdi) },
              { nom: 'Chiqdi', ong: true, saralash: (b) => b.chiqdi,
                csv: (b) => b.chiqdi, chiz: (b) => soz(b.chiqdi) },
              { nom: 'Cheklar', ong: true, saralash: (b) => b.chek_soni,
                csv: (b) => b.chek_soni, chiz: (b) => soz(b.chek_soni) },
              { nom: 'Chekdagi bosh', ong: true, saralash: (b) => b.chek_bosh,
                csv: (b) => b.chek_bosh, chiz: (b) => soz(b.chek_bosh) },
              { nom: 'Tushum', ong: true, saralash: (b) => b.chek_summa,
                csv: (b) => (b.chek_yoq ? 'chek berilmagan' : b.chek_summa),
                chiz: (b) => (b.chek_yoq
                  ? <Teg holat="ogoh">chek berilmagan</Teg>
                  : pul(b.chek_summa, { valyuta: false })) },
              { nom: 'Belgilar', csv: (b) => [
                  !b.faol && 'toʻxtatilgan', b.litsenziya_bekor && 'litsenziya bekor',
                  !b.super_ruxsat && 'super bloklangan', b.versiya && `v${b.versiya}`,
                ].filter(Boolean).join(', '),
                chiz: (b) => (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {!b.faol && <Teg holat="xavf">toʻxtatilgan</Teg>}
                    {b.litsenziya_bekor && <Teg holat="xavf">litsenziya bekor</Teg>}
                    {!b.super_ruxsat && <Teg holat="ogoh">super bloklangan</Teg>}
                    {b.versiya && <Teg>v{b.versiya}</Teg>}
                  </div>) },
            ]}
            jami={['JAMI', '', soz(jami.kirdi), soz(jami.chiqdi),
                   soz(jami.chek_soni), soz(jami.chek_bosh),
                   pul(jami.chek_summa, { valyuta: false }), '']} />
        )}
      </Kart>

      {/* XARITA ENDI RO'YXATDAN KEYIN VA YIG'ILADI.
          Ilgari u ro'yxat bilan KPI orasida 350 px joy egallardi va
          asosiy narsani — bozorlar ro'yxatini — ekrandan pastga surib
          yuborardi. Nazorat ekranida birinchi o'rin ro'yxatniki; xarita
          "qayerda joylashgan" degan kamdan-kam savolga javob beradi. */}
      <details className="rounded-xl border" open={xaritaOchiq}
               style={{ borderColor: 'var(--chegara)', background: 'var(--panel)' }}
               onToggle={(e) => localStorage.setItem('xarita', e.target.open ? '1' : '0')}>
        <summary className="px-4 py-3 cursor-pointer select-none text-sm font-medium">
          Xarita
          <span className="ml-2 font-normal" style={{ color: 'var(--matn-3)' }}>
            — bozorlar joylashuvi va ulanish holati
          </span>
        </summary>
        <div className="px-4 pb-4">
          <Xarita bozorlar={bozorlar} plitkaUrl={sozlama?.xarita_plitka} />
        </div>
      </details>
    </div>
  );
}
