package com.kazamatech.dlin.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kazamatech.dlin.BuildConfig
import com.kazamatech.dlin.MainViewModel
import com.kazamatech.dlin.R
import com.kazamatech.dlin.App
import com.kazamatech.dlin.Screen
import com.kazamatech.dlin.update.AppUpdater

@Composable
fun AboutScreen(vm: MainViewModel) {
    val context = LocalContext.current
    val engine by vm.engine.collectAsState()
    val cs = MaterialTheme.colorScheme
    fun open(url: String) {
        try {
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) { }
    }

    Column(
        Modifier.fillMaxSize().statusBarsPadding().verticalScroll(rememberScrollState()).padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Spacer(Modifier.height(8.dp))
        Image(painterResource(R.drawable.ic_splash), null, Modifier.size(84.dp))
        Text("DownloadIn", style = MaterialTheme.typography.headlineSmall, color = cs.onBackground)
        Text("Versi ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)

        KazamaCard {
            InfoLine(
                R.drawable.ic_cpu, "Engine",
                when (val e = engine) {
                    is App.EngineState.Ready -> "yt-dlp ${e.version ?: "-"} · FFmpeg 8 (minimal) · Python 3.12 · QuickJS"
                    is App.EngineState.Failed -> "Gagal dimuat: ${e.message}"
                    else -> "Menyiapkan…"
                },
            )
            Text(
                "Platform sering mengubah sistemnya. Kalau ada link yang tiba-tiba gagal, perbarui engine dulu.",
                style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant, modifier = Modifier.padding(start = 30.dp),
            )
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                PrimaryButton(
                    text = if (vm.updating) "Memperbarui…" else "Perbarui engine",
                    icon = R.drawable.ic_refresh,
                    enabled = !vm.updating && engine is App.EngineState.Ready,
                    modifier = Modifier.weight(1f),
                ) { vm.updateEngine() }
                if (vm.updating) {
                    Spacer(Modifier.width(12.dp))
                    CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.5.dp)
                }
            }
            vm.updateMessage?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = cs.onSurface, modifier = Modifier.padding(top = 8.dp))
            }
        }

        val update by vm.updateState.collectAsState()
        KazamaCard {
            val available = update as? AppUpdater.State.Available
            InfoLine(
                R.drawable.ic_update, "Pembaruan aplikasi",
                if (available != null) "Versi ${available.release.version} tersedia — ketuk untuk memperbarui"
                else "Versi ${BuildConfig.VERSION_NAME} · ketuk untuk cek pembaruan",
            ) { vm.openUpdates() }
            InfoLine(R.drawable.ic_scale, "Lisensi open source", "Komponen & teks lisensi lengkap") { vm.screen = Screen.Licenses }
        }

        KazamaCard {
            InfoLine(R.drawable.ic_folder, "Lokasi file", "Internal storage › Download › DownloadIn")
            InfoLine(R.drawable.ic_globe, "Versi web", BuildConfig.WEB_URL) { open(BuildConfig.WEB_URL) }
            val integrity = remember { com.kazamatech.dlin.Integrity.status(context) }
            when (integrity) {
                com.kazamatech.dlin.Integrity.Status.OFFICIAL ->
                    InfoLine(R.drawable.ic_check_circle, "Keaslian", "Build resmi KazamaTech")
                com.kazamatech.dlin.Integrity.Status.UNOFFICIAL ->
                    InfoLine(R.drawable.ic_alert, "Keaslian", "Bukan build resmi. Unduh hanya dari website atau GitHub resmi KazamaTech")
                else -> InfoLine(R.drawable.ic_cpu, "Keaslian", "Build pengembangan (belum diverifikasi)")
            }
            InfoLine(R.drawable.ic_code, "Source code (GPL-3.0)", BuildConfig.REPO_URL) { open(BuildConfig.REPO_URL) }
        }

        KazamaCard {
            Row(Modifier.fillMaxWidth().clickable { open("https://www.kazamasite.biz.id") }, verticalAlignment = Alignment.CenterVertically) {
                KazamaTechLogo(52.dp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Row {
                        Text("Dibuat oleh ", style = MaterialTheme.typography.titleSmall, color = cs.onSurface, fontWeight = FontWeight.Normal)
                        Text("KazamaTech", style = MaterialTheme.typography.titleSmall, color = cs.onSurface)
                    }
                    Text("Developer: KazamaDev", style = MaterialTheme.typography.bodySmall, color = cs.primary)
                }
            }
            Spacer(Modifier.height(12.dp))
            Text(
                "Dibangun di atas proyek open source: yt-dlp, youtubedl-android, FFmpeg, LAME, Python, QuickJS, Jetpack Compose, " +
                    "Media3. Logo platform adalah merek milik pemiliknya masing-masing.",
                style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant,
            )
        }

        KazamaCard {
            Text("Dukung pengembangan", style = MaterialTheme.typography.titleSmall, color = cs.onSurface)
            Spacer(Modifier.height(4.dp))
            Text(
                "DownloadIn gratis dan tanpa iklan. Kalau terbantu, donasi lewat QRIS (semua e-wallet & m-banking) sangat berarti untuk biaya server dan pengembangan.",
                style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant,
            )
            Spacer(Modifier.height(12.dp))
            AsyncImage(
                model = BuildConfig.QRIS_URL,
                contentDescription = "QRIS donasi KazamaTech",
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth().heightIn(max = 360.dp).clip(RoundedCornerShape(12.dp)).clickable { open(BuildConfig.QRIS_URL) },
            )
            Spacer(Modifier.height(4.dp))
            Text("Ketuk gambar untuk membukanya lebih besar.", style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)
        }

        Text(
            "Gunakan hanya untuk konten milik sendiri atau yang kamu punya izin untuk mengunduhnya. " +
                "Hormati hak cipta kreator. DownloadIn tidak berafiliasi dengan platform mana pun.",
            style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant, textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 8.dp),
        )
        Spacer(Modifier.height(12.dp))
    }
}
