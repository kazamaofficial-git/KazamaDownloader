package com.kazamatech.downloadin.update

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.kazamatech.downloadin.AppSettings
import com.kazamatech.downloadin.Notifier
import java.util.concurrent.TimeUnit

/** Cek versi baru di latar belakang (tiap ±12 jam, hanya saat ada internet) lalu kirim notifikasi. */
class UpdateCheckWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val ctx = applicationContext
        if (!AppSettings.notifUpdate(ctx)) return Result.success()
        val rel = try { AppUpdater.check(ctx) } catch (_: Exception) { return Result.retry() } ?: return Result.success()
        if (AppUpdater.compare(rel.version, AppUpdater.currentVersion) > 0 &&
            AppSettings.lastUpdateNotified(ctx) != rel.version
        ) {
            Notifier.updateAvailable(ctx, rel.version)
            AppSettings.setLastUpdateNotified(ctx, rel.version)
        }
        return Result.success()
    }

    companion object {
        fun schedule(ctx: Context) {
            val req = PeriodicWorkRequestBuilder<UpdateCheckWorker>(12, TimeUnit.HOURS)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("update-check", ExistingPeriodicWorkPolicy.KEEP, req)
        }
    }
}
