package com.kazamatech.downloadin

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged

/**
 * Status internet untuk Mode Offline. Sengaja hanya memeriksa kemampuan INTERNET (bukan VALIDATED),
 * supaya jaringan yang memblokir server cek koneksi Google tidak salah dianggap offline.
 */
object Connectivity {
    private fun manager(ctx: Context) = ctx.getSystemService(ConnectivityManager::class.java)

    fun isOnline(ctx: Context): Boolean {
        val cm = manager(ctx) ?: return true
        val net = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(net) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun flow(ctx: Context): Flow<Boolean> = callbackFlow {
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
}
