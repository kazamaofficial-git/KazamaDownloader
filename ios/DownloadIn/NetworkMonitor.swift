import Foundation
import Network

/// Deteksi jaringan otomatis untuk Mode Offline.
/// Dua lapis: (1) iOS melaporkan ada jaringan, (2) dibuktikan dengan tes akses internet sungguhan.
/// Wi-Fi yang tersambung tetapi "mati" (tanpa internet) dianggap OFFLINE; tes diulang tiap 5 detik saat offline.
final class NetworkMonitor: ObservableObject {
    @Published private(set) var online = true

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.kazamatech.dlin.network")
    private var pathSatisfied = true
    private var loop: Task<Void, Never>?

    private static let session: URLSession = {
        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = 4
        cfg.timeoutIntervalForResource = 6
        cfg.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: cfg)
    }()

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let ok = path.status == .satisfied
            DispatchQueue.main.async {
                self?.pathSatisfied = ok
                self?.restart()
            }
        }
        monitor.start(queue: queue)
        restart()
    }

    deinit {
        monitor.cancel()
        loop?.cancel()
    }

    private func restart() {
        loop?.cancel()
        loop = Task { [weak self] in await self?.run() }
    }

    private func run() async {
        while !Task.isCancelled {
            var ok = false
            if pathSatisfied { ok = await Self.probe() }
            await MainActor.run { if self.online != ok { self.online = ok } }
            try? await Task.sleep(nanoseconds: ok ? 45_000_000_000 : 5_000_000_000)
        }
    }

    // MARK: - Tes akses internet

    /// true bila salah satu server menjawab (server DownloadIn dulu, lalu dua server cek koneksi umum).
    static func probe() async -> Bool {
        let urls = [AppConfig.base + "/api/health", "https://www.gstatic.com/generate_204", "https://cp.cloudflare.com/generate_204"]
        return await withTaskGroup(of: Bool.self) { group in
            for u in urls { group.addTask { await hit(u) } }
            for await ok in group where ok {
                group.cancelAll()
                return true
            }
            return false
        }
    }

    private static func hit(_ s: String) async -> Bool {
        guard let url = URL(string: s) else { return false }
        var req = URLRequest(url: url)
        req.httpMethod = "HEAD"
        do {
            let (_, resp) = try await session.data(for: req)
            return resp is HTTPURLResponse // jawaban HTTP apa pun = jaringan hidup
        } catch {
            return false
        }
    }
}
