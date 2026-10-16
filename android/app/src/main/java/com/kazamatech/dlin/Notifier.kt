package com.kazamatech.dlin

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/** Notifikasi aplikasi: unduhan selesai, unduhan gagal, dan pembaruan tersedia. */
object Notifier {
    const val CH_UPDATE = "update"

    fun createChannels(ctx: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = ctx.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CH_UPDATE, "Pembaruan aplikasi", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "Pemberitahuan saat versi DownloadIn yang baru tersedia"
            }
        )
    }

    private fun pending(ctx: Context, code: Int, fill: Intent.() -> Unit): PendingIntent {
        val intent = Intent(ctx, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .apply(fill)
        return PendingIntent.getActivity(ctx, code, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }

    private fun show(ctx: Context, id: Int, n: android.app.Notification) {
        try { NotificationManagerCompat.from(ctx).notify(id, n) } catch (_: SecurityException) { }
    }

    /** Unduhan selesai: ketuk -> buka tab Unduhan dan putar di dalam aplikasi. */
    fun downloadDone(ctx: Context, id: Int, title: String, uri: Uri, mime: String?) {
        if (!AppSettings.notifDownload(ctx)) return
        val pi = pending(ctx, id) {
            putExtra("tab", 1)
            putExtra("open_uri", uri.toString())
            putExtra("open_mime", mime)
            putExtra("open_title", title)
        }
        show(ctx, id, NotificationCompat.Builder(ctx, Downloads.CH_DONE)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Unduhan selesai")
            .setContentText(title)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build())
    }

    fun downloadFailed(ctx: Context, id: Int, title: String?, message: String) {
        if (!AppSettings.notifDownload(ctx)) return
        val pi = pending(ctx, id) { putExtra("tab", 1) }
        show(ctx, id, NotificationCompat.Builder(ctx, Downloads.CH_DONE)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Unduhan gagal")
            .setContentText(listOfNotNull(title, message).joinToString(" · "))
            .setStyle(NotificationCompat.BigTextStyle().bigText(listOfNotNull(title, message).joinToString("\n")))
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build())
    }

    /** Versi baru tersedia: ketuk -> langsung ke layar Pembaruan. */
    fun updateAvailable(ctx: Context, version: String) {
        if (!AppSettings.notifUpdate(ctx)) return
        val pi = pending(ctx, 7001) { putExtra("screen", "update") }
        show(ctx, 7001, NotificationCompat.Builder(ctx, CH_UPDATE)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("DownloadIn $version tersedia")
            .setContentText("Ketuk untuk memperbarui sekarang.")
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build())
    }
}
