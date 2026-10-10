package uz.chorva.kassa

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Kompyuterdagi CHORVA NAZORAT dasturi bilan aloqa.
 *
 * Telefon va kompyuter BITTA WiFi da bo'ladi. Manzilni qo'lda yozish
 * shart emas — [qidir] tarmoqni o'zi skanerlaydi.
 *
 * Xavfsizlik: telefon o'zicha ulanolmaydi. Kompyuterdagi kassa oynasida
 * "Mobil qurilma ulash" bosiladi -> 5 xonali kod chiqadi -> telefonda shu
 * kod kiritiladi -> telefonga TOKEN beriladi. Keyingi har so'rovda token
 * X-Token sarlavhasida yuboriladi.
 */
object Server {
    private const val PORT = 8090
    private const val KUT_MS = 4000

    @Volatile var manzil: String = ""      // "http://192.168.1.5:8090"
    @Volatile var token: String = ""

    fun yukla(c: Context) {
        val p = c.getSharedPreferences("chorva", Context.MODE_PRIVATE)
        manzil = p.getString("manzil", "") ?: ""
        token = p.getString("token", "") ?: ""
    }

    fun saqla(c: Context) {
        c.getSharedPreferences("chorva", Context.MODE_PRIVATE).edit()
            .putString("manzil", manzil).putString("token", token).apply()
    }

    fun unut(c: Context) {
        token = ""
        saqla(c)
    }

    // ── Tarmoqdan dasturni QIDIRISH ──
    // Telefonning IP si 192.168.1.37 bo'lsa, 192.168.1.1 ... .254 ni
    // tekshiramiz. 64 ta ip bir vaqtda — butun /24 ~3-5 soniyada.
    fun qidir(ozIp: String, topildi: (String) -> Unit) {
        val nuqta = ozIp.lastIndexOf('.')
        if (nuqta < 0) return
        val asos = ozIp.substring(0, nuqta + 1)
        val hovuz = Executors.newFixedThreadPool(64)
        val natija = java.util.concurrent.atomic.AtomicReference<String>(null)
        for (i in 1..254) {
            hovuz.execute {
                if (natija.get() != null) return@execute
                val u = "http://$asos$i:$PORT"
                if (chorvami(u) && natija.compareAndSet(null, u)) {
                    topildi(u)
                }
            }
        }
        hovuz.shutdown()
        try { hovuz.awaitTermination(20, TimeUnit.SECONDS) } catch (_: Exception) {}
    }

    /** Shu manzilda CHORVA NAZORAT turibdimi (tez tekshiruv). */
    fun chorvami(u: String): Boolean = try {
        val c = (URL("$u/status").openConnection() as HttpURLConnection).apply {
            connectTimeout = 500
            readTimeout = 900
            requestMethod = "GET"
        }
        val ok = c.responseCode == 200 &&
            c.inputStream.bufferedReader().readText().contains("\"kameralar\"")
        c.disconnect()
        ok
    } catch (_: Exception) { false }

    /** Telefonning shu WiFi dagi IP manzili. */
    fun ozIp(): String? {
        try {
            val ifs = java.net.NetworkInterface.getNetworkInterfaces()
            while (ifs.hasMoreElements()) {
                val nif = ifs.nextElement()
                if (!nif.isUp || nif.isLoopback) continue
                val addrs = nif.inetAddresses
                while (addrs.hasMoreElements()) {
                    val a: InetAddress = addrs.nextElement()
                    if (!a.isLoopbackAddress && a is java.net.Inet4Address)
                        return a.hostAddress
                }
            }
        } catch (_: Exception) {}
        return null
    }

    // ── HTTP yordamchilari ──
    private fun soro(yol: String, metod: String, tana: String?): String {
        if (manzil.isEmpty()) throw Exception("server manzili yo'q")
        val c = (URL("$manzil$yol").openConnection() as HttpURLConnection).apply {
            connectTimeout = KUT_MS
            readTimeout = KUT_MS
            requestMethod = metod
            if (token.isNotEmpty()) setRequestProperty("X-Token", token)
            if (tana != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }
        tana?.let { c.outputStream.use { o -> o.write(it.toByteArray()) } }
        val kod = c.responseCode
        val matn = (if (kod in 200..299) c.inputStream else c.errorStream)
            ?.bufferedReader()?.readText() ?: ""
        c.disconnect()
        // 401 — token kuygan yoki kompyuterdan UZILGAN. Ilgari bu
        // shunchaki "server xatosi (401)" bo'lib ko'rinardi va telefon
        // eski tokenni saqlab, har so'rovda xato berib turaverardi.
        // Endi token darhol tashlanadi: ekran "qayta ulaning" holatiga
        // qaytadi va kassir 5 xonali kodni yangidan kiritadi.
        if (kod == 401) {
            token = ""
            throw Exception("ulanish uzilgan — kompyuterdan yangi kod oling")
        }
        if (kod !in 200..299) throw Exception("server xatosi ($kod)")
        return matn
    }

    /** 5 xonali kod bilan ulanish. Muvaffaqiyatda token saqlanadi. */
    fun ulash(kod: String, qurilmaNomi: String): String {
        val j = JSONObject(
            soro("/mobil_ulash", "POST",
                JSONObject().put("kod", kod).put("qurilma", qurilmaNomi).toString())
        )
        val t = j.optString("token", "")
        if (t.isEmpty()) return j.optString("natija", "kod qabul qilinmadi")
        token = t
        return "ok"
    }

    class Tur(val nom: String, val narx: Long)

    class ChekMalumot(
        val kompaniya: String, val manzil: String,
        val stir: String, val kassir: String
    )

    class Turlar(val turlar: List<Tur>, val chek: ChekMalumot)

    fun turlar(): Turlar {
        val j = JSONObject(soro("/turlar_json", "GET", null))
        val a: JSONArray = j.optJSONArray("turlar") ?: JSONArray()
        val r = ArrayList<Tur>()
        for (i in 0 until a.length()) {
            val o = a.getJSONObject(i)
            r.add(Tur(o.optString("nom", ""), o.optLong("narx", 0)))
        }
        val c = j.optJSONObject("chek")
        return Turlar(
            r, ChekMalumot(
                c?.optString("kompaniya", "") ?: "",
                c?.optString("manzil", "") ?: "",
                c?.optString("stir", "") ?: "",
                c?.optString("kassir", "") ?: ""
            )
        )
    }

    class ChekNatija(
        val ok: Boolean, val xabar: String, val id: Long,
        val fiskal: Boolean, val qr: String, val escpos: String
    )

    /**
     * Chek yaratish. Server bazaga yozadi, fiskal chekni EPOS ga yuboradi
     * va (printer sozlangan bo'lsa) kompyuterdagi printerdan chiqaradi.
     * Telefon esa qaytgan ma'lumotdan o'z Bluetooth printerida chop etadi.
     *
     * "escpos" — server tayyorlagan baytlar (base64). Bo'lsa AYNAN shular
     * printerga uzatiladi (kompyuterdagi chek bilan bir xil bo'ladi);
     * bo'lmasa ilova chekni o'zi yig'adi (Chek.kt).
     */
    /**
     * Chek chiqarish.
     *
     * NONCE nima uchun: WiFi uzilib qolsa yoki javob kechiksa, so'rov
     * qayta yuborilishi mumkin. Nonce'siz server buni IKKINCHI savdo deb
     * qabul qilardi — fiskal terminalga ikki marta yozilardi va bozor
     * ortiqcha soliq to'lardi. Nonce bilan server takrorni tanib oladi
     * va O'SHA chekni qaytaradi.
     *
     * Nonce har CHAQIRIQDA yangi: bir chek = bir nonce. Qayta urinishda
     * chaqiruvchi AYNAN shu nonce'ni qayta yuborishi kerak, shuning
     * uchun u tashqaridan beriladi.
     */
    fun chek(tur: String, soni: Int, nonce: String): ChekNatija {
        val j = JSONObject(
            soro("/chek", "POST",
                JSONObject().put("tur", tur).put("soni", soni)
                    .put("nonce", nonce).toString())
        )
        val natija = j.optString("natija", "")
        return ChekNatija(
            ok = natija.contains("tayyor"),
            xabar = if (j.has("epos")) "$natija · ${j.optString("epos")}" else natija,
            id = j.optLong("id", -1),
            fiskal = j.optBoolean("fiskal", false),
            qr = j.optString("qr", ""),
            escpos = j.optString("escpos", "")
        )
    }

    /** Bugungi jami (ekranda ko'rsatish uchun). */
    fun bugun(): Pair<Int, Long> = try {
        val j = JSONObject(soro("/cheklar_json", "GET", null))
        val a = j.optJSONArray("cheklar") ?: JSONArray()
        var bosh = 0
        for (i in 0 until a.length()) bosh += a.getJSONObject(i).optInt("soni", 0)
        Pair(bosh, j.optLong("jami_summa", 0))
    } catch (_: Exception) { Pair(-1, -1) }
}
