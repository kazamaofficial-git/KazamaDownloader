package com.kazamatech.dlin.ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// Neo-Brutalism: sama dengan website DownloadIn (garis hitam tebal, bayangan keras tanpa blur, warna datar).
val Ink = Color(0xFF000000)
val NeoLilac = Color(0xFFE7E2FF)
val NeoYellow = Color(0xFFFFE14D)
val NeoPink = Color(0xFFFF6FB1)
val NeoCyan = Color(0xFF5CE1E6)
val NeoLime = Color(0xFFB6F35B)
val NeoViolet = Color(0xFF7B5CFF)
val NeoBorder = 3.dp

/** Bayangan keras (offset, tanpa blur) di kanan-bawah. Dipasang SEBELUM border/background. */
fun Modifier.neoShadow(offset: Dp = 5.dp, radius: Dp = 14.dp): Modifier = drawBehind {
    val o = offset.toPx()
    drawRoundRect(Ink, topLeft = Offset(o, o), size = size, cornerRadius = CornerRadius(radius.toPx()))
}
