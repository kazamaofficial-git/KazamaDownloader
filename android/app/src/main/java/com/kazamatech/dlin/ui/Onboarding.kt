package com.kazamatech.dlin.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kazamatech.dlin.R
import kotlinx.coroutines.launch

private data class OnboardPage(
    val title: String,
    val body: String,
    val icon: Int?,           // ikon di kotak kuning; null = logo khusus (halaman pertama & terakhir)
    val color: androidx.compose.ui.graphics.Color,
)

private val PAGES = listOf(
    OnboardPage("DownloadIn", "Satu link, semua platform. Unduh video, MP3, dan foto dari 1.700+ situs. Gratis, tanpa iklan.", null, NeoYellow),
    OnboardPage("Tempel atau bagikan", "Tempel link, atau bagikan langsung dari TikTok, Instagram, YouTube, dan aplikasi lain ke DownloadIn.", R.drawable.ic_globe, NeoCyan),
    OnboardPage("Pilih kualitasnya", "Video per resolusi tanpa watermark, MP3, audio asli, foto slide, dan Live Photo. Putar langsung di dalam aplikasi.", R.drawable.ic_video, NeoLime),
    OnboardPage("Jalan di latar belakang", "Unduhan tetap berjalan saat layar mati. Kamu diberi tahu saat selesai atau ada versi baru.", R.drawable.ic_bolt, NeoPink),
    OnboardPage("Offline pun aman", "Tanpa internet, Unduhan tetap bisa dibuka. Pasang ulang aplikasi? Pulihkan file lamamu sekali ketuk.", R.drawable.ic_inbox, NeoCyan),
    OnboardPage("Dibuat oleh KazamaTech", "Gratis, tanpa pelacakan, dan terbuka. Siap mengunduh?", null, NeoYellow),
)

/** Layar sambutan saat aplikasi pertama kali dipasang. */
@Composable
fun OnboardingScreen(onFinish: () -> Unit) {
    val pager = rememberPagerState(pageCount = { PAGES.size })
    val scope = rememberCoroutineScope()
    val last = pager.currentPage == PAGES.lastIndex

    Box(Modifier.fillMaxSize().background(NeoLilac).statusBarsPadding().navigationBarsPadding()) {
        HorizontalPager(state = pager, modifier = Modifier.fillMaxSize()) { index ->
            PageContent(index, PAGES[index])
        }

        if (!last) {
            TextButton(onClick = onFinish, modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)) {
                Text("Lewati", color = Ink, fontWeight = FontWeight.ExtraBold)
            }
        }

        Column(
            Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                repeat(PAGES.size) { i ->
                    val on = i == pager.currentPage
                    Box(
                        Modifier.height(10.dp).width(if (on) 26.dp else 10.dp)
                            .background(if (on) Ink else Ink.copy(alpha = 0.25f), CircleShape)
                    )
                }
            }
            Spacer(Modifier.height(22.dp))
            PrimaryButton(if (last) "Mulai" else "Lanjut", Modifier.fillMaxWidth()) {
                if (last) onFinish() else scope.launch { pager.animateScrollToPage(pager.currentPage + 1) }
            }
        }
    }
}

@Composable
private fun PageContent(index: Int, page: OnboardPage) {
    Column(
        Modifier.fillMaxSize().padding(start = 28.dp, end = 28.dp, bottom = 170.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
            when {
                index == 0 -> Image(painterResource(R.drawable.ic_launcher_foreground), null, Modifier.size(280.dp))
                page.icon == null -> Image(painterResource(R.drawable.kazamatech_logo), "KazamaTech", Modifier.size(240.dp))
                else -> Box(
                    Modifier.size(190.dp).neoShadow(8.dp, 28.dp)
                        .background(page.color, RoundedCornerShape(28.dp))
                        .border(NeoBorder, Ink, RoundedCornerShape(28.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(painterResource(page.icon), null, Modifier.size(84.dp), tint = Ink)
                }
            }
        }
        Text(
            page.title, color = Ink, textAlign = TextAlign.Center,
            style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            page.body, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}
