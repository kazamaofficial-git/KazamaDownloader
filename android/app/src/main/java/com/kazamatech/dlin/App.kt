package com.kazamatech.dlin

import android.app.Application
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class App : Application() {
    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        Downloads.createChannels(this)
        Notifier.createChannels(this)
        if (Integrity.status(this) != Integrity.Status.UNOFFICIAL) com.kazamatech.dlin.update.UpdateCheckWorker.schedule(this)
        Downloads.load(this)
        appScope.launch {
            val ok = Engine.init(this@App)
            engineState.value = if (ok) EngineState.Ready(Engine.version(this@App)) else EngineState.Failed(Engine.initError)
            if (ok) {
                // daemon Python "hangat": link pertama langsung diproses cepat
                PyDaemon.warmUp(this@App)
                // yt-dlp diperbarui otomatis maksimal sekali sehari
                Engine.autoUpdateIfDue(this@App)
                engineState.value = EngineState.Ready(Engine.version(this@App))
            }
        }
    }

    sealed interface EngineState {
        data object Loading : EngineState
        data class Ready(val version: String?) : EngineState
        data class Failed(val message: String?) : EngineState
    }

    companion object {
        val engineState = MutableStateFlow<EngineState>(EngineState.Loading)
        val engine: StateFlow<EngineState> get() = engineState
    }
}
