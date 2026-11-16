package com.kazamatech.dlin

import java.util.Locale

/** Mengubah keluaran mentah yt-dlp menjadi teks progres yang mudah dibaca, mis. "45% · 48 MB · 2,1 MB/dtk · 1 menit lagi". */
object KazamaProgressText {
    private val downloadLine = Regex(
        """(\d+(?:\.\d+)?)%\s+of\s+~?\s*([\d.]+)\s*([KMGT]?i?B)(?:\s+at\s+([\d.]+)\s*([KMGT]?i?B)/s)?(?:\s+ETA\s+([\d:]+))?""",
        RegexOption.IGNORE_CASE,
    )
    private val indonesian = Locale("id", "ID")

    fun describe(line: String, percent: Float, etaSeconds: Long = -1): String {
        val text = line.trim()
        return when {
            text.startsWith("[download]") && "%" in text -> downloadProgress(text, percent, etaSeconds)
            text.startsWith("[Merger]") -> "Menggabungkan video dan audio…"
            text.startsWith("[ExtractAudio]") -> "Mengonversi audio…"
            text.startsWith("[Metadata]") -> "Menulis metadata…"
            text.startsWith("[KazamaUgoira]") -> "Membuat video dari ugoira…"
            percent > 0f -> "Mengunduh ${(percent * 100).toInt()}%"
            else -> "Memproses…"
        }
    }

    /** Untuk unduhan berkas langsung: "File 2/5 · 45% · 12 MB dari 48 MB". */
    fun filesLine(index: Int, count: Int, bytes: Long, total: Long): String {
        val prefix = if (count > 1) "File $index/$count · " else ""
        if (total <= 0) return prefix + "Mengunduh ${formatSize(bytes)}"
        val percent = (bytes * 100 / total).toInt().coerceIn(0, 100)
        return "$prefix$percent% · ${formatSize(bytes)} dari ${formatSize(total)}"
    }

    private fun downloadProgress(text: String, percent: Float, etaSeconds: Long): String {
        val match = downloadLine.find(text) ?: return "Mengunduh ${(percent * 100).toInt()}%"
        val (percentText, sizeNumber, sizeUnit, speedNumber, speedUnit, etaText) = match.destructured
        val parts = mutableListOf("Mengunduh ${percentText.toDouble().toInt()}%")
        parts += formatNumber(sizeNumber.toDouble()) + " " + unitLabel(sizeUnit)
        if (speedNumber.isNotEmpty()) parts += formatNumber(speedNumber.toDouble()) + " " + unitLabel(speedUnit) + "/dtk"
        val eta = if (etaSeconds >= 0) etaSeconds else parseEta(etaText)
        if (eta >= 0) parts += formatEta(eta)
        return parts.joinToString(" · ")
    }

    private fun unitLabel(unit: String): String = unit.uppercase().replace("IB", "B")

    private fun formatNumber(value: Double): String {
        val rounded = if (value >= 100) "%.0f".format(indonesian, value) else "%.1f".format(indonesian, value)
        return rounded.removeSuffix(",0")
    }

    fun formatSize(bytes: Long): String = when {
        bytes >= 1L shl 30 -> formatNumber(bytes / (1L shl 30).toDouble()) + " GB"
        bytes >= 1L shl 20 -> formatNumber(bytes / (1L shl 20).toDouble()) + " MB"
        bytes >= 1L shl 10 -> formatNumber(bytes / (1L shl 10).toDouble()) + " KB"
        else -> "$bytes B"
    }

    private fun parseEta(text: String): Long {
        if (text.isEmpty()) return -1
        val numbers = text.split(":").mapNotNull { it.toLongOrNull() }
        return when (numbers.size) {
            2 -> numbers[0] * 60 + numbers[1]
            3 -> numbers[0] * 3600 + numbers[1] * 60 + numbers[2]
            else -> -1
        }
    }

    /** 3 -> "hampir selesai", 45 -> "45 detik lagi", 70 -> "1 menit lagi", 5400 -> "1 jam 30 menit lagi". */
    fun formatEta(seconds: Long): String = when {
        seconds < 5 -> "hampir selesai"
        seconds < 60 -> "$seconds detik lagi"
        seconds < 3600 -> "${((seconds + 30) / 60).coerceAtLeast(1)} menit lagi"
        else -> {
            val hours = seconds / 3600
            val minutes = (seconds % 3600 + 30) / 60
            if (minutes == 0L) "$hours jam lagi" else "$hours jam $minutes menit lagi"
        }
    }
}
