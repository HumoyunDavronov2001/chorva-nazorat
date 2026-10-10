// TURLAR — hayvon turi bo'yicha SANOQ va KASSA.
//
// Ikki jadval ATAYLAB alohida va ular bir-biridan AYIRILMAYDI:
//
//   SANOQ  — kamera nechta hayvonni ko'rgani (dona bo'yicha).
//   KASSA  — chek berilgani: nechta chek, nechta BOSH hayvon, qancha pul.
//
// Nega ayirilmaydi: "ona-bola qo'y" cheki BITTA chek, lekin IKKI bosh
// hayvon; hayvon qaytib kirishi yoki sotilmay chiqishi mumkin. Shuning
// uchun markaz "necha bosh cheksiz qoldi" degan TAXMINIY raqamni
// chiqarmaydi — ikkala aniq son yonma-yon turadi, xulosani odam qiladi.

import { soz, pul } from '../format.js';
import { Kart, Jadval, Teg, Bosh } from './asos.jsx';
import { BelgiBosh, BelgiChek } from './Belgi.jsx';

export function SanoqTurlari({ turlar, turMaydoniBor, sarlavha = 'Sanoq — tur boʻyicha' }) {
  const jamiKirdi = (turlar || []).reduce((a, t) => a + t.kirdi, 0);
  const jamiChiqdi = (turlar || []).reduce((a, t) => a + t.chiqdi, 0);
  // USTUN NOMI ROSTNI AYTSIN. Tur yuborilmasa jadvalda kamera nomlari
  // turadi — ustun sarlavhasi ham "Kamera" bo'ladi. Ilgari sarlavha
  // "Tur" deb turaverib, har QATORGA sariq "kamera nomi" yorlig'i
  // qo'yilardi: uchta bir xil ogohlantirish jadvalni buzuq ko'rsatardi,
  // yonidagi kassa jadvalida esa o'sha hayvon "Qo'y boshi" deb yozilib,
  // bitta ekranda ikki xil lug'at paydo bo'lardi.
  const ustunNomi = turMaydoniBor ? 'Tur' : 'Kamera';
  return (
    <Kart sarlavha={sarlavha}
          izoh={turMaydoniBor
            ? 'Kamera qaysi turga qoʻyilgan boʻlsa — oʻsha tur'
            : 'Dastur hayvon turini yubormayapti, shuning uchun bu jadvalda '
              + 'KAMERA nomlari turibdi. Yonidagi kassa jadvalidagi tur nomlari '
              + 'bilan bir xil boʻlmasligi mumkin.'}>
      {!turlar?.length ? <Bosh belgi={BelgiBosh}>Bu davrda sanoq yoʻq</Bosh> : (
        <Jadval qatorlar={turlar} kalit={(t) => t.tur} csvNom="sanoq_turlari"
                ustunlar={[
                  { nom: ustunNomi, saralash: (t) => t.tur, csv: (t) => t.tur,
                    chiz: (t) => <span className="font-medium">{t.tur}</span> },
                  { nom: 'Kirdi', ong: true, saralash: (t) => t.kirdi,
                    csv: (t) => t.kirdi, chiz: (t) => soz(t.kirdi) },
                  { nom: 'Chiqdi', ong: true, saralash: (t) => t.chiqdi,
                    csv: (t) => t.chiqdi,
                    // RANG YO'Q: bu shunchaki son, xavf emas. Ilgari qizil
                    // edi va nazoratchi uni ogohlantirish deb o'qirdi.
                    chiz: (t) => <b>{soz(t.chiqdi)}</b> },
                ]}
                jami={['JAMI', soz(jamiKirdi), soz(jamiChiqdi)]} />
      )}
    </Kart>
  );
}

export function KassaTurlari({ turlar, sarlavha = 'Kassa — tur boʻyicha' }) {
  const j = (turlar || []).reduce((a, t) => ({
    cheklar: a.cheklar + t.cheklar, soni: a.soni + t.soni,
    bosh: a.bosh + t.bosh, summa: a.summa + t.summa,
  }), { cheklar: 0, soni: 0, bosh: 0, summa: 0 });

  return (
    <Kart sarlavha={sarlavha}
          izoh="«Birlik» — chek birligi (narx shunga koʻpaytiriladi), «Bosh» — jonli hayvon soni">
      {!turlar?.length ? (
        <Bosh belgi={BelgiChek}>
          Bu davrda <b>hali chek berilmagan</b>.
          <div className="mt-1 text-xs">
            Pul faqat chekdan hisoblanadi — taxminiy summa koʻrsatilmaydi.
          </div>
        </Bosh>
      ) : (
        <Jadval qatorlar={turlar} kalit={(t) => t.tur} csvNom="kassa_turlari"
                ustunlar={[
                  { nom: 'Tur', saralash: (t) => t.tur, csv: (t) => t.tur,
                    chiz: (t) => (
                      <span className="font-medium">
                        {t.tur}
                        {t.ona_bola && (
                          <div className="mt-0.5"><Teg>1 birlik = 2 bosh</Teg></div>
                        )}
                      </span>) },
                  { nom: 'Chek', ong: true, saralash: (t) => t.cheklar,
                    csv: (t) => t.cheklar, chiz: (t) => soz(t.cheklar) },
                  { nom: 'Birlik', ong: true, saralash: (t) => t.soni,
                    csv: (t) => t.soni, chiz: (t) => soz(t.soni) },
                  { nom: 'Bosh', ong: true, saralash: (t) => t.bosh,
                    csv: (t) => t.bosh, chiz: (t) => <b>{soz(t.bosh)}</b> },
                  { nom: 'Summa, soʻm', ong: true, saralash: (t) => t.summa,
                    csv: (t) => t.summa,
                    chiz: (t) => pul(t.summa, { valyuta: false }) },
                ]}
                jami={['JAMI', soz(j.cheklar), soz(j.soni), soz(j.bosh),
                       pul(j.summa, { valyuta: false })]} />
      )}
    </Kart>
  );
}
