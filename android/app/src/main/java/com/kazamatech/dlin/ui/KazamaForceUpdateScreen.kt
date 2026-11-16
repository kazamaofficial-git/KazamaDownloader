package com.kazamatech.dlin.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.kazamatech.dlin.BuildConfig
import com.kazamatech.dlin.KazamaProgressText
import com.kazamatech.dlin.MainViewModel
import com.kazamatech.dlin.R
import com.kazamatech.dlin.update.AppUpdater

/** Pembaruan wajib: tidak bisa ditutup; aplikasi baru bisa dipakai lagi setelah versi terbaru terpasang. */
@Composable
fun KazamaForceUpdateScreen(vm: MainViewModel, release: AppUpdater.Release) {
    BackHandler { /* sengaja tidak melakukan apa pun */ }
    val context = LocalContext.current
    val colors = MaterialTheme.colorScheme
    val state by vm.updateState.collectAsState()

    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_RESUME) vm.onResumeFromSettings() }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }

    Column(
        Modifier.fillMaxSize().background(NeoLilac).statusBarsPadding().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Image(painterResource(R.drawable.ic_launcher_foreground), null, Modifier.size(150.dp))
        KazamaCard {
            Text("Pembaruan wajib", style = MaterialTheme.typography.titleLarge, color = Ink)
            Spacer(Modifier.height(6.dp))
            Text(
                "Versi ${release.version} sudah tersedia (terpasang: ${AppUpdater.currentVersion}). " +
                    "Perbarui dulu untuk melanjutkan memakai DownloadIn.",
                style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))
            when (val current = state) {
                is AppUpdater.State.Downloading -> {
                    val fraction = if (current.total > 0) current.bytes.toFloat() / current.total else 0f
                    LinearProgressIndicator(progress = { fraction }, Modifier.fillMaxWidth().height(8.dp), color = Ink, trackColor = colors.surfaceVariant)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Mengunduh ${(fraction * 100).toInt()}% · ${KazamaProgressText.formatSize(current.bytes)} dari ${KazamaProgressText.formatSize(current.total)}",
                        style = MaterialTheme.typography.bodySmall, color = colors.onSurfaceVariant,
                    )
                }
                is AppUpdater.State.Installing ->
                    Text("Memasang pembaruan…", style = MaterialTheme.typography.bodyMedium, color = Ink, fontWeight = FontWeight.Bold)
                is AppUpdater.State.NeedsPermission -> {
                    Text("Izinkan DownloadIn memasang aplikasi, lalu kembali ke sini.", style = MaterialTheme.typography.bodySmall, color = colors.onSurfaceVariant)
                    Spacer(Modifier.height(10.dp))
                    PrimaryButton("Izinkan pemasangan", Modifier.fillMaxWidth(), icon = R.drawable.ic_check) {
                        context.startActivity(AppUpdater.permissionIntent(context))
                    }
                }
                is AppUpdater.State.Failed -> {
                    Text(current.message, style = MaterialTheme.typography.bodySmall, color = colors.error)
                    Spacer(Modifier.height(10.dp))
                    PrimaryButton("Coba lagi", Modifier.fillMaxWidth(), icon = R.drawable.ic_download) { vm.startUpdate(release) }
                }
                else -> PrimaryButton("Perbarui sekarang", Modifier.fillMaxWidth(), icon = R.drawable.ic_download) { vm.startUpdate(release) }
            }
            Spacer(Modifier.height(12.dp))
            SmallAction("Unduh dari website", R.drawable.ic_globe) {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("${BuildConfig.WEB_URL}/download/android")))
            }
        }
    }
}
