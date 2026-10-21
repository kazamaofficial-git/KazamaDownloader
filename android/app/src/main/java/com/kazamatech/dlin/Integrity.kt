package com.kazamatech.dlin

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import java.security.MessageDigest

/**
 * Gerbang anti bajak: memeriksa identitas aplikasi (ID paket, nama, pengembang, domain) dan sidik jari tanda tangan APK.
 * Hanya informasi untuk pengguna (agar tidak tertipu aplikasi tiruan); tidak membatasi siapa pun memodifikasi kode (GPL).
 */
object Integrity {
    enum class Status { OFFICIAL, UNOFFICIAL, UNKNOWN }

    // Nilai pembanding terenkode (agar tidak ikut berubah saat seseorang mengganti nama secara massal).
    private fun d(s: String) = String(android.util.Base64.decode(s, android.util.Base64.NO_WRAP))
    private val PKG = d("Y29tLmthemFtYXRlY2guZGxpbg==")
    private val NAME = d("RG93bmxvYWRJbg==")
    private val DEV = d("S2F6YW1hRGV2")
    private val ORG = d("S2F6YW1hVGVjaA==")
    private val HOST = d("ZGxpbi5rYXphbWFzaXRlLmJpei5pZA==")

    /** Identitas tidak diubah: ID paket, nama aplikasi, nama pengembang, penerbit, dan domain resmi. */
    private fun identityOk(ctx: Context): Boolean = try {
        ctx.packageName == PKG &&
            ctx.applicationInfo.loadLabel(ctx.packageManager).toString() == NAME &&
            BuildConfig.DEVELOPER == DEV && BuildConfig.ORG == ORG &&
            android.net.Uri.parse(BuildConfig.WEB_URL).host == HOST
    } catch (_: Exception) {
        false
    }

    @Suppress("DEPRECATION")
    fun certSha256(ctx: Context): String? = try {
        val pm = ctx.packageManager
        val cert = if (Build.VERSION.SDK_INT >= 28) {
            val info = pm.getPackageInfo(ctx.packageName, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo
            (if (info?.hasMultipleSigners() == true) info.apkContentsSigners else info?.signingCertificateHistory)?.firstOrNull()
        } else {
            pm.getPackageInfo(ctx.packageName, PackageManager.GET_SIGNATURES).signatures?.firstOrNull()
        }
        cert?.let { c -> MessageDigest.getInstance("SHA-256").digest(c.toByteArray()).joinToString("") { "%02x".format(it) } }
    } catch (_: Exception) {
        null
    }

    fun status(ctx: Context): Status {
        if (!identityOk(ctx)) return Status.UNOFFICIAL
        val official = BuildConfig.OFFICIAL_CERT_SHA256.split(',').map { it.trim().lowercase() }.filter { it.isNotEmpty() }
        if (official.isEmpty()) return Status.UNKNOWN
        val mine = certSha256(ctx) ?: return Status.UNKNOWN
        return if (mine in official) Status.OFFICIAL else Status.UNOFFICIAL
    }
}
