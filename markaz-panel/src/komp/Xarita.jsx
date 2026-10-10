// XARITA — bozorlar joylashuvi.
//
// MUAMMO: xarita plitkalari OpenStreetMap serveridan keladi. Davlat
// idorasining tarmog'i tashqi saytlarni ko'pincha bloklaydi (yoki
// server umuman internetsiz turadi) — bunda Leaflet jimgina KULRANG
// QUTI ko'rsatadi va foydalanuvchi "xarita buzilgan" deb o'ylaydi.
//
// YECHIM: plitka xatosi ushlanadi. Plitka kelmasa xarita "sxema
// rejimiga" o'tadi: fon o'rniga toza to'r, bozorlar esa o'z
// koordinatalari bo'yicha nuqta bo'lib qoladi — ya'ni ma'lumot baribir
// ko'rinadi va SABAB yozib qo'yiladi.

import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polygon } from 'react-leaflet';
import { soz } from '../format.js';

const MARKAZ = [40.12, 67.85];        // Jizzax viloyati taxminan
const ULANGAN_S = 180;

export default function Xarita({ bozorlar, plitkaUrl, balandlik = 340 }) {
  const [plitkaXato, setPlitkaXato] = useState(false);
  // plitkaUrl bo'sh bo'lsa — server ATAYLAB sxema rejimini so'ragan
  // (idorada internet yo'q yoki tashqi saytlar bloklangan).
  const sxema = plitkaXato || !plitkaUrl;
  const nuqtali = (bozorlar || []).filter((b) => b.lat && b.lon);
  if (!nuqtali.length) return null;

  return (
    <div>
      <div className="rounded-lg overflow-hidden relative"
           style={{ height: balandlik,
                    background: sxema
                      ? 'repeating-linear-gradient(0deg, var(--panel-2) 0 39px, var(--chegara) 39px 40px),'
                        + 'repeating-linear-gradient(90deg, var(--panel-2) 0 39px, var(--chegara) 39px 40px)'
                      : 'var(--panel-2)' }}>
        <MapContainer center={MARKAZ} zoom={8} className="h-full w-full"
                      scrollWheelZoom={false} attributionControl={!sxema}>
          {!sxema && (
            <TileLayer
              attribution="© OpenStreetMap"
              url={plitkaUrl}
              eventHandlers={{ tileerror: () => setPlitkaXato(true) }} />
          )}
          {nuqtali.map((b) => {
            let poli = null;
            try { poli = b.hudud_poli ? JSON.parse(b.hudud_poli) : null; } catch { poli = null; }
            return Array.isArray(poli) && poli.length > 2 ? (
              <Polygon key={`p${b.id}`} positions={poli}
                       pathOptions={{ color: '#10b981', weight: 1, fillOpacity: 0.08 }} />
            ) : null;
          })}
          {nuqtali.map((b) => {
            const jonli = b.aloqa_s >= 0 && b.aloqa_s < ULANGAN_S;
            const rang = !b.faol ? '#78849a' : jonli ? '#10b981' : '#ef4444';
            return (
              <CircleMarker key={b.id} center={[b.lat, b.lon]} radius={10}
                            pathOptions={{ color: rang, fillColor: rang,
                                           fillOpacity: 0.75, weight: 2 }}
                            eventHandlers={{ click: () => { location.hash = `bozor/${b.id}`; } }}>
                <Tooltip>
                  <b>{b.nom}</b><br />
                  chiqdi {soz(b.chiqdi)} · chek {soz(b.chek_bosh)}<br />
                  {!b.faol ? 'toʻxtatilgan' : jonli ? 'ulangan' : 'aloqa yoʻq'}
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {sxema && (
          <div className="absolute left-3 bottom-3 right-3 text-xs rounded-lg px-3 py-2"
               style={{ background: 'var(--panel)', border: '1px solid var(--chegara)',
                        color: 'var(--matn-2)' }}>
            {plitkaXato
              ? 'Xarita tasviri yuklanmadi (internetga chiqish yoʻq) — bozorlar '
                + 'sxema koʻrinishida, oʻz koordinatalari boʻyicha koʻrsatilmoqda.'
              : 'Sxema rejimi: xarita tasviri oʻchirilgan (server sozlamasi). '
                + 'Bozorlar koordinatalari boʻyicha koʻrsatilmoqda.'}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-2 text-xs" style={{ color: 'var(--matn-3)' }}>
        <Belgi rang="#10b981">ulangan</Belgi>
        <Belgi rang="#ef4444">aloqa yoʻq</Belgi>
        <Belgi rang="#78849a">toʻxtatilgan</Belgi>
        <span>Nuqtani bosing — bozor tafsiloti ochiladi.</span>
      </div>
    </div>
  );
}

function Belgi({ rang, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ background: rang }} aria-hidden />
      {children}
    </span>
  );
}
