// KIRISH — login va parol.
//
// ILGARI BU YERDA 4 XONALI PIN EDI. Uch sabab bilan almashtirildi:
//   1. 4 raqam — bor-yo'g'i 10 000 variant, panel esa internetda;
//   2. PIN HAMMA UCHUN BITTA edi: kim kirganini ajratib bo'lmasdi va
//      bir xodim ishdan ketsa PINni hammaga almashtirish kerak edi;
//   3. Jurnalda "kirish" yozuvi bor edi-yu, KIMNING kirgani yo'q edi.
//
// Parol faqat SHU yerda yuboriladi; javobda httpOnly cookie keladi va
// undan keyin parol hech qayerda ko'rinmaydi.
//
// Server 3 xatodan keyin kutish beradi ("qoldi" soniya) — ekranda
// sanoq ketadi va tugmalar o'chadi.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Logo } from '../komp/Belgi.jsx';

export default function Kirish({ tugadi, sessiyaTugadi }) {
  const [login, setLogin] = useState('');
  const [parol, setParol] = useState('');
  const [korsat, setKorsat] = useState(false);
  const [xato, setXato] = useState('');
  const [kutish, setKutish] = useState(0);
  const [yuborilmoqda, setYuborilmoqda] = useState(false);
  const parolMaydon = useRef(null);

  useEffect(() => {
    if (kutish <= 0) return undefined;
    const t = setInterval(() => setKutish((k) => (k > 0 ? k - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [kutish]);

  const yubor = async (e) => {
    e?.preventDefault?.();
    if (kutish > 0 || yuborilmoqda) return;
    // Bo'sh maydon bilan serverga bormaymiz — u baribir xato urinish
    // deb hisoblab, cheklovni yaqinlashtirardi.
    if (!login.trim() || !parol) {
      setXato('login va parolni kiriting');
      return;
    }
    setYuborilmoqda(true);
    setXato('');
    try {
      const j = await api.kirish(login.trim(), parol);
      tugadi(j.rol);
    } catch (err) {
      const q = err?.qoldi;
      setXato(err.message || 'kirib boʻlmadi');
      // Loginni QOLDIRAMIZ — odam odatda parolda adashadi va uni
      // qaytadan terishga majburlash bekorga bezovta qiladi.
      setParol('');
      parolMaydon.current?.focus();
      if (typeof q === 'number' && q > 0) setKutish(q);
    } finally {
      setYuborilmoqda(false);
    }
  };

  const maydon = {
    borderColor: 'var(--chegara)', background: 'var(--panel-2)',
    color: 'var(--matn)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm cn-kir">
        <div className="text-center mb-6">
          <div className="flex justify-center"><Logo olcham={56} /></div>
          <h1 className="text-xl font-bold mt-3">CHORVA NAZORAT</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--matn-3)' }}>
            Markaziy nazorat serveri
          </p>
        </div>

        {sessiyaTugadi && (
          <div className="rounded-xl border px-4 py-3 mb-3 text-sm"
               style={{ borderColor: 'rgba(245,158,11,.4)', background: 'var(--panel)',
                        color: '#f59e0b' }}>
            Sessiya muddati tugadi — xavfsizlik uchun qaytadan kiring.
          </div>
        )}

        <form onSubmit={yubor} className="rounded-2xl border p-5"
              style={{ borderColor: 'var(--chegara)', background: 'var(--panel)',
                       boxShadow: 'var(--soya)' }}>
          <label className="text-sm font-medium" htmlFor="login">Login</label>
          <input id="login" name="username" type="text" autoFocus
                 autoComplete="username" value={login} disabled={kutish > 0}
                 onChange={(e) => setLogin(e.target.value)}
                 className="w-full mt-2 mb-4 px-3 py-2.5 rounded-lg border"
                 style={maydon} />

          <label className="text-sm font-medium" htmlFor="parol">Parol</label>
          <div className="relative mt-2">
            <input id="parol" name="password" ref={parolMaydon}
                   type={korsat ? 'text' : 'password'}
                   autoComplete="current-password" value={parol}
                   disabled={kutish > 0}
                   onChange={(e) => setParol(e.target.value)}
                   className="w-full px-3 py-2.5 pr-16 rounded-lg border"
                   style={maydon} />
            {/* Parolni ko'rsatish — uzun parolni qo'lda terishda
                xatoni topish uchun. Tugma tabga TUSHMAYDI: Tab bosgan
                odam to'g'ridan-to'g'ri "Kirish" ga o'tsin. */}
            <button type="button" tabIndex={-1}
                    onClick={() => setKorsat((k) => !k)}
                    aria-label={korsat ? 'Parolni yashirish' : 'Parolni koʻrsatish'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded"
                    style={{ color: 'var(--matn-3)' }}>
              {korsat ? 'yashirish' : 'koʻrsatish'}
            </button>
          </div>

          <button type="submit" disabled={kutish > 0 || yuborilmoqda}
                  className="w-full mt-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
                  style={{ background: 'var(--color-asos-600)', color: '#fff' }}>
            {yuborilmoqda ? 'Tekshirilmoqda…' : 'Kirish'}
          </button>

          {kutish > 0 && (
            <div className="mt-3 text-sm text-center" style={{ color: '#f59e0b' }}>
              Juda koʻp xato urinish · <b>{kutish}</b> soniya kuting
            </div>
          )}
          {xato && kutish <= 0 && (
            <div className="mt-3 text-sm text-center" style={{ color: '#ef4444' }}>
              {xato}
            </div>
          )}
        </form>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--matn-3)' }}>
          Administrator — boshqaruv; Nazoratchi (Soliq/Prokuratura) — faqat koʻrish.
        </p>
      </div>
    </div>
  );
}
