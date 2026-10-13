package com.kazamatech.downloadin

import android.Manifest
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File
import java.util.UUID

/**
 * Pulihkan riwayat Unduhan dari file yang sudah ada di Download/DownloadIn
 * (mis. setelah pasang ulang aplikasi, riwayat kosong tetapi file masih ada).
 */
object Restore {
    private val DIR_MIME = DocumentsContract.Document.MIME_TYPE_DIR

    /** Izin baca media yang dibutuhkan untuk melihat file lama milik pemasangan sebelumnya. */
    fun missingPermissions(ctx: Context): Array<String> {
        val need = when {
            Build.VERSION.SDK_INT >= 33 -> arrayOf(
                Manifest.permission.READ_MEDIA_VIDEO, Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_AUDIO,
            )
            Build.VERSION.SDK_INT >= 23 -> arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
            else -> emptyArray()
        }
        return need.filter { ContextCompat.checkSelfPermission(ctx, it) != PackageManager.PERMISSION_GRANTED }.toTypedArray()
    }

    /** Folder awal untuk pemilih folder manual (cadangan bila pemindaian otomatis tidak menemukan apa pun). */
    fun initialTreeUri(): Uri =
        DocumentsContract.buildDocumentUri("com.android.externalstorage.documents", "primary:${Environment.DIRECTORY_DOWNLOADS}/${Storage.FOLDER}")

    fun scanMediaStore(ctx: Context): List<DlRecord> {
        val out = LinkedHashMap<String, DlRecord>()
        if (Build.VERSION.SDK_INT >= 29) {
            val rel = "${Environment.DIRECTORY_DOWNLOADS}/${Storage.FOLDER}/"
            val vol = MediaStore.VOLUME_EXTERNAL_PRIMARY
            val collections = listOf(
                MediaStore.Downloads.getContentUri(vol), MediaStore.Video.Media.getContentUri(vol),
                MediaStore.Images.Media.getContentUri(vol), MediaStore.Audio.Media.getContentUri(vol),
            )
            for (c in collections) try { query(ctx, c, rel, out) } catch (_: Exception) { }
        } else {
            @Suppress("DEPRECATION")
            val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), Storage.FOLDER)
            dir.listFiles()?.filter { it.isFile }?.forEach { f ->
                val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.files", f)
                out.putIfAbsent("${f.name}|${f.length()}", record(uri.toString(), f.name, null, f.lastModified()))
            }
        }
        return out.values.toList()
    }

    private fun query(ctx: Context, collection: Uri, rel: String, out: MutableMap<String, DlRecord>) {
        val proj = arrayOf(
            MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DISPLAY_NAME, MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.DATE_MODIFIED, MediaStore.MediaColumns.SIZE,
        )
        ctx.contentResolver.query(collection, proj, "${MediaStore.MediaColumns.RELATIVE_PATH} LIKE ?", arrayOf("$rel%"), null)?.use { c ->
            while (c.moveToNext()) {
                val name = c.getString(1) ?: continue
                val uri = ContentUris.withAppendedId(collection, c.getLong(0))
                out.putIfAbsent("$name|${c.getLong(4)}", record(uri.toString(), name, c.getString(2), c.getLong(3) * 1000))
            }
        }
    }

    /** Cadangan: pengguna memilih folder Download/DownloadIn lewat pemilih folder sistem. */
    fun scanTree(ctx: Context, tree: Uri): List<DlRecord> {
        try {
            ctx.contentResolver.takePersistableUriPermission(tree, android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } catch (_: Exception) { }
        val out = ArrayList<DlRecord>()
        val children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree))
        val proj = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.COLUMN_LAST_MODIFIED,
        )
        ctx.contentResolver.query(children, proj, null, null, null)?.use { c ->
            while (c.moveToNext()) {
                val mime = c.getString(2)
                if (mime == DIR_MIME) continue
                val doc = DocumentsContract.buildDocumentUriUsingTree(tree, c.getString(0))
                out.add(record(doc.toString(), c.getString(1) ?: continue, mime, c.getLong(3)))
            }
        }
        return out
    }

    fun restore(ctx: Context, found: List<DlRecord>): Int = Downloads.addRestored(ctx, found)

    private fun record(uri: String, name: String, mime: String?, modifiedMs: Long): DlRecord {
        val ext = name.substringAfterLast('.', "").lowercase()
        val m = mime?.takeIf { it.isNotBlank() && it != "application/octet-stream" }
            ?: MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "application/octet-stream"
        val kind = when {
            m.startsWith("video/") -> "video"
            m.startsWith("audio/") -> "audio"
            m.startsWith("image/") -> "images"
            else -> "files"
        }
        return DlRecord(
            id = UUID.randomUUID().toString(), title = name.substringBeforeLast('.'),
            label = if (ext.isEmpty()) "File" else ext.uppercase(), kind = kind, thumbnail = null, sourceUrl = "",
            createdAt = if (modifiedMs > 0) modifiedMs else System.currentTimeMillis(),
            status = DlRecord.STATUS_DONE, uri = uri, mime = m, fileName = name, count = 1,
        )
    }
}
