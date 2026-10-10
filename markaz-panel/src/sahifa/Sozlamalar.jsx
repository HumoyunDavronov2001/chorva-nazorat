// SOZLAMALAR — bozorlar reyestri, dasturni yuklab olish va audit jurnali.
//
// Nazoratchi (Soliq/Prokuratura) bu bo'limni KO'RADI, lekin o'zgartira
// olmaydi — tugmalar unga umuman chiqmaydi.

import { useState } from 'react';
import { api } from '../api.js';
import { hajm, sana, sanaVaqt } from '../format.js';
import { useSorov, Skelet, XatoPanel, Kart, Jadval, Teg, Tugma, Bosh, Amallar }
  from '../komp/asos.jsx';
import { BelgiPaket } from '../komp/Belgi.jsx';

export default function Sozlamalar({ rol, xatoUshla, sozlama }) {
  const admin = rol === 'admin';
  const holat = useSorov(() => api.ol('/api/holat'), []);
  const [xato, setXato] = useState('');
  const [kalit, setKalit] = useState(null);        // yangi bozor kaliti
  const [tahrir, setTahrir] = useState(null);      // tahrirlanayotgan bozor
  const [yangi, setYangi] = useState({ nom: '', hudud: '', stir: '' });

  if (holat.xato) xatoUshla?.(holat.xato);

  const amal = async (fn) => {
    setXato('');
    try { await fn(); holat.yangila(true); }
    catch (e) { setXato(e.message); }
  };

  const qosh = () => amal(async () => {
    const j = await api.yubor('/api/bozor_qosh', yangi);
    setKalit({ nom: yangi.nom, kalit: j.kalit, id: j.id, yangi: true });
    setYangi({ nom: '', hudud: '', stir: '' });
  });

  // Kalitni almashtirish: kalit chiqib ketgan bo'lsa (eski xodim,
  // ekran surati) eskisi SHU ZAHOTI ishlamay qoladi.
  const kalitYangila = (b) => amal(async () => {
    if (!confirm(`"${b.nom}" ning ulanish kaliti almashtiriladi.\n\n`
                 + 'Eski kalit DARHOL ishlamay qoladi — bozor kompyuteridagi '
                 + 'config.json ni yangilamaguningizcha sinx to\'xtaydi.\n\n'
                 + 'Davom etilsinmi?')) return;
    const j = await api.yubor('/api/kalit_yangila', { id: b.id });
    setKalit({ nom: b.nom, kalit: j.kalit, id: b.id, yangi: false });
  });

  const saqla = () => amal(async () => {
    await api.yubor('/api/bozor_tahrir', tahrir);
    setTahrir(null);
  });

  return (
    <div className="flex flex-col gap-5">
      {xato && <XatoPanel xato={{ message: xato }} />}

      {kalit && (
        <BozorOrnatish kalit={kalit} apiUrl={sozlama?.api_url}
                       yop={() => setKalit(null)} />
      )}

      <ParolAlmash />

      {admin && <Foydalanuvchilar />}

      {admin && (
        <Kart sarlavha="Yangi bozor roʻyxatga olish">
          <div className="grid md:grid-cols-3 gap-3">
            <input placeholder="Bozor nomi" value={yangi.nom}
                   onChange={(e) => setYangi({ ...yangi, nom: e.target.value })}
                   className="px-3 py-2 rounded-lg border"
                   style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                            color: 'var(--matn)' }} />
            <input placeholder="Hudud (Jizzax, Zomin…)" value={yangi.hudud}
                   onChange={(e) => setYangi({ ...yangi, hudud: e.target.value })}
                   className="px-3 py-2 rounded-lg border"
                   style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                            color: 'var(--matn)' }} />
            <input placeholder="STIR (soliq raqami)" value={yangi.stir}
                   onChange={(e) => setYangi({ ...yangi, stir: e.target.value })}
                   className="px-3 py-2 rounded-lg border"
                   style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                            color: 'var(--matn)' }} />
          </div>
          <Tugma turi="asosiy" className="mt-3" onClick={qosh} disabled={!yangi.nom.trim()}>
            Qoʻshish
          </Tugma>
        </Kart>
      )}

      <Kart sarlavha="Bozorlar reyestri">
        {holat.yuklanmoqda ? <Skelet qator={5} />
          : holat.xato ? <XatoPanel xato={holat.xato} qayta={holat.yangila} />
          : (
            <Jadval qatorlar={holat.malumot.bozorlar} kalit={(b) => b.id}
                    bosh="Bozor yoʻq"
                    ustunlar={[
                      // Bu TARTIB raqami emas, bozorning bazadagi ID si — jadval nom
                      // bo'yicha saralanganda 4,5,3,1,2 bo'lib ko'rinadi va
                      // "tartib buzuq" degan taassurot qoldirardi.
                      { nom: 'ID', ong: true, chiz: (b) => b.id },
                      { nom: 'Nom', chiz: (b) => (
                          <a href={`#bozor/${b.id}`} className="font-medium hover:underline">
                            {b.nom}</a>) },
                      { nom: 'Hudud', maydon: 'hudud' },
                      { nom: 'STIR', mono: true,
                        chiz: (b) => (b.stir || <Teg holat="ogoh">yoʻq</Teg>) },
                      { nom: 'Holat', chiz: (b) => (b.faol
                          ? <Teg holat="yaxshi">faol</Teg>
                          : <Teg holat="xavf">toʻxtatilgan</Teg>) },
                      // SUPER-ADMIN — bozordagi eng kuchli huquq: kunlik
                      // hisobni nollash, chekni bekor qilish. Uni markazdan
                      // yopish imkoni SERVERDA bor edi, lekin panelda tugma
                      // yo'q edi — ya'ni amalda ishlatib bo'lmasdi.
                      { nom: 'Super-admin', chiz: (b) => (b.super_ruxsat
                          ? <Teg holat="yaxshi">ochiq</Teg>
                          : <Teg holat="xavf">bloklangan</Teg>) },
                      ...(admin ? [{ nom: '', ong: true, chiz: (b) => (
                          <Amallar yorliq={`${b.nom} amallari`} elementlar={[
                            { nom: 'Tahrirlash',
                              bosildi: () => setTahrir({ id: b.id, nom: b.nom,
                                                         hudud: b.hudud, stir: b.stir }) },
                            { nom: b.faol ? 'Toʻxtatish' : 'Yoqish',
                              bosildi: () => amal(() => api.yubor('/api/bozor_holat',
                                                    { id: b.id, faol: !b.faol })) },
                            { nom: b.super_ruxsat ? 'Super-adminni bloklash'
                                                  : 'Super-adminni ochish',
                              bosildi: () => {
                                if (b.super_ruxsat && !confirm(
                                  `"${b.nom}" da super-admin YOPILADI.\n\n`
                                  + 'Kassir ishlashda davom etadi, lekin hech kim '
                                  + 'kunlik hisobni nollay va chekni bekor qila '
                                  + 'olmaydi. Qaror bazada saqlanadi — internetni '
                                  + 'uzish bilan qaytarib boʻlmaydi.\n\nDavom etilsinmi?')) return;
                                amal(() => api.yubor('/api/super_ruxsat',
                                                     { id: b.id, ruxsat: !b.super_ruxsat }));
                              } },
                            { nom: 'Ulanish kalitini almashtirish',
                              bosildi: () => kalitYangila(b) },
                            // AJRATKICH: qaytarib bo'lmaydigan amal kundalik
                            // amallar bilan bir tekisda turmasin
                            { nom: 'Oʻchirish', xavf: true, ajrat: true,
                              bosildi: () => {
                                if (!confirm(`"${b.nom}" va uning MARKAZDAGI barcha yozuvlari `
                                             + 'butunlay oʻchiriladi. Qaytarib boʻlmaydi.\n\nOʻchirilsinmi?')) return;
                                if (!confirm(`Yana bir bor tasdiqlang: ${b.nom}`)) return;
                                amal(() => api.yubor('/api/bozor_ochir', { id: b.id }));
                              } },
                          ]} />) }] : []),
                    ]} />
          )}
      </Kart>

      {tahrir && (
        <Kart sarlavha={`Bozorni tahrirlash #${tahrir.id}`}>
          <div className="grid md:grid-cols-3 gap-3">
            {['nom', 'hudud', 'stir'].map((k) => (
              <label key={k} className="text-sm">
                {k.toUpperCase()}
                <input value={tahrir[k] || ''}
                       onChange={(e) => setTahrir({ ...tahrir, [k]: e.target.value })}
                       className="w-full mt-1 px-3 py-2 rounded-lg border"
                       style={{ borderColor: 'var(--chegara)', background: 'var(--panel-2)',
                                color: 'var(--matn)' }} />
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Tugma turi="asosiy" onClick={saqla}>Saqlash</Tugma>
            <Tugma onClick={() => setTahrir(null)}>Bekor</Tugma>
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--matn-3)' }}>
            Tahrirlash tarixni saqlaydi — bozorni oʻchirib qayta ochish SHART EMAS.
          </div>
        </Kart>
      )}

      <Yuklab />
      <Jurnal />
    </div>
  );
}

// ── BOZORNI O'RNATISHGA TAYYORLASH ──
//
// Ilgari yangi bozor qo'shilganda faqat kalit matni ko'rsatilardi va
// o'rnatuvchi EXE butunlay boshqa kartada, pastda turardi. Amalda usta
// kalitni qo'lda ko'chirib yozardi (32 belgi — bitta xato = sinx
// ishlamaydi) va dasturni qayerdan olishni so'rab qo'ng'iroq qilardi.
//
// Endi hammasi bitta joyda: o'rnatuvchini yuklab olish, SHU bozorga
// moslangan tayyor config bo'lagi va nusxalash tugmasi.
function BozorOrnatish({ kalit, apiUrl, yop }) {
  const yuklab = useSorov(() => api.ol('/api/yuklab_royxat'), []);
  const fayllar = yuklab.malumot?.fayllar || [];
  const setup = fayllar.find((f) => /setup.*\.exe$/i.test(f.nom))
             || fayllar.find((f) => /\.exe$/i.test(f.nom));
  const apk = fayllar.find((f) => /\.apk$/i.test(f.nom));

  // Server manzili sozlamadan keladi. Bo'sh bo'lsa — brauzer manzili
  // (panel va API bir domenda turgan odatiy holat).
  const url = apiUrl || window.location.origin;
  const bolak = `"markaz": {\n  "yoq": true,\n  "url": "${url}",\n`
              + `  "kalit": "${kalit.kalit}"\n}`;

  const bolakYukla = () => {
    const b = new Blob([bolak + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `markaz_bolagi_bozor${kalit.id || ''}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Kart sarlavha={kalit.yangi
      ? `"${kalit.nom}" qoʻshildi — oʻrnatishga tayyorlash`
      : `"${kalit.nom}" uchun YANGI kalit`}>
      <ol className="text-sm flex flex-col gap-3 list-decimal ml-5">
        <li>
          <b>Dasturni yuklab oling</b> va bozor kompyuteriga oʻrnating.
          <div className="flex gap-2 mt-2 flex-wrap">
            {yuklab.yuklanmoqda ? <Skelet qator={1} />
              : setup ? (
                <a href={`/yuklab/${encodeURIComponent(setup.nom)}`}
                   className="px-3 py-1.5 rounded-lg text-sm font-medium inline-block"
                   style={{ background: 'var(--color-asos-600)', color: '#fff' }}>
                  ⬇ {setup.nom} ({hajm(setup.hajm)})
                </a>
              ) : (
                <span style={{ color: 'var(--ogoh)' }}>
                  Oʻrnatuvchi serverga qoʻyilmagan — pastdagi «Dasturni yuklab
                  olish» boʻlimiga qarang.
                </span>
              )}
            {apk && (
              <a href={`/yuklab/${encodeURIComponent(apk.nom)}`}
                 className="px-3 py-1.5 rounded-lg text-sm font-medium inline-block border"
                 style={{ borderColor: 'var(--chegara)', color: 'var(--matn)' }}>
                ⬇ {apk.nom} (telefon kassasi)
              </a>
            )}
          </div>
        </li>
        <li>
          <b>Ulanish kalitini qoʻying.</b> Bozor kompyuteridagi
          <code className="mx-1">C:\ChorvaNazorat\config.json</code> ichiga:
          <pre className="text-xs p-3 rounded-lg overflow-x-auto mt-2"
               style={{ background: 'var(--fon)' }}>{bolak}</pre>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Tugma onClick={() => navigator.clipboard.writeText(kalit.kalit)}>
              Faqat kalitni nusxalash
            </Tugma>
            <Tugma onClick={() => navigator.clipboard.writeText(bolak)}>
              Boʻlakni nusxalash
            </Tugma>
            <Tugma onClick={bolakYukla}>⬇ Fayl qilib yuklab olish</Tugma>
          </div>
        </li>
        <li>
          <b>Dasturni oching.</b> U qurilma raqamini koʻrsatadi — uni
          <a href="#litsenziya" className="mx-1 underline">Litsenziya</a>
          boʻlimiga kiritib kalit chiqaring.
        </li>
        <li>
          Zavod PIN kodlari birinchi kirishda <b>majburiy
          almashtiriladi</b> — dastur oʻzi soʻraydi.
        </li>
      </ol>
      <div className="text-xs mt-3" style={{ color: 'var(--matn-3)' }}>
        Kalit bazada saqlanadi — bu kartani yopsangiz ham yoʻqolmaydi,
        reyestrdagi «Kalit» tugmasi bilan yangisini chiqarish mumkin.
      </div>
      <div className="mt-3">
        <Tugma turi="asosiy" onClick={yop}>Yopdim</Tugma>
      </div>
    </Kart>
  );
}

function Yuklab() {
  const { yuklanmoqda, xato, malumot, yangila } =
    useSorov(() => api.ol('/api/yuklab_royxat'), []);
  return (
    <Kart sarlavha="Dasturni yuklab olish">
      {yuklanmoqda ? <Skelet qator={4} />
        : xato ? <XatoPanel xato={xato} qayta={yangila} />
        : !malumot.fayllar.length ? (
          <Bosh belgi={BelgiPaket}>
            Yuklash papkasi boʻsh yoki ulanmagan.
            <div className="mt-1 font-mono text-xs">{malumot.papka}</div>
            <div className="mt-2 text-xs">
              ChorvaNazorat_Setup.exe va ChorvaKassa.apk shu papkaga qoʻyiladi
              (docker-compose da <code>./yuklash</code> ulangan).
            </div>
          </Bosh>
        ) : (
          <Jadval qatorlar={malumot.fayllar} kalit={(f) => f.nom}
                  ustunlar={[
                    { nom: 'Fayl', mono: true, maydon: 'nom' },
                    { nom: 'Hajm', ong: true, chiz: (f) => hajm(f.hajm) },
                    { nom: 'Sana', chiz: (f) => sana(f.sana.slice(0, 10)) },
                    { nom: '', ong: true, chiz: (f) => (
                        <a href={`/yuklab/${encodeURIComponent(f.nom)}`}
                           className="px-3 py-1.5 rounded-lg text-sm font-medium inline-block"
                           style={{ background: 'var(--color-asos-600)', color: '#fff' }}>
                          ⬇ Yuklab olish
                        </a>) },
                  ]} />
        )}
    </Kart>
  );
}

// ── AUDIT JURNALI ──
//
// Ilgari 100 qator filtrsiz chiqardi. Amalda ularning yarmi "kirish"
// yozuvlari bo'lib, sahifa cho'zilib ketardi va IZLANAYOTGAN amal —
// "kim litsenziyani bekor qildi", "kim sonlarni qo'lda kiritdi" —
// shovqin ichida yo'qolardi. Endi amal turi bo'yicha filtr bor va
// ro'yxat bosqichma-bosqich ochiladi.
function Jurnal() {
  const [amal, setAmal] = useState('');
  const [koproq, setKoproq] = useState(50);
  const { yuklanmoqda, xato, malumot, yangila } =
    useSorov(() => api.ol('/api/jurnal?limit=500'), []);

  const hammasi = malumot?.qatorlar || [];
  // Amal turlari — bazada bor bo'lganlari, sanog'i bilan
  const turlar = [];
  for (const q of hammasi) {
    const t = turlar.find((x) => x.nom === q.amal);
    if (t) t.soni += 1; else turlar.push({ nom: q.amal, soni: 1 });
  }
  turlar.sort((a, b) => b.soni - a.soni);

  const suzilgan = amal ? hammasi.filter((q) => q.amal === amal) : hammasi;
  const kor = suzilgan.slice(0, koproq);

  const maydon = {
    background: 'var(--panel-2)', borderColor: 'var(--chegara)', color: 'var(--matn)',
  };

  return (
    <Kart sarlavha="Audit jurnali (kim nima qildi)"
          izoh="Har amal yoziladi: kim, qachon, qaysi IP dan"
          ong={<Tugma onClick={() => yangila()}>Yangilash</Tugma>}>
      {yuklanmoqda ? <Skelet qator={4} />
        : xato ? <XatoPanel xato={xato} qayta={yangila} />
        : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-3 chop-yashir">
              <select value={amal} onChange={(e) => { setAmal(e.target.value); setKoproq(50); }}
                      className="px-3 py-1.5 rounded-lg border text-sm" style={maydon}>
                <option value="">Hamma amallar ({hammasi.length})</option>
                {turlar.map((t) => (
                  <option key={t.nom} value={t.nom}>{t.nom} ({t.soni})</option>
                ))}
              </select>
              {amal && (
                <Tugma kichik onClick={() => setAmal('')}>✕ filtrni olib tashlash</Tugma>
              )}
              <span className="text-xs" style={{ color: 'var(--matn-3)' }}>
                {suzilgan.length} yozuvdan {Math.min(koproq, suzilgan.length)} tasi
              </span>
            </div>

            <Jadval qatorlar={kor} kalit={(j) => j.id}
                    csvNom="audit_jurnali" bosh="Bunday amal yoʻq"
                    ustunlar={[
                      { nom: 'Vaqt', mono: true, saralash: (j) => j.ts,
                        csv: (j) => sanaVaqt(j.ts * 1000, true),
                        chiz: (j) => sanaVaqt(j.ts * 1000, true) },
                      { nom: 'Rol', chiz: (j) => <Teg>{j.rol}</Teg> },
                      { nom: 'Amal', mono: true, maydon: 'amal' },
                      { nom: 'Bozor', chiz: (j) => j.bozor || (j.bozor_id || '—') },
                      { nom: 'Tafsilot', maydon: 'tafsilot' },
                      { nom: 'Manzil', mono: true, maydon: 'manzil' },
                    ]} />

            {suzilgan.length > kor.length && (
              <div className="flex justify-center mt-3 chop-yashir">
                <Tugma onClick={() => setKoproq((n) => n + 100)}>
                  Yana 100 tasini koʻrsatish
                </Tugma>
              </div>
            )}
          </>
        )}
    </Kart>
  );
}

// ── O'Z PAROLINI ALMASHTIRISH ──
// HAR ROL uchun. Busiz paroli oshkor bo'lgan xodim uni o'zi tuzata
// olmasdi va admin (yoki SSH) kelguncha kutib turardi.
function ParolAlmash() {
  const [eski, setEski] = useState('');
  const [yangi, setYangi] = useState('');
  const [takror, setTakror] = useState('');
  const [xato, setXato] = useState('');
  const [ok, setOk] = useState(false);
  const [ketmoqda, setKetmoqda] = useState(false);

  const yubor = async (e) => {
    e.preventDefault();
    setXato(''); setOk(false);
    if (yangi !== takror) { setXato('yangi parollar mos kelmadi'); return; }
    setKetmoqda(true);
    try {
      await api.yubor('/api/parol_almash', { eski, yangi });
      setOk(true); setEski(''); setYangi(''); setTakror('');
    } catch (err) { setXato(err.message); }
    finally { setKetmoqda(false); }
  };

  const maydon = {
    borderColor: 'var(--chegara)', background: 'var(--panel-2)',
    color: 'var(--matn)',
  };
  return (
    <Kart sarlavha="Parolni almashtirish"
          izoh="Parolingiz boshqa birov bilgan bo'lsa — darhol almashtiring">
      <form onSubmit={yubor} className="grid md:grid-cols-3 gap-3 max-w-3xl">
        <input type="password" autoComplete="current-password"
               placeholder="Joriy parol" value={eski}
               onChange={(e) => setEski(e.target.value)}
               className="px-3 py-2 rounded-lg border" style={maydon} />
        <input type="password" autoComplete="new-password"
               placeholder="Yangi parol" value={yangi}
               onChange={(e) => setYangi(e.target.value)}
               className="px-3 py-2 rounded-lg border" style={maydon} />
        <input type="password" autoComplete="new-password"
               placeholder="Yangi parol (takror)" value={takror}
               onChange={(e) => setTakror(e.target.value)}
               className="px-3 py-2 rounded-lg border" style={maydon} />
        <div className="md:col-span-3 flex items-center gap-3">
          <Tugma turi="asosiy" type="submit" disabled={ketmoqda}>
            {ketmoqda ? 'Saqlanmoqda…' : 'Almashtirish'}
          </Tugma>
          {ok && <span className="text-sm" style={{ color: 'var(--text-success, #15704A)' }}>
            Parol almashtirildi. Boshqa qurilmalardagi seanslar yopildi.
          </span>}
          {xato && <span className="text-sm" style={{ color: '#ef4444' }}>{xato}</span>}
        </div>
      </form>
    </Kart>
  );
}

// ── FOYDALANUVCHILAR (faqat admin) ──
function Foydalanuvchilar() {
  const q = useSorov(() => api.ol('/api/foydalanuvchilar'), []);
  const [yangi, setYangi] = useState({ login: '', nom: '', rol: 'nazorat' });
  const [chiqqan, setChiqqan] = useState(null);   // bir marta ko'rsatiladigan parol
  const [xato, setXato] = useState('');

  const amal = async (fn) => {
    setXato('');
    try { const j = await fn(); q.yangila(true); return j; }
    catch (e) { setXato(e.message); return null; }
  };

  const qosh = () => amal(async () => {
    const j = await api.yubor('/api/foydalanuvchi_qosh', yangi);
    setYangi({ login: '', nom: '', rol: 'nazorat' });
    setChiqqan({ login: j.login, parol: j.parol, yangi: true });
    return j;
  });

  const maydon = {
    borderColor: 'var(--chegara)', background: 'var(--panel-2)',
    color: 'var(--matn)',
  };

  return (
    <Kart sarlavha="Foydalanuvchilar"
          izoh="Har xodimga o'z logini — jurnalda kim nima qilgani ko'rinadi">
      {/* PAROL BIR MARTA KO'RSATILADI. Server uni hash bo'lib
          saqlaydi, ya'ni keyin hech kim (biz ham) tiklay olmaydi. */}
      {chiqqan && (
        <div className="rounded-lg border px-4 py-3 mb-4"
             style={{ borderColor: 'rgba(245,158,11,.5)', background: 'var(--sariq-och, #FDF4E3)' }}>
          <div className="text-sm font-medium">
            {chiqqan.yangi ? 'Yangi foydalanuvchi' : 'Parol tiklandi'}: <b>{chiqqan.login}</b>
          </div>
          <div className="mt-1 font-mono text-lg">{chiqqan.parol}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--matn-3)' }}>
            Bu parol BOSHQA KO'RSATILMAYDI — nusxalab, xodimga bering.
            U birinchi kirishdan keyin o'zi almashtirsin.
          </div>
          <button onClick={() => setChiqqan(null)}
                  className="text-xs mt-2 underline" style={{ color: 'var(--matn-3)' }}>
            yopish
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <input placeholder="login" value={yangi.login}
               onChange={(e) => setYangi({ ...yangi, login: e.target.value })}
               className="px-3 py-2 rounded-lg border" style={maydon} />
        <input placeholder="Ism (ixtiyoriy)" value={yangi.nom}
               onChange={(e) => setYangi({ ...yangi, nom: e.target.value })}
               className="px-3 py-2 rounded-lg border" style={maydon} />
        <select value={yangi.rol}
                onChange={(e) => setYangi({ ...yangi, rol: e.target.value })}
                className="px-3 py-2 rounded-lg border" style={maydon}>
          <option value="nazorat">Nazoratchi — faqat ko'rish</option>
          <option value="admin">Administrator — hamma amal</option>
        </select>
        <Tugma turi="asosiy" onClick={qosh} disabled={!yangi.login.trim()}>
          Qo'shish
        </Tugma>
      </div>
      {xato && <div className="text-sm mb-3" style={{ color: '#ef4444' }}>{xato}</div>}

      {q.yuklanmoqda ? <Skelet qator={3} /> : (
        <Jadval
          kalit={(f) => f.id}
          ustunlar={[
            { nom: 'Login', chiz: (f) => <span className="font-medium">{f.login}</span> },
            { nom: 'Ism', chiz: (f) => f.nom || '—' },
            { nom: 'Rol', chiz: (f) => (
                <Teg holat={f.rol === 'admin' ? 'kok' : undefined}>
                  {f.rol === 'admin' ? 'Administrator' : 'Nazoratchi'}
                </Teg>) },
            { nom: 'Holat', chiz: (f) => (
                <Teg holat={f.faol ? 'yashil' : 'qizil'}>
                  {f.faol ? 'faol' : 'bloklangan'}
                </Teg>) },
            { nom: 'Oxirgi kirish', chiz: (f) => f.oxirgi_kirish
                ? new Date(f.oxirgi_kirish * 1000).toLocaleString('uz')
                : '—' },
            { nom: '', chiz: (f) => (
                <div className="flex gap-2 justify-end">
                  <Tugma kichik onClick={() => amal(async () => {
                    const j = await api.yubor('/api/parol_tiklash', { id: f.id });
                    setChiqqan({ login: j.login, parol: j.parol, yangi: false });
                    return j;
                  })}>Parolni tiklash</Tugma>
                  <Tugma kichik onClick={() => amal(() =>
                    api.yubor('/api/foydalanuvchi_holat',
                              { id: f.id, faol: !f.faol }))}>
                    {f.faol ? 'Bloklash' : 'Ochish'}
                  </Tugma>
                </div>) },
          ]}
          qatorlar={q.malumot?.royxat || []}
          bosh="Foydalanuvchi yo'q"
        />
      )}
    </Kart>
  );
}
