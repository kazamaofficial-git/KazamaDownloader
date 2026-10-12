package com.kazamatech.downloadin.ui

<<<<<<< HEAD
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
=======
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
<<<<<<< HEAD
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Tema Neo-Brutalism, disamakan dengan website. Selalu terang (seperti website).
val XyAccent = NeoViolet          // aksen untuk teks/ikon (terbaca di atas putih)
val XyAccentDark = NeoViolet
val XyOk = Color(0xFF16A34A)
val XyErr = Color(0xFFDC2626)

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
    error = XyErr,
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
=======
import androidx.compose.ui.unit.sp

// Palet clean & netral + satu warna aksen solid (tanpa gradasi). Ikut mode terang/gelap sistem.
val XyAccent = Color(0xFF6D4AFF)
val XyAccentDark = Color(0xFF7C5CFF)
val XyOk = Color(0xFF16A34A)
val XyErr = Color(0xFFDC2626)

private val lightScheme = lightColorScheme(
    primary = XyAccent,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFF1EDFF),
    onPrimaryContainer = Color(0xFF3A1FB8),
    secondary = Color(0xFF52525B),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFF4F4F5),
    onSecondaryContainer = Color(0xFF18181B),
    background = Color.White,
    onBackground = Color(0xFF09090B),
    surface = Color.White,
    onSurface = Color(0xFF09090B),
    surfaceVariant = Color(0xFFF4F4F5),
    onSurfaceVariant = Color(0xFF71717A),
    surfaceContainerLowest = Color.White,
    surfaceContainerLow = Color(0xFFFAFAFA),
    surfaceContainer = Color(0xFFF4F4F5),
    surfaceContainerHigh = Color(0xFFEDEDEF),
    surfaceContainerHighest = Color(0xFFE4E4E7),
    outline = Color(0xFFD4D4D8),
    outlineVariant = Color(0xFFE4E4E7),
    error = XyErr,
)

private val darkScheme = darkColorScheme(
    primary = XyAccentDark,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF261A5C),
    onPrimaryContainer = Color(0xFFD9D0FF),
    secondary = Color(0xFFA1A1AA),
    onSecondary = Color(0xFF09090B),
    secondaryContainer = Color(0xFF27272A),
    onSecondaryContainer = Color(0xFFF4F4F5),
    background = Color(0xFF09090B),
    onBackground = Color(0xFFFAFAFA),
    surface = Color(0xFF09090B),
    onSurface = Color(0xFFFAFAFA),
    surfaceVariant = Color(0xFF18181B),
    onSurfaceVariant = Color(0xFFA1A1AA),
    surfaceContainerLowest = Color(0xFF09090B),
    surfaceContainerLow = Color(0xFF0F0F12),
    surfaceContainer = Color(0xFF141417),
    surfaceContainerHigh = Color(0xFF1B1B1F),
    surfaceContainerHighest = Color(0xFF27272A),
    outline = Color(0xFF3F3F46),
    outlineVariant = Color(0xFF27272A),
    error = Color(0xFFF87171),
)

private val typography = Typography(
    headlineSmall = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.3).sp),
    titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.2).sp),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold),
    titleSmall = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall = TextStyle(fontSize = 12.sp, lineHeight = 16.sp),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
)

@Composable
fun XyTheme(content: @Composable () -> Unit) {
<<<<<<< HEAD
    MaterialTheme(colorScheme = neoScheme, typography = typography, shapes = shapes, content = content)
=======
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) darkScheme else lightScheme,
        typography = typography,
        content = content,
    )
>>>>>>> 70f8a71c6aff65fbf977c765a20ba116576847b8
}
