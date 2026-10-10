// STATISTIKA — grafiklar bilan: kunlik sanoq/kassa, soatlik gavjumlik,
// tur kesimi va PUL yakuni.
//
// Barcha raqamlar ANIQ: sanoq — kameradan, pul — chekdan. Markaz
// ularni bir-biridan ayirmaydi va "kutilgan summa" ni taxmin qilmaydi
// (sabab: hisob.js boshidagi izoh va EXE_PROTOKOL.md, 3-bo'lim).

import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
         Tooltip as ReTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell }
  from 'recharts';
import { api } from '../api.js';
import { soz, pul, sana, sanaQisqa, sanaStr, sanadanDate, kunOldin } from '../format.js';
import { useSorov, Skelet, XatoPanel, Kart, Kpi, Jadval, Teg, Bosh, Tugma, OraliqTanlash }
  from '../komp/asos.jsx';
import { SanoqTurlari, KassaTurlari } from '../komp/Turlar.jsx';
import { BelgiChiqdi, BelgiChek, BelgiBosh, BelgiPul, BelgiChop } from '../komp/Belgi.jsx';

// TOIFA RANGLARI — HOLAT ranglaridan ATAYLAB uzoq.
// Ilgari birinchi rang yashil (#10b981) va to'rtinchisi qizil (#ef4444)
// edi — aynan "yaxshi" va "xavf" ranglari. Diagrammada eng katta ulush
// yashil chiqib, "bu yaxshi" degan ma'no berardi; qizil bo'lak esa
// muammodek ko'rinardi. Toifa rangi hech qanday baho bermasligi kerak.
const RANG = ['#4f46e5', '#0ea5e9', '#a855f7', '#0891b2', '#7c3aed', '#2563eb', '#0d9488'];
const OQ = { fontSize: 12, fill: 'var(--matn-3)' };
const QALQON = {
  background: 'var(--panel)', border: '1px solid var(--chegara)',
  borderRadius: 10, color: 'var(--matn)', fontSize: 13,
};

export default function Statistika({ xatoUshla }) {
  const [dan, setDan] = useState(kunOldin(29));
  const [gacha, setGacha] = useState(sanaStr());
  const [bozorId, setBozorId] = useState(0);

  const bozorlar = useSorov(() => api.ol('/api/holat'), []);
  const { yuklanmoqda, xato, malumot, yangila } =
    useSorov(() => api.ol(`/api/statistika?id=${bozorId}&dan=${dan}&gacha=${gacha}`),
             [bozorId, dan, gacha]);

  if (xato) xatoUshla?.(xato);

  const tanlanganNom = bozorId
    ? (bozorlar.malumot?.bozorlar || []).find((b) => b.id === bozorId)?.nom
    : 'Hamma bozorlar';

  const boshqaruv = (
    <div className="flex flex-wrap items-center gap-3 chop-yashir">
      <select value={bozorId} onChange={(e) => setBozorId(Number(e.target.value))}
              aria-label="Bozor tanlash"
              className="px-2 py-1 rounded-lg border text-sm"
              style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                       color: 'var(--matn)' }}>
        <option value={0}>Hamma bozorlar</option>
        {(bozorlar.malumot?.bozorlar || []).map((b) => (
          <option key={b.id} value={b.id}>{b.nom}</option>
        ))}
      </select>
      <OraliqTanlash dan={dan} gacha={gacha}
                     ozgardi={(d, g) => { setDan(d); setGacha(g); }} />
      <Tugma onClick={() => print()} title="Hisobotni qogʻozga chiqarish">
        <span className="inline-flex items-center gap-1.5"><BelgiChop olcham={15} /> Chop etish</span>
      </Tugma>
    </div>
  );

  if (yuklanmoqda) {
    return <>{boshqaruv}<div className="mt-4 flex flex-col gap-4">
      <Skelet qator={3} balandlik={64} /><Skelet qator={6} /></div></>;
  }
  if (xato) {
    return <>{boshqaruv}<div className="mt-4">
      <XatoPanel xato={xato} qayta={yangila} /></div></>;
  }

  const { kunlar = [], jami = {}, soatlar = [], turlar = [] } = malumot || {};
  // Tanlangan oraliqdagi kunlar soni (ma'lumot bor kunlar bilan solishtirish uchun)
  const tanlanganKun = Math.round(
    (sanadanDate(gacha) - sanadanDate(dan)) / 86400000) + 1;
  const soatMal = soatlar.map((v, i) => ({ soat: `${String(i).padStart(2, '0')}:00`, chiqdi: v }));
  const engGavjum = soatlar.indexOf(Math.max(...soatlar));

  return (
    <div className="flex flex-col gap-5">
      {boshqaruv}

      {/* SANA QATORI — brauzer maydonlari mintaqaga qarab "07/18/2026"
          deb chizadi; bu yerda har doim 18.07.2026. Bundan tashqari
          TANLANGAN oraliq bilan MA'LUMOT BOR kunlar soni bir xil
          bo'lmasligi mumkin: 30 kun tanlanadi, ma'lumot esa 14 kunga
          bo'ladi. Ilgari KPI da "14 kun" turardi va bu tanlovga zid
          ko'rinardi — endi sabab ochiq yozilgan. */}
      {/* Bosma uchun sarlavha (ekranda yashirin — .chop-sarlavha) */}
      <div className="text-sm chop-sarlavha" style={{ marginBottom: 8 }}>
        {tanlanganNom} · {sana(dan)} — {sana(gacha)}
      </div>

      {/* EKRANDA KO'RINADIGAN IZOH. Tanlangan oraliq (30 kun) bilan
          ma'lumot bor kunlar (14) bir xil bo'lmasligi mumkin — ilgari KPI
          da "14 kun" turardi va tanlovga zid ko'rinardi. Sabab shu yerda
          ochiq yozilgan; sana ham brauzer formatida emas, 18.07.2026. */}
      {jami.kunlar > 0 && jami.kunlar < tanlanganKun && (
        <div className="text-sm px-3 py-2 rounded-lg chop-yashir"
             style={{ background: 'var(--panel-2)', color: 'var(--matn-2)' }}>
          Tanlangan oraliq <b>{sana(dan)} — {sana(gacha)}</b> ({tanlanganKun} kun),
          maʼlumot esa <b>{jami.kunlar} kunga</b> bor — qolgan kunlarda yozuv yoʻq.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi nom="Chiqdi (bosh)" belgi={BelgiChiqdi} qiymat={jami.chiqdi} format={soz}
             izoh={`kuniga oʻrtacha ${soz(jami.ortacha_kun)}`} />
        <Kpi nom="Cheklar" belgi={BelgiChek} qiymat={jami.chek_soni} format={soz}
             izoh={`${soz(jami.chek_birlik)} chek birligi`} />
        <Kpi nom="Chek boshi" belgi={BelgiBosh} qiymat={jami.chek_bosh} format={soz}
             izoh="chekdagi jonli hayvon soni" />
        <Kpi nom="Tushum" belgi={BelgiPul}
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

      <Kart sarlavha="Kunlik: sanoq va kassa"
            izoh="Ikkala chiziq ham ANIQ raqam: biri kamera sanagani, ikkinchisi chekdagi bosh soni. Ular orasidagi ayirma hisoblanmaydi.">
        {kunlar.length === 0 ? <Bosh>Bu oraliqda maʼlumot yoʻq</Bosh> : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={kunlar} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gChiqdi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--sanoq)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--sanoq)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gChek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--kassa)" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="var(--kassa)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chegara)" />
                <XAxis dataKey="sana" tick={OQ} tickMargin={8} minTickGap={18}
                       tickFormatter={sanaQisqa} />
                <YAxis tick={OQ} width={54} tickFormatter={(v) => soz(v)} />
                <ReTooltip contentStyle={QALQON}
                           labelFormatter={(v) => sana(v)}
                           formatter={(v, n) => [soz(v), n]} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                <Area type="monotone" dataKey="chiqdi" name="Sanoq (chiqdi)"
                      stroke="var(--sanoq)" fill="url(#gChiqdi)" strokeWidth={2} />
                <Area type="monotone" dataKey="chek_bosh" name="Chekdagi bosh"
                      stroke="var(--kassa)" fill="url(#gChek)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Kart>

      <div className="grid lg:grid-cols-2 gap-5">
        <Kart sarlavha="Soatlik gavjumlik"
              izoh={engGavjum >= 0 && soatlar[engGavjum]
                ? `Eng gavjum vaqt: ${String(engGavjum).padStart(2, '0')}:00 (bozor vaqti, UTC+5)`
                : 'Bozor vaqti boʻyicha (UTC+5)'}>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={soatMal} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chegara)" />
                <XAxis dataKey="soat" tick={{ ...OQ, fontSize: 11 }} interval={2} tickMargin={6} />
                <YAxis tick={OQ} width={54} tickFormatter={(v) => soz(v)} />
                <ReTooltip contentStyle={QALQON} formatter={(v) => [soz(v), 'Chiqdi']} />
                <Bar dataKey="chiqdi" name="Chiqdi" fill="var(--sanoq)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kart>

        <Kart sarlavha="Tur kesimi — pul ulushi" izoh="Qaysi hayvondan qancha tushum">
          {turlar.length === 0 ? <Bosh>Chek yoʻq</Bosh> : (
            /* DOIRA EMAS, ULUSH SATRLARI.
               Donut faqat "qaysi bo'lak kattaroq" degan taxminiy javob
               berardi: raqam ham, foiz ham ustida yo'q edi, aniq sonlar
               esa PASTDAGI jadvalda turardi — ya'ni bir ma'lumot ikki
               marta, biri o'qib bo'lmaydigan holda. Endi ulush ham,
               summa ham bitta joyda va o'qiladi. */
            <div className="flex flex-col gap-3">
              {turlar.map((t, i) => {
                const jamiSumma = turlar.reduce((a, x) => a + x.summa, 0) || 1;
                const foiz = (t.summa / jamiSumma) * 100;
                return (
                  <div key={t.tur}>
                    <div className="flex justify-between items-baseline text-sm gap-2">
                      <span className="truncate font-medium">{t.tur}</span>
                      <span className="tabular-nums whitespace-nowrap">
                        {pul(t.summa)}
                        <span className="ml-2 text-xs" style={{ color: 'var(--matn-3)' }}>
                          {foiz.toFixed(foiz < 10 ? 1 : 0).replace('.', ',')}%
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full overflow-hidden"
                         style={{ background: 'var(--panel-2)' }}>
                      <div className="h-full rounded-full"
                           style={{ width: `${foiz}%`, background: RANG[i % RANG.length] }} />
                    </div>
                  </div>);
              })}
            </div>
          )}
        </Kart>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <SanoqTurlari turlar={malumot?.sanoq_turlar}
                      turMaydoniBor={malumot?.tur_maydoni_bor} />
        <KassaTurlari turlar={turlar} />
      </div>

      <Kart sarlavha="Kunlik jadval" izoh={`${tanlanganNom} · ${sana(dan)} — ${sana(gacha)}`}>
        <Jadval qatorlar={kunlar} kalit={(k) => k.sana} csvNom="statistika"
                ustunlar={[
                  { nom: 'Sana', mono: true, saralash: (k) => k.sana,
                    csv: (k) => k.sana, chiz: (k) => sana(k.sana) },
                  { nom: 'Kirdi', ong: true, saralash: (k) => k.kirdi,
                    csv: (k) => k.kirdi, chiz: (k) => soz(k.kirdi) },
                  { nom: 'Chiqdi', ong: true, saralash: (k) => k.chiqdi,
                    csv: (k) => k.chiqdi, chiz: (k) => soz(k.chiqdi) },
                  { nom: 'Cheklar', ong: true, saralash: (k) => k.chek_soni,
                    csv: (k) => k.chek_soni, chiz: (k) => soz(k.chek_soni) },
                  { nom: 'Chekdagi bosh', ong: true, saralash: (k) => k.chek_bosh,
                    csv: (k) => k.chek_bosh, chiz: (k) => soz(k.chek_bosh) },
                  { nom: 'Summa', ong: true, saralash: (k) => k.chek_summa,
                    csv: (k) => (k.chek_yoq ? 'chek berilmagan' : k.chek_summa),
                    chiz: (k) => (k.chek_yoq
                      ? <Teg holat="ogoh">chek berilmagan</Teg>
                      : pul(k.chek_summa, { valyuta: false })) },
                ]}
                jami={['JAMI', soz(jami.kirdi), soz(jami.chiqdi), soz(jami.chek_soni),
                       soz(jami.chek_bosh), pul(jami.chek_summa, { valyuta: false })]} />
      </Kart>
    </div>
  );
}
