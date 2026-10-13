package com.kazamatech.downloadin.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Tema Neo-Brutalism, disamakan dengan website. Selalu terang (seperti website).
val KazamaAccent = NeoViolet          // aksen untuk teks/ikon (terbaca di atas putih)
val KazamaAccentDark = NeoViolet
val KazamaOk = Color(0xFF16A34A)
val KazamaErr = Color(0xFFDC2626)

private val neoScheme = lightColorScheme(
    primary = NeoViolet,
    onPrimary = Color.White,
    primaryContainer = NeoYellow,
    onPrimaryContainer = Ink,
    secondary = Color(0xFF3B3556),
    onSecondary = Color.White,
    secondaryContainer = NeoCyan,
    onSecondaryContainer = Ink,
    tertiary = NeoPink,
    onTertiary = Ink,
    tertiaryContainer = NeoLime,
    onTertiaryContainer = Ink,
    background = NeoLilac,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    surfaceVariant = Color(0xFFF2EFFF),
    onSurfaceVariant = Color(0xFF3B3556),
    surfaceContainerLowest = Color.White,
    surfaceContainerLow = Color.White,
    surfaceContainer = Color.White,
    surfaceContainerHigh = Color(0xFFF2EFFF),
    surfaceContainerHighest = NeoYellow,
    outline = Ink,
    outlineVariant = Ink,
    error = KazamaErr,
)

private val typography = Typography(
    headlineSmall = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.5).sp),
    titleLarge = TextStyle(fontSize = 21.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.4).sp),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.ExtraBold),
    titleSmall = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Bold),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Medium),
    bodySmall = TextStyle(fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.Medium),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Bold),
)

private val shapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(14.dp),
    extraLarge = RoundedCornerShape(18.dp),
)

@Composable
fun KazamaTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = neoScheme, typography = typography, shapes = shapes, content = content)
}
