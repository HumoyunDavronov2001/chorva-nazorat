package uz.chorva.kassa

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import java.io.OutputStream
import java.util.UUID

/**
 * Bluetooth chek printer (XP-P201A va boshqa ESC/POS ko'chma printerlar).
 *
 * NEGA BRAUZER EMAS: brauzerdagi Web Bluetooth faqat BLE (past energiya)
 * bilan ishlaydi va chek printerlarining ko'pi Classic SPP profilida
 * turadi — shuning uchun veb-ilovadan chek chiqmasdi. Native ilovada
 * Classic SPP to'g'ridan-to'g'ri ochiladi.
 */
object Printer {
    // Serial Port Profile — barcha ESC/POS printerlarda shu UUID
    private val SPP: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    @Volatile private var soket: BluetoothSocket? = null
    @Volatile private var oqim: OutputStream? = null
    @Volatile var ulanganNom: String = ""
        private set

    class Qurilma(val nom: String, val mac: String)

    private fun adapter(): BluetoothAdapter? =
        BluetoothAdapter.getDefaultAdapter()

    fun bluetoothYoqilganmi(): Boolean = adapter()?.isEnabled == true

    /** Telefonga ULANGAN (juftlashtirilgan) qurilmalar ro'yxati. */
    @Suppress("MissingPermission")
    fun juftlangan(): List<Qurilma> = try {
        adapter()?.bondedDevices?.map {
            Qurilma(it.name ?: it.address, it.address)
        } ?: emptyList()
    } catch (_: SecurityException) { emptyList() }

    @Suppress("MissingPermission")
    fun ulan(mac: String): String {
        uz()
        val a = adapter() ?: return "Bluetooth yo'q"
        if (!a.isEnabled) return "Bluetooth o'chiq — yoqing"
        return try {
            val d: BluetoothDevice = a.getRemoteDevice(mac)
            // cancelDiscovery — faqat TEZLASHTIRISH uchun (qidiruv ketayotgan
            // bo'lsa ulanish sekinlashadi). Android 12+ da u BLUETOOTH_SCAN
            // ruxsatini talab qiladi; ruxsat bo'lmasa BUTUN ulanish
            // yiqilmasligi kerak — shuning uchun alohida ushlab qolamiz.
            try { a.cancelDiscovery() } catch (_: SecurityException) {}
            val s = d.createRfcommSocketToServiceRecord(SPP)
            s.connect()
            soket = s
            oqim = s.outputStream
            ulanganNom = d.name ?: mac
            "ok"
        } catch (e: Exception) {
            uz()
            "ulanmadi: ${e.message ?: "noma'lum xato"}"
        }
    }

    fun ulanganmi(): Boolean = soket?.isConnected == true && oqim != null

    fun uz() {
        try { oqim?.close() } catch (_: Exception) {}
        try { soket?.close() } catch (_: Exception) {}
        oqim = null
        soket = null
        ulanganNom = ""
    }

    /**
     * Baytlarni printerga uzatish. Katta chek (QR bilan) bir zarbda
     * yuborilsa ba'zi printerlar buferi to'lib yo'qotadi — shuning uchun
     * 256 baytlik bo'laklarga bo'lib, orasida qisqa pauza bilan.
     */
    fun chop(baytlar: ByteArray): String {
        val o = oqim ?: return "printer ulanmagan"
        return try {
            var i = 0
            while (i < baytlar.size) {
                val n = minOf(256, baytlar.size - i)
                o.write(baytlar, i, n)
                o.flush()
                i += n
                Thread.sleep(24)
            }
            "ok"
        } catch (e: Exception) {
            uz()
            "chop etilmadi: ${e.message ?: "aloqa uzildi"}"
        }
    }

    fun saqla(c: Context, mac: String, nom: String) {
        c.getSharedPreferences("chorva", Context.MODE_PRIVATE).edit()
            .putString("printer_mac", mac).putString("printer_nom", nom).apply()
    }

    fun oxirgi(c: Context): Qurilma? {
        val p = c.getSharedPreferences("chorva", Context.MODE_PRIVATE)
        val mac = p.getString("printer_mac", "") ?: ""
        if (mac.isEmpty()) return null
        return Qurilma(p.getString("printer_nom", mac) ?: mac, mac)
    }
}
