// XATO TUTQICH (Error Boundary).
//
// NEGA SHART: React'da bitta komponentdagi kutilmagan xato BUTUN
// daraxtni yiqitadi va foydalanuvchi OQ EKRAN ko'radi — sabab ham,
// nima qilish kerakligi ham yozilmagan. Davlat idorasidagi nazoratchi
// uchun bu "dastur buzuq" degani.
//
// Endi: xato ushlanadi, ekranda tushunarli xabar va ikki yo'l chiqadi
// (bo'limni qayta ochish / sahifani yangilash). Texnik tafsilot yig'ib
// beriladi — qo'llab-quvvatlashga yuborish uchun nusxalash mumkin.

import { Component } from 'react';

export default class XatoTutqich extends Component {
  constructor(p) {
    super(p);
    this.holat = { xato: null, tafsilot: '' };
    this.state = this.holat;
  }

  static getDerivedStateFromError(xato) {
    return { xato };
  }

  componentDidCatch(xato, malumot) {
    // Konsolga ham yozamiz: brauzer devtools'da to'liq zanjir qoladi
    console.error('Panelda kutilmagan xato:', xato, malumot);
    this.setState({ tafsilot: String(malumot?.componentStack || '').trim() });
  }

  nusxala = () => {
    const m = [
      `Xato: ${this.state.xato?.message || this.state.xato}`,
      `Manzil: ${location.href}`,
      `Vaqt: ${new Date().toISOString()}`,
      `Brauzer: ${navigator.userAgent}`,
      this.state.tafsilot,
    ].join('\n');
    navigator.clipboard?.writeText(m);
  };

  render() {
    if (!this.state.xato) return this.props.children;
    return (
      <div className="max-w-2xl mx-auto my-10 rounded-xl border p-6"
           style={{ borderColor: 'rgba(239,68,68,.4)', background: 'var(--panel)' }}>
        <h2 className="text-lg font-bold" style={{ color: '#ef4444' }}>
          Kutilmagan xatolik
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--matn-2)' }}>
          Panelning shu qismini chizib boʻlmadi. Maʼlumotlaringiz saqlanib
          qoldi — bu faqat koʻrsatish xatosi.
        </p>
        <pre className="mt-3 p-3 rounded-lg text-xs overflow-x-auto"
             style={{ background: 'var(--fon)', color: 'var(--matn-2)' }}>
          {String(this.state.xato?.message || this.state.xato)}
        </pre>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => { location.hash = '#bozorlar'; location.reload(); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--color-asos-600)', color: '#fff' }}>
            Bosh sahifaga qaytish
          </button>
          <button onClick={() => location.reload()}
                  className="px-3 py-1.5 rounded-lg text-sm border"
                  style={{ borderColor: 'var(--chegara)' }}>
            Sahifani yangilash
          </button>
          <button onClick={this.nusxala}
                  className="px-3 py-1.5 rounded-lg text-sm border"
                  style={{ borderColor: 'var(--chegara)' }}>
            Xato tafsilotini nusxalash
          </button>
        </div>
      </div>
    );
  }
}
