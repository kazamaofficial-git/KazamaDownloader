package com.kazamatech.downloadin.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.kazamatech.downloadin.AppSettings
import com.kazamatech.downloadin.R

private fun unrestricted(ctx: Context): Boolean =
    ctx.getSystemService(PowerManager::class.java)?.isIgnoringBatteryOptimizations(ctx.packageName) ?: true

/** Pengaturan notifikasi + izin berjalan di latar belakang (unduhan tetap jalan saat layar mati / aplikasi ditutup). */
@Composable
fun BackgroundCard() {
    val ctx = LocalContext.current
    val cs = MaterialTheme.colorScheme
    var notifDl by remember { mutableStateOf(AppSettings.notifDownload(ctx)) }
    var notifUp by remember { mutableStateOf(AppSettings.notifUpdate(ctx)) }
    var allowed by remember { mutableStateOf(NotificationManagerCompat.from(ctx).areNotificationsEnabled()) }
    var free by remember { mutableStateOf(unrestricted(ctx)) }

    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle) {
        val obs = LifecycleEventObserver { _, e ->
            if (e == Lifecycle.Event.ON_RESUME) {
                allowed = NotificationManagerCompat.from(ctx).areNotificationsEnabled()
                free = unrestricted(ctx)
            }
        }
        lifecycle.addObserver(obs)
        onDispose { lifecycle.removeObserver(obs) }
    }

    fun openNotificationSettings() {
        try {
            ctx.startActivity(
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (_: Exception) { }
    }
    val askNotif = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
        allowed = NotificationManagerCompat.from(ctx).areNotificationsEnabled()
        if (!ok && !allowed) openNotificationSettings()
    }

    KazamaCard {
        Text("Notifikasi & latar belakang", style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(4.dp))
        Text(
            "Unduhan tetap berjalan saat layar mati atau aplikasi ditutup, dan kamu diberi tahu saat selesai atau ada versi baru.",
            style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant,
        )
        Spacer(Modifier.height(10.dp))

        SettingSwitch("Unduhan selesai / gagal", "Notifikasi saat unduhan selesai (ketuk untuk memutar) atau gagal") {
            Switch(checked = notifDl, onCheckedChange = { notifDl = it; AppSettings.setNotifDownload(ctx, it) })
        }
        SettingSwitch("Pembaruan aplikasi", "Cek berkala di latar belakang dan beri tahu bila ada versi baru") {
            Switch(checked = notifUp, onCheckedChange = { notifUp = it; AppSettings.setNotifUpdate(ctx, it) })
        }
        Spacer(Modifier.height(8.dp))

        if (!allowed) {
            Text("Notifikasi dimatikan untuk DownloadIn di sistem.", style = MaterialTheme.typography.bodySmall, color = cs.error)
            Spacer(Modifier.height(6.dp))
            PrimaryButton("Izinkan notifikasi", Modifier.fillMaxWidth(), icon = R.drawable.ic_bolt) {
                if (Build.VERSION.SDK_INT >= 33) askNotif.launch(Manifest.permission.POST_NOTIFICATIONS) else openNotificationSettings()
            }
            Spacer(Modifier.height(10.dp))
        }

        Text(
            if (free) "Berjalan di latar belakang: diizinkan tanpa batasan baterai." else "Hemat baterai bisa menghentikan unduhan saat layar mati.",
            style = MaterialTheme.typography.bodySmall, color = if (free) cs.onSurfaceVariant else cs.error,
        )
        if (!free) {
            Spacer(Modifier.height(6.dp))
            PrimaryButton("Izinkan di latar belakang", Modifier.fillMaxWidth(), icon = R.drawable.ic_cpu) {
                try {
                    ctx.startActivity(
                        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:${ctx.packageName}"))
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                } catch (_: Exception) {
                    try { ctx.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) { }
                }
            }
        }
    }
}
