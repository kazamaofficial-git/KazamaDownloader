package com.kazamatech.downloadin.ui

import android.content.ActivityNotFoundException
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.rememberCoroutineScope
import coil.compose.AsyncImage
import com.kazamatech.downloadin.Restore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.kazamatech.downloadin.DlRecord
import com.kazamatech.downloadin.Downloads
import com.kazamatech.downloadin.MainViewModel
import com.kazamatech.downloadin.PlatformCatalog
import com.kazamatech.downloadin.R

@Composable
fun DownloadsScreen(vm: MainViewModel) {
    val context = LocalContext.current
    val records by vm.records.collectAsState()
    val cs = MaterialTheme.colorScheme
    val scope = rememberCoroutineScope()

    // ---- Pulihkan: baca file yang sudah ada di Download/DownloadIn ----
    val pickTree = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { tree ->
        if (tree != null) scope.launch {
            val n = withContext(Dispatchers.IO) { Restore.restore(context, Restore.scanTree(context, tree)) }
            Toast.makeText(context, if (n > 0) "$n file dipulihkan" else "Tidak ada file baru di folder itu", Toast.LENGTH_LONG).show()
        }
    }
    suspend fun scanAndRestore() {
        val n = withContext(Dispatchers.IO) { Restore.restore(context, Restore.scanMediaStore(context)) }
        if (n > 0) {
            Toast.makeText(context, "$n file dipulihkan", Toast.LENGTH_LONG).show()
        } else {
            Toast.makeText(context, "Tidak ada file baru terdeteksi. Pilih folder Download/DownloadIn secara manual.", Toast.LENGTH_LONG).show()
            pickTree.launch(Restore.initialTreeUri())
        }
    }
    val askPermissions = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        scope.launch { scanAndRestore() }
    }
    val restore = {
        val need = Restore.missingPermissions(context)
        if (need.isEmpty()) scope.launch { scanAndRestore() } else askPermissions.launch(need)
        Unit
    }

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Unduhan", style = MaterialTheme.typography.headlineSmall, color = cs.onBackground)
                Text("Tersimpan di Download/DownloadIn", style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)
            }
            SmallAction("Pulihkan", R.drawable.ic_refresh, restore)
            if (records.any { it.status == DlRecord.STATUS_DONE || it.status == DlRecord.STATUS_FAILED }) {
                TextButton(onClick = { Downloads.clearFinished(context) }) { Text("Bersihkan") }
            }
        }
        if (records.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(painterResource(R.drawable.ic_inbox), null, Modifier.size(40.dp), tint = cs.onSurfaceVariant)
                    Spacer(Modifier.height(10.dp))
                    Text("Belum ada unduhan", style = MaterialTheme.typography.titleSmall, color = cs.onSurface)
                    Text("Proses link di tab Beranda untuk mulai.", style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Sudah punya file di Download/DownloadIn? Pulihkan ke daftar ini.",
                        style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(10.dp))
                    PrimaryButton("Pulihkan unduhan", icon = R.drawable.ic_refresh, onClick = restore)
                }
            }
            return@Column
        }
        LazyColumn(
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(records, key = { it.id }) { rec ->
                RecordCard(
                    rec,
                    onOpen = {
                        val uri = rec.uri ?: return@RecordCard
                        if (rec.count > 1) {
                            // beberapa file (galeri): buka folder lewat aplikasi galeri/berkas
                            try { context.startActivity(Downloads.openIntent(Uri.parse(uri), rec.mime)) }
                            catch (_: Exception) { Toast.makeText(context, "Tidak ada aplikasi untuk membuka file ini", Toast.LENGTH_SHORT).show() }
                        } else vm.openLocal(uri, rec.mime, rec.title)
                    },
                    onShare = {
                        val uri = rec.uri?.let { Uri.parse(it) } ?: return@RecordCard
                        try { context.startActivity(Downloads.shareIntent(uri, rec.mime)) } catch (_: Exception) { }
                    },
                    onCancel = { Downloads.cancel(context, rec.id) },
                    onRemove = { Downloads.remove(context, rec.id) },
                )
            }
        }
    }
}

@Composable
private fun RecordCard(rec: DlRecord, onOpen: () -> Unit, onShare: () -> Unit, onCancel: () -> Unit, onRemove: () -> Unit) {
    val context = LocalContext.current
    val cs = MaterialTheme.colorScheme
    val platform = PlatformCatalog.detect(rec.sourceUrl)
    KazamaCard(padding = 12.dp) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(56.dp).clip(RoundedCornerShape(10.dp)).background(cs.surfaceContainer), contentAlignment = Alignment.Center) {
                if (rec.thumbnail != null) {
                    AsyncImage(thumbModel(context, rec.thumbnail), null, contentScale = ContentScale.Crop, modifier = Modifier.matchParentSize())
                } else {
                    val icon = when (rec.kind) {
                        "video", "ugoira" -> R.drawable.ic_video
                        "images", "files" -> R.drawable.ic_image
                        else -> R.drawable.ic_music
                    }
                    Icon(painterResource(icon), null, Modifier.size(22.dp), tint = cs.onSurfaceVariant)
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(rec.title, style = MaterialTheme.typography.titleSmall, color = cs.onSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Row(Modifier.padding(top = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                    PlatformLogo(platform, 14.dp)
                    Spacer(Modifier.width(6.dp))
                    Text(rec.label, style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant, fontWeight = FontWeight.Medium)
                }
            }
        }
        when (rec.status) {
            DlRecord.STATUS_QUEUED, DlRecord.STATUS_RUNNING -> {
                Spacer(Modifier.height(10.dp))
                if (rec.progress > 0f) {
                    LinearProgressIndicator(
                        progress = { rec.progress },
                        modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(5.dp)),
                        color = cs.primary, trackColor = cs.surfaceContainerHighest,
                    )
                } else {
                    LinearProgressIndicator(
                        modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(5.dp)),
                        color = cs.primary, trackColor = cs.surfaceContainerHighest,
                    )
                }
                Row(Modifier.padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        rec.line ?: if (rec.status == DlRecord.STATUS_QUEUED) "Mengantri…" else "Memproses…",
                        style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant,
                        modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis,
                    )
                    TextButton(onClick = onCancel) { Text("Batal") }
                }
            }
            DlRecord.STATUS_DONE -> {
                Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(painterResource(R.drawable.ic_check_circle), null, Modifier.size(16.dp), tint = KazamaOk)
                    Text(
                        if (rec.count > 1) "${rec.count} file" else "Selesai",
                        style = MaterialTheme.typography.bodySmall, color = KazamaOk, fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f),
                    )
                    SmallAction("Buka", R.drawable.ic_open, onOpen)
                    IconButton(onClick = onShare, modifier = Modifier.size(34.dp)) {
                        Icon(painterResource(R.drawable.ic_share), "Bagikan", Modifier.size(18.dp), tint = cs.onSurfaceVariant)
                    }
                    IconButton(onClick = onRemove, modifier = Modifier.size(34.dp)) {
                        Icon(painterResource(R.drawable.ic_trash), "Hapus dari daftar", Modifier.size(18.dp), tint = cs.onSurfaceVariant)
                    }
                }
            }
            else -> {
                Row(Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(painterResource(R.drawable.ic_alert), null, Modifier.size(16.dp), tint = cs.error)
                    Spacer(Modifier.width(8.dp))
                    Text(rec.error ?: "Gagal", style = MaterialTheme.typography.bodySmall, color = cs.error, modifier = Modifier.weight(1f))
                    IconButton(onClick = onRemove, modifier = Modifier.size(34.dp)) {
                        Icon(painterResource(R.drawable.ic_trash), "Hapus dari daftar", Modifier.size(18.dp), tint = cs.onSurfaceVariant)
                    }
                }
            }
        }
    }
}
