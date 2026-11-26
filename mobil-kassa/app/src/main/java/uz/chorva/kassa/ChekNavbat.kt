package uz.chorva.kassa

import android.content.Context
import android.util.Base64

/**
 * Chekning "yarim yo'lda qolgan" holatlari — ikki marta chek chiqmasligi uchun.
 *
 * 1) KUTILAYOTGAN: chek serverga yuborildi, lekin javob kelmadi (WiFi uzildi,
 *    kechikdi). Chek bazaga yozilgan bo'lishi ham, yozilmagan bo'lishi ham
 *    mumkin. Shuning uchun keyingi bosishda YANGI chek emas, AYNAN shu chek
 *    o'sha nonce bilan qayta yuboriladi — server takrorni tanib, o'sha chekni
 *    qaytaradi va kassaga ikkinchi marta yozmaydi.
 *
 * 2) CHOPSIZ: chek bazaga yozildi, lekin printerdan chiqmadi. Bunda yana
 *    "chek chiqarish" bosilmasligi kerak (bu yangi savdo bo'lardi) —
 *    o'sha baytlar qayta chop etiladi.
 *
 * Ikkalasi ham telefon xotirasiga (SharedPreferences) darhol yoziladi:
 * ilova yopilib qolsa ham holat yo'qolmaydi.
 */
object ChekNavbat {

    class Kutilayotgan(val nonce: String, val tur: String, val soni: Int, val narx: Long)

    class Chopsiz(val id: Long, val baytlar: ByteArray, val tur: String, val soni: Int)

    private fun p(c: Context) = c.getSharedPreferences("chorva", Context.MODE_PRIVATE)

    fun kutilayotgan(c: Context): Kutilayotgan? {
        val p = p(c)
        val nonce = p.getString("kut_nonce", "") ?: ""
        if (nonce.isEmpty()) return null
        return Kutilayotgan(
            nonce,
            p.getString("kut_tur", "") ?: "",
            p.getInt("kut_soni", 1),
            p.getLong("kut_narx", 0)
        )
    }

    /** commit() — so'rov ketishidan OLDIN diskka tushishi shart. */
    fun kutSaqla(c: Context, k: Kutilayotgan) {
        p(c).edit()
            .putString("kut_nonce", k.nonce).putString("kut_tur", k.tur)
            .putInt("kut_soni", k.soni).putLong("kut_narx", k.narx)
            .commit()
    }

    fun kutTozala(c: Context) {
        p(c).edit().remove("kut_nonce").remove("kut_tur")
            .remove("kut_soni").remove("kut_narx").commit()
    }

    fun chopsiz(c: Context): Chopsiz? {
        val p = p(c)
        val b64 = p.getString("chopsiz_baytlar", "") ?: ""
        if (b64.isEmpty()) return null
        val baytlar = try { Base64.decode(b64, Base64.NO_WRAP) } catch (_: Exception) { return null }
        return Chopsiz(
            p.getLong("chopsiz_id", -1), baytlar,
            p.getString("chopsiz_tur", "") ?: "", p.getInt("chopsiz_soni", 1)
        )
    }

    fun chopsizSaqla(c: Context, ch: Chopsiz) {
        p(c).edit()
            .putLong("chopsiz_id", ch.id)
            .putString("chopsiz_baytlar", Base64.encodeToString(ch.baytlar, Base64.NO_WRAP))
            .putString("chopsiz_tur", ch.tur).putInt("chopsiz_soni", ch.soni)
            .commit()
    }

    fun chopsizTozala(c: Context) {
        p(c).edit().remove("chopsiz_id").remove("chopsiz_baytlar")
            .remove("chopsiz_tur").remove("chopsiz_soni").commit()
    }
}
