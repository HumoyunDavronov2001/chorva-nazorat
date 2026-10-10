package uz.chorva.kassa

import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * ESC/POS chek yig'uvchi — XP-P201A (58 mm rulon = 32 ustun).
 *
 * Server "escpos" maydonini bersa AYNAN o'sha baytlar ishlatiladi
 * (kompyuterdagi chek bilan bir xil bo'ladi). Bu yerdagi yig'uvchi —
 * zaxira yo'l: server eski versiyada bo'lsa ham telefon chek chiqaradi.
 */
object Chek {
    private const val USTUN = 32                 // 58 mm, A shrift

    private val INIT = byteArrayOf(0x1B, 0x40)
    private val MARKAZ = byteArrayOf(0x1B, 0x61, 0x01)
    private val CHAP = byteArrayOf(0x1B, 0x61, 0x00)
    private val KATTA = byteArrayOf(0x1D, 0x21, 0x11)   // ikki barobar
    private val ODDIY = byteArrayOf(0x1D, 0x21, 0x00)

    /**
     * Kirill/lotin maxsus belgilarni printer tushunadigan ASCII ga.
     * Chek printerlarida UTF-8 yo'q — oldindan almashtirmasak
     * "?" yoki tartibsiz belgilar chiqadi.
     */
    fun ascii(s: String): String {
        val b = StringBuilder(s.length)
        for (ch in s) {
            when (ch) {
                'ʻ', 'ʼ', '‘', '’', '`', '´' -> b.append('\'')
                '“', '”' -> b.append('"')
                '–', '—' -> b.append('-')
                '№' -> b.append("N")
                else -> if (ch.code in 32..126) b.append(ch) else b.append(' ')
            }
        }
        return b.toString().trimEnd()
    }

    /** "Chap ............ O'ng" — ustunga tekislangan qator. */
    private fun juft(chap: String, ong: String, ustun: Int = USTUN): String {
        val c = ascii(chap)
        val o = ascii(ong)
        val bosh = ustun - c.length - o.length
        return if (bosh < 1) "$c $o" else c + " ".repeat(bosh) + o
    }

    private fun markazla(s: String, ustun: Int = USTUN): String {
        val t = ascii(s)
        if (t.length >= ustun) return t
        return " ".repeat((ustun - t.length) / 2) + t
    }

    /**
     * Fiskal QR — printerning O'ZI chizadi (GS ( k). Rasm yuborilmaydi,
     * shuning uchun QR kutubxonasi kerak emas va xato ehtimoli yo'q.
     */
    private fun qr(out: ByteArrayOutputStream, url: String) {
        if (url.isEmpty()) return
        val d = url.toByteArray(Charsets.US_ASCII)
        // model 2
        out.write(byteArrayOf(0x1D, 0x28, 0x6B, 4, 0, 0x31, 0x41, 50, 0))
        // nuqta o'lchami 6
        out.write(byteArrayOf(0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x43, 6))
        // xatoni tuzatish darajasi M
        out.write(byteArrayOf(0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x45, 0x31))
        // ma'lumotni saqlash
        val n = d.size + 3
        out.write(
            byteArrayOf(
                0x1D, 0x28, 0x6B, (n and 0xFF).toByte(), (n shr 8).toByte(),
                0x31, 0x50, 0x30
            )
        )
        out.write(d)
        // chop etish
        out.write(byteArrayOf(0x1D, 0x28, 0x6B, 3, 0, 0x31, 0x51, 0x30))
    }

    fun qur(
        m: Server.ChekMalumot, tur: String, soni: Int, narx: Long,
        chekId: Long, qrUrl: String
    ): ByteArray {
        val o = ByteArrayOutputStream()
        fun satr(s: String) {
            o.write(ascii(s).toByteArray(Charsets.US_ASCII)); o.write('\n'.code)
        }
        val chiziq = "-".repeat(USTUN)
        val summa = narx * soni

        o.write(INIT)
        o.write(MARKAZ); o.write(KATTA)
        satr(m.kompaniya.ifEmpty { "CHORVA BOZORI" })
        o.write(ODDIY)
        if (m.manzil.isNotEmpty()) satr(m.manzil)
        if (m.stir.isNotEmpty()) satr("STIR: ${m.stir}")
        o.write(CHAP)
        satr(chiziq)

        val vaqt = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.US).format(Date())
        satr(juft("Chek raqami", "#$chekId"))
        satr(juft("Vaqt", vaqt))
        if (m.kassir.isNotEmpty()) satr(juft("Kassir", m.kassir))
        satr(chiziq)

        satr(juft(tur, "$soni bosh"))
        satr(juft("Narx (1 bosh)", narx.toString()))
        satr(chiziq)

        o.write(KATTA)
        satr(juft("JAMI", summa.toString(), USTUN / 2))
        o.write(ODDIY)
        o.write(MARKAZ)
        satr("so'm")

        if (qrUrl.isNotEmpty()) {
            o.write('\n'.code)
            qr(o, qrUrl)
            satr("Fiskal chek (QR ni skanerlang)")
        }
        o.write('\n'.code)
        satr(markazla("Xaridingiz uchun rahmat!"))
        // Ko'chma printerda pichoq yo'q — qog'ozni uzish uchun surib beramiz
        o.write(byteArrayOf(0x1B, 0x64, 0x05))
        return o.toByteArray()
    }
}
