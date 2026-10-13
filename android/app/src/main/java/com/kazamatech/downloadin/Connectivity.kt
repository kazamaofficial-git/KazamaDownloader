package com.kazamatech.downloadin

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.cancelChildren
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.transformLatest
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.launch
import java.net.HttpURLConnection
import java.net.URL

/**
 * Deteksi jaringan otomatis untuk Mode Offline.
 *
 * Dua lapis: (1) sistem melaporkan ada jaringan (Wi-Fi/seluler), lalu (2) dibuktikan dengan tes akses
 * internet sungguhan. Wi-Fi yang tersambung tetapi "mati" (tanpa internet) dianggap OFFLINE.
 * Selama offline tes diulang tiap 5 detik, sehingga begitu internet hidup lagi aplikasi langsung online.
 */
object Connectivity {
    private fun manager(ctx: Context) = ctx.getSystemService(ConnectivityManager::class.java)

    /** Perkiraan cepat (hanya kemampuan INTERNET dari sistem), dipakai sebagai nilai awal. */
    fun isOnline(ctx: Context): Boolean {
        val cm = manager(ctx) ?: return true
        val net = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(net) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    // Server DownloadIn dulu, lalu dua server cek koneksi umum (cukup salah satu yang menjawab).
    private val PROBES = listOf(
        "${BuildConfig.WEB_URL}/api/health",
        "https://www.gstatic.com/generate_204",
        "https://cp.cloudflare.com/generate_204",
    )

    private fun hit(url: String): Boolean = try {
        val c = URL(url).openConnection() as HttpURLConnection
        c.connectTimeout = 3500
        c.readTimeout = 3500
        c.requestMethod = "GET"
        c.useCaches = false
        c.instanceFollowRedirects = false
        c.setRequestProperty("User-Agent", "DownloadIn/${BuildConfig.VERSION_NAME}")
        c.responseCode // jawaban HTTP apa pun (200/204/301/404...) = jaringan hidup
        c.disconnect()
        true
    } catch (_: Exception) {
        false
    }

    /** true bila salah satu server menjawab; false bila semuanya gagal/timeout. */
    suspend fun probe(): Boolean = coroutineScope {
        val result = CompletableDeferred<Boolean>()
        val jobs = PROBES.map { u -> launch(Dispatchers.IO) { if (hit(u)) result.complete(true) } }
        launch { jobs.joinAll(); result.complete(false) }
        val ok = result.await()
        coroutineContext.cancelChildren()
        ok
    }

    private fun capability(ctx: Context): Flow<Boolean> = callbackFlow {
        val cm = manager(ctx)
        if (cm == null) {
            trySend(true)
            awaitClose { }
            return@callbackFlow
        }
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { trySend(true) }
            override fun onLost(network: Network) { trySend(false) }
            override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                trySend(caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET))
            }
        }
        cm.registerDefaultNetworkCallback(callback)
        trySend(isOnline(ctx))
        awaitClose { cm.unregisterNetworkCallback(callback) }
    }.distinctUntilChanged()

    @OptIn(ExperimentalCoroutinesApi::class)
    fun flow(ctx: Context): Flow<Boolean> = capability(ctx).transformLatest { hasNetwork ->
        if (!hasNetwork) {
            emit(false)
            return@transformLatest
        }
        var last: Boolean? = null
        while (true) {
            val ok = probe()
            if (ok != last) { emit(ok); last = ok }
            delay(if (ok) 45_000L else 5_000L)
        }
    }.distinctUntilChanged()
}
