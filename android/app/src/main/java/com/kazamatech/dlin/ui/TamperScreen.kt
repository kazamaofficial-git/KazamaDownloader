package com.kazamatech.dlin.ui

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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kazamatech.dlin.R

/** Layar yang tampil bila APK ini bukan build resmi KazamaTech (mis. APK resmi yang dibongkar lalu ditandatangani ulang). */
@Composable
fun TamperScreen(onOpenOfficial: () -> Unit, onClose: () -> Unit) {
    Column(
        Modifier.fillMaxSize().background(NeoPink).statusBarsPadding().padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Image(painterResource(R.drawable.kazamatech_logo), "KazamaTech", Modifier.size(150.dp))
        Spacer(Modifier.height(24.dp))
        Text(
            "Aplikasi tiruan terdeteksi", color = Ink, textAlign = TextAlign.Center,
            style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            "Aplikasi ini bukan build resmi DownloadIn dari KazamaTech: tanda tangan, ID paket, nama aplikasi, atau identitas pengembangnya sudah diubah. " +
                "Demi keamananmu, aplikasi dihentikan. Unduh versi resmi dari website atau GitHub resmi KazamaTech.",
            color = Ink, textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(Modifier.height(28.dp))
        PrimaryButton("Unduh versi resmi", Modifier.fillMaxWidth(), onClick = onOpenOfficial)
        Spacer(Modifier.height(14.dp))
        PrimaryButton("Tutup", Modifier.fillMaxWidth(), onClick = onClose)
    }
}
