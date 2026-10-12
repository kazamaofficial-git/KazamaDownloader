import Foundation
import Network

/// Mode Offline: `online == false` saat tidak ada jaringan.
final class NetworkMonitor: ObservableObject {
    @Published private(set) var online = true
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.kazamatech.downloadin.network")

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let on = path.status == .satisfied
            DispatchQueue.main.async { self?.online = on }
        }
        monitor.start(queue: queue)
    }

    deinit { monitor.cancel() }
}
