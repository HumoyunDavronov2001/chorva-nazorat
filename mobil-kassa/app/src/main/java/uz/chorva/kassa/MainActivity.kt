package uz.chorva.kassa

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.util.Base64
import android.view.Gravity
import android.view.View
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.util.concurrent.Executors

/**
 * CHORVA KASSA — bozor xodimi telefoni uchun kassa.
 *
 * Kompyuterdagi CHORVA NAZORAT bilan BITTA WiFi da ishlaydi: manzil o'zi
 * topiladi, 5 xonali kod bilan ulanadi, chek Bluetooth printerdan
 * (XP-P201A) chiqadi.
 */
class MainActivity : AppCompatActivity() {

    private val ip = Executors.newSingleThreadExecutor()   // tarmoq ipi
    private val ui = Handler(Looper.getMainLooper())

    private lateinit var ildiz: LinearLayout
    private lateinit var holatMatn: TextView
    private lateinit var holatNuqta: View

    private var turlar: List<Server.Tur> = emptyList()
    private var chekM: Server.ChekMalumot? = null
    private var tanlangan = 0
    private var soni = 1

    // ── Ranglar (kompyuterdagi dastur bilan bir uslubda) ──
    private val FON = Color.parseColor("#070b09")
    private val KARTA = Color.parseColor("#0e1512")
    private val CHEGARA = Color.parseColor("#1d2a24")
    private val YASHIL = Color.parseColor("#3cdc82")
    private val MATN1 = Color.parseColor("#e6f0ea")
    private val MATN2 = Color.parseColor("#8fa398")
    private val QIZIL = Color.parseColor("#ff4d5e")

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        Server.yukla(this)
        ildiz = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(FON)
        }
        val kaydiruvchi = ScrollView(this).apply {
            setBackgroundColor(FON)
            addView(ildiz)
        }
        setContentView(kaydiruvchi)
        ruxsatSora()
        chiz()
    }

    // ── Umumiy yasovchilar ──
    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    private fun karta(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        background = GradientDrawable().apply {
            setColor(KARTA); cornerRadius = dp(14).toFloat()
            setStroke(dp(1), CHEGARA)
        }
        setPadding(dp(16), dp(14), dp(16), dp(14))
        layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
            .apply { setMargins(dp(12), dp(6), dp(12), dp(6)) }
    }

    private fun sarlavha(t: String) = TextView(this).apply {
        text = t; setTextColor(MATN2); textSize = 12f
        setPadding(0, 0, 0, dp(8))
    }

    private fun tugma(t: String, asosiy: Boolean = false) = Button(this).apply {
        text = t
        isAllCaps = false
        textSize = if (asosiy) 19f else 15f
        setTextColor(if (asosiy) Color.parseColor("#04130a") else MATN1)
        background = GradientDrawable().apply {
            setColor(if (asosiy) YASHIL else KARTA)
            cornerRadius = dp(12).toFloat()
            setStroke(dp(1), if (asosiy) YASHIL else CHEGARA)
        }
        setPadding(dp(18), dp(if (asosiy) 20 else 12), dp(18),
            dp(if (asosiy) 20 else 12))
        layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
            .apply { setMargins(0, dp(5), 0, dp(5)) }
    }

    private fun xabar(t: String) =
        ui.post { Toast.makeText(this, t, Toast.LENGTH_LONG).show() }

    // ── Ekranni qayta chizish ──
    private fun chiz() {
        ildiz.removeAllViews()
        ildiz.addView(bosh())
        if (Server.token.isEmpty()) ildiz.addView(ulanishEkrani())
        else {
            ildiz.addView(printerKartasi())
            ildiz.addView(kassaKartasi())
            ildiz.addView(pastki())
        }
    }

    private fun bosh(): View = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(16), dp(18), dp(16), dp(10))
        holatNuqta = View(this@MainActivity).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(if (Server.token.isEmpty()) QIZIL else YASHIL)
            }
            layoutParams = LinearLayout.LayoutParams(dp(10), dp(10))
                .apply { rightMargin = dp(8) }
        }
        addView(holatNuqta)
        addView(TextView(this@MainActivity).apply {
            text = "CHORVA KASSA"
            setTextColor(MATN1); textSize = 18f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        })
        addView(View(this@MainActivity).apply {
            layoutParams = LinearLayout.LayoutParams(0, 1, 1f)
        })
        holatMatn = TextView(this@MainActivity).apply {
            text = if (Server.token.isEmpty()) "ulanmagan"
                   else Server.manzil.removePrefix("http://")
            setTextColor(MATN2); textSize = 11f
        }
        addView(holatMatn)
    }

    // ── 1) ULANISH EKRANI ──
    private fun ulanishEkrani(): View = karta().apply {
        addView(sarlavha("KOMPYUTERGA ULANISH"))
        addView(TextView(this@MainActivity).apply {
            text = "Telefon va kompyuter BITTA WiFi da bo'lishi kerak.\n\n" +
                "1) Kompyuterdagi dasturda Kassa bo'limini oching\n" +
                "2) «Mobil qurilma ulash» tugmasini bosing\n" +
                "3) Chiqqan 5 xonali kodni shu yerga kiriting"
            setTextColor(MATN2); textSize = 14f
            setPadding(0, 0, 0, dp(12))
        })

        val manzilMaydon = EditText(this@MainActivity).apply {
            hint = "192.168.1.5:8090 (avtomatik topiladi)"
            setText(Server.manzil.removePrefix("http://"))
            setTextColor(MATN1); setHintTextColor(MATN2); textSize = 15f
            inputType = InputType.TYPE_CLASS_TEXT
        }
        addView(manzilMaydon)

        addView(tugma("🔍 Tarmoqdan dasturni topish").apply {
            setOnClickListener {
                val oz = Server.ozIp()
                if (oz == null) { xabar("WiFi ulanmagan"); return@setOnClickListener }
                text = "qidirilmoqda… ($oz)"
                isEnabled = false
                ip.execute {
                    var topildi: String? = null
                    Server.qidir(oz) { u -> topildi = u }
                    ui.post {
                        isEnabled = true
                        text = "🔍 Tarmoqdan dasturni topish"
                        if (topildi != null) {
                            Server.manzil = topildi!!
                            manzilMaydon.setText(topildi!!.removePrefix("http://"))
                            xabar("Topildi: ${topildi!!.removePrefix("http://")}")
                        } else xabar("Topilmadi — kompyuterdagi dastur ochiqmi?")
                    }
                }
            }
        })

        val kodMaydon = EditText(this@MainActivity).apply {
            hint = "5 xonali kod"
            setTextColor(MATN1); setHintTextColor(MATN2); textSize = 26f
            gravity = Gravity.CENTER
            inputType = InputType.TYPE_CLASS_NUMBER
            filters = arrayOf(android.text.InputFilter.LengthFilter(5))
        }
        addView(kodMaydon)

        addView(tugma("ULANISH", asosiy = true).apply {
            setOnClickListener {
                var m = manzilMaydon.text.toString().trim()
                if (m.isEmpty()) { xabar("Server manzilini kiriting"); return@setOnClickListener }
                if (!m.startsWith("http")) m = "http://$m"
                if (!m.substringAfterLast(':').all { it.isDigit() }) m = "$m:8090"
                Server.manzil = m
                val kod = kodMaydon.text.toString().trim()
                if (kod.length != 5) { xabar("Kod 5 xonali bo'lishi kerak"); return@setOnClickListener }
                isEnabled = false; text = "ulanmoqda…"
                ip.execute {
                    val n = try { Server.ulash(kod, Build.MODEL ?: "Telefon") }
                            catch (e: Exception) { "ulanmadi: ${e.message}" }
                    ui.post {
                        isEnabled = true; text = "ULANISH"
                        if (n == "ok") {
                            Server.saqla(this@MainActivity)
                            xabar("Ulandi")
                            turlarniYukla()
                        } else xabar(n)
                    }
                }
            }
        })
    }

    // ── 2) PRINTER ──
    private fun printerKartasi(): View = karta().apply {
        addView(sarlavha("BLUETOOTH CHEK PRINTER"))
        val h = TextView(this@MainActivity).apply {
            text = if (Printer.ulanganmi()) "✓ ${Printer.ulanganNom}"
                   else "ulanmagan — chek chiqmaydi"
            setTextColor(if (Printer.ulanganmi()) YASHIL else QIZIL)
            textSize = 14f
            setPadding(0, 0, 0, dp(8))
        }
        addView(h)
        addView(tugma(if (Printer.ulanganmi()) "Boshqa printer tanlash"
                      else "Printerni tanlash va ulash").apply {
            setOnClickListener { printerTanla(h) }
        })
    }

    private fun printerTanla(holat: TextView) {
        if (!Printer.bluetoothYoqilganmi()) {
            xabar("Telefonda Bluetooth ni yoqing"); return
        }
        // Ruxsat berilmagan bo'lsa avval so'raymiz — aks holda qurilmalar
        // ro'yxati bo'sh keladi va sababi tushunarsiz bo'ladi.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            ContextCompat.checkSelfPermission(
                this, Manifest.permission.BLUETOOTH_CONNECT
            ) != PackageManager.PERMISSION_GRANTED) {
            ruxsatSora()
            xabar("Bluetooth ruxsatini bering va qaytadan bosing")
            return
        }
        val ro = Printer.juftlangan()
        if (ro.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("Printer topilmadi")
                .setMessage("Avval telefon sozlamalarida Bluetooth orqali " +
                    "printerni JUFTLANG (XP-P201A), keyin shu yerga qayting.")
                .setPositiveButton("Yaxshi", null).show()
            return
        }
        val nomlar = ro.map { it.nom }.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("Printerni tanlang")
            .setItems(nomlar) { _, i ->
                val q = ro[i]
                holat.text = "ulanmoqda…"
                ip.execute {
                    val n = Printer.ulan(q.mac)
                    ui.post {
                        if (n == "ok") {
                            Printer.saqla(this, q.mac, q.nom)
                            holat.text = "✓ ${q.nom}"
                            holat.setTextColor(YASHIL)
                            xabar("Printer ulandi")
                        } else {
                            holat.text = n
                            holat.setTextColor(QIZIL)
                            xabar(n)
                        }
                    }
                }
            }.show()
    }

    // ── 3) KASSA ──
    private lateinit var jamiMatn: TextView
    private lateinit var soniMatn: TextView

    private fun kassaKartasi(): View = karta().apply {
        // Sarlavha + YANGILASH: kompyuterda yangi tur qo'shilsa yoki narx
        // o'zgarsa telefon shu tugma bilan qayta oladi (ilovani qayta
        // o'rnatish shart emas).
        addView(LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(sarlavha("HAYVON TURI (${turlar.size})"))
            addView(View(this@MainActivity).apply {
                layoutParams = LinearLayout.LayoutParams(0, 1, 1f)
            })
            addView(Button(this@MainActivity).apply {
                text = "↻ yangilash"
                isAllCaps = false
                textSize = 12f
                setTextColor(MATN2)
                background = GradientDrawable().apply {
                    setColor(KARTA); cornerRadius = dp(10).toFloat()
                    setStroke(dp(1), CHEGARA)
                }
                setPadding(dp(12), dp(6), dp(12), dp(6))
                setOnClickListener {
                    text = "yuklanmoqda…"
                    turlarniYukla()
                }
            })
        })
        if (turlar.isEmpty()) {
            addView(TextView(this@MainActivity).apply {
                text = "turlar yuklanmadi"
                setTextColor(MATN2)
            })
            turlarniYukla()
        } else {
            // IKKI USTUNLI to'r: turlar ko'p bo'lganda (7+) bitta ustunda
            // ekran juda uzayib, "CHEK CHIQARISH" tugmasi pastga tushib
            // ketardi. Kompyuterdagi kassa bilan bir xil ko'rinish.
            var i = 0
            while (i < turlar.size) {
                addView(LinearLayout(this@MainActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    for (u in 0..1) {
                        val n = i + u
                        if (n >= turlar.size) {
                            // Toq son bo'lsa oxirgi katak bo'sh qoladi
                            addView(View(this@MainActivity).apply {
                                layoutParams =
                                    LinearLayout.LayoutParams(0, 1, 1f)
                            })
                            continue
                        }
                        val t = turlar[n]
                        addView(turTugma(t, n).apply {
                            layoutParams = LinearLayout.LayoutParams(
                                0, WRAP_CONTENT, 1f
                            ).apply {
                                setMargins(dp(if (u == 0) 0 else 4), dp(5),
                                           dp(if (u == 0) 4 else 0), dp(5))
                            }
                        })
                    }
                })
                i += 2
            }
        }

        addView(sarlavha("SONI").apply { setPadding(0, dp(14), 0, dp(8)) })
        addView(LinearLayout(this@MainActivity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            addView(tugma("−").apply {
                layoutParams = LinearLayout.LayoutParams(dp(76), dp(64))
                setOnClickListener { if (soni > 1) { soni--; yangilaJami() } }
            })
            soniMatn = TextView(this@MainActivity).apply {
                text = soni.toString()
                setTextColor(MATN1); textSize = 34f
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(0, WRAP_CONTENT, 1f)
            }
            addView(soniMatn)
            addView(tugma("+").apply {
                layoutParams = LinearLayout.LayoutParams(dp(76), dp(64))
                setOnClickListener { soni++; yangilaJami() }
            })
        })

        jamiMatn = TextView(this@MainActivity).apply {
            setTextColor(YASHIL); textSize = 22f
            gravity = Gravity.CENTER
            setPadding(0, dp(12), 0, dp(12))
        }
        addView(jamiMatn)
        yangilaJami()

        addView(tugma("CHEK CHIQARISH", asosiy = true).apply {
            setOnClickListener { chekChiqar(this) }
        })
    }

    /** Hayvon turi tugmasi: nomi tepada, narxi pastda (ikki qatorda). */
    private fun turTugma(t: Server.Tur, n: Int) = Button(this).apply {
        text = "${t.nom}\n${pul(t.narx)} so'm"
        isAllCaps = false
        textSize = 15f
        maxLines = 2
        val tanlandi = n == tanlangan
        setTextColor(if (tanlandi) YASHIL else MATN1)
        background = GradientDrawable().apply {
            setColor(KARTA)
            cornerRadius = dp(12).toFloat()
            setStroke(dp(if (tanlandi) 2 else 1),
                      if (tanlandi) YASHIL else CHEGARA)
        }
        setPadding(dp(8), dp(14), dp(8), dp(14))
        setOnClickListener { tanlangan = n; chiz() }
    }

    private fun pul(v: Long): String {
        val s = v.toString()
        val b = StringBuilder()
        for ((i, ch) in s.withIndex()) {
            if (i > 0 && (s.length - i) % 3 == 0) b.append(' ')
            b.append(ch)
        }
        return b.toString()
    }

    private fun yangilaJami() {
        if (!::jamiMatn.isInitialized) return
        soniMatn.text = soni.toString()
        val t = turlar.getOrNull(tanlangan)
        jamiMatn.text = if (t == null) "—"
            else "JAMI:  ${pul(t.narx * soni)} so'm"
    }

    private fun chekChiqar(btn: Button) {
        val t = turlar.getOrNull(tanlangan) ?: run { xabar("Tur tanlanmagan"); return }
        if (!Printer.ulanganmi()) {
            // Oxirgi printerga o'zi qayta ulanib ko'radi
            val oxirgi = Printer.oxirgi(this)
            if (oxirgi == null) { xabar("Avval printerni ulang"); return }
            xabar("Printerga qayta ulanmoqda…")
            ip.execute {
                val n = Printer.ulan(oxirgi.mac)
                ui.post { if (n == "ok") chekChiqar(btn) else xabar(n) }
            }
            return
        }
        btn.isEnabled = false
        btn.text = "yuborilmoqda…"
        val soniSnapshot = soni
        // Bir chek = bir nonce. Tarmoq uzilib qayta yuborilsa ham server
        // IKKINCHI fiskal savdo yaratmaydi (aks holda bozor ortiqcha
        // soliq to'laydi).
        val nonce = java.util.UUID.randomUUID().toString()
        ip.execute {
            try {
                val r = Server.chek(t.nom, soniSnapshot, nonce)
                if (!r.ok) { ui.post { btn.isEnabled = true; btn.text = "CHEK CHIQARISH" }
                    xabar(r.xabar.ifEmpty { "chek yaratilmadi" }); return@execute }
                // Server tayyor baytlarni bergan bo'lsa AYNAN o'shani
                // yuboramiz — kompyuterdagi chek bilan bir xil bo'ladi.
                val baytlar = if (r.escpos.isNotEmpty())
                    Base64.decode(r.escpos, Base64.DEFAULT)
                else Chek.qur(
                    chekM ?: Server.ChekMalumot("", "", "", ""),
                    t.nom, soniSnapshot, t.narx, r.id, r.qr
                )
                val n = Printer.chop(baytlar)
                ui.post {
                    btn.isEnabled = true; btn.text = "CHEK CHIQARISH"
                    if (n == "ok") {
                        soni = 1; yangilaJami(); bugunYangila()
                        xabar("Chek #${r.id} chiqdi" +
                            (if (r.fiskal) " · fiskal OK" else " · fiskal YO'Q"))
                    } else xabar("Chek bazaga yozildi, lekin $n")
                }
            } catch (e: Exception) {
                ui.post { btn.isEnabled = true; btn.text = "CHEK CHIQARISH" }
                xabar("xato: ${e.message}")
            }
        }
    }

    // ── 4) Pastki qator ──
    private lateinit var bugunMatn: TextView

    private fun pastki(): View = karta().apply {
        bugunMatn = TextView(this@MainActivity).apply {
            text = "bugungi savdo yuklanmoqda…"
            setTextColor(MATN2); textSize = 13f
            gravity = Gravity.CENTER
        }
        addView(bugunMatn)
        addView(tugma("Ulanishni uzish").apply {
            setTextColor(QIZIL)
            setOnClickListener {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Ulanishni uzish")
                    .setMessage("Telefon kompyuterdan uziladi. Qayta ulanish " +
                        "uchun yana 5 xonali kod kerak bo'ladi.")
                    .setPositiveButton("Uzish") { _, _ ->
                        Server.unut(this@MainActivity); Printer.uz(); chiz()
                    }
                    .setNegativeButton("Bekor", null).show()
            }
        })
        bugunYangila()
    }

    private fun bugunYangila() {
        if (!::bugunMatn.isInitialized) return
        ip.execute {
            val (bosh, summa) = Server.bugun()
            ui.post {
                bugunMatn.text = if (bosh < 0) "bugungi savdo olinmadi"
                    else "Bugun: $bosh bosh · ${pul(summa)} so'm"
            }
        }
    }

    private fun turlarniYukla() {
        ip.execute {
            try {
                val t = Server.turlar()
                ui.post {
                    turlar = t.turlar; chekM = t.chek
                    if (tanlangan >= turlar.size) tanlangan = 0
                    chiz()
                }
            } catch (e: Exception) {
                xabar("turlar olinmadi: ${e.message}")
            }
        }
    }

    // ── Ruxsatlar (Android 12+ da Bluetooth uchun shart) ──
    // CONNECT — printerga ulanish uchun; SCAN — cancelDiscovery() uchun
    // (u ham SCAN talab qiladi, aks holda "Need BLUETOOTH_SCAN" xatosi).
    private fun ruxsatSora() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        val kerak = arrayOf(
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN
        ).filter {
            ContextCompat.checkSelfPermission(this, it) !=
                PackageManager.PERMISSION_GRANTED
        }
        if (kerak.isNotEmpty())
            ActivityCompat.requestPermissions(this, kerak.toTypedArray(), 1)
    }

    /** Ruxsat berilgach printer ro'yxati darhol ochilishi uchun. */
    override fun onRequestPermissionsResult(
        kod: Int, ruxsatlar: Array<out String>, natijalar: IntArray
    ) {
        super.onRequestPermissionsResult(kod, ruxsatlar, natijalar)
        if (kod == 1) chiz()
    }

    override fun onDestroy() {
        Printer.uz()
        ip.shutdownNow()
        super.onDestroy()
    }
}
