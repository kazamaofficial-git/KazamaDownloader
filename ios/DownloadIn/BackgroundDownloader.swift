import Foundation

/// Unduhan yang tetap berjalan saat aplikasi di latar belakang (URLSession background).
/// Bila aplikasi dimatikan sistem lalu dibangunkan kembali, hasilnya tetap disimpan ke Unduhan + notifikasi.
final class BackgroundDownloader: NSObject, URLSessionDownloadDelegate {
    static let shared = BackgroundDownloader()
    static let sessionId = "com.kazamatech.downloadin.background"
    private static let metaKey = "downloadin.bg.meta"

    /// Diisi AppDelegate; dipanggil saat semua event background selesai.
    var backgroundCompletion: (() -> Void)?

    private let lock = NSLock()
    private var continuations: [Int: CheckedContinuation<URL, Error>] = [:]

    private lazy var session: URLSession = {
        let cfg = URLSessionConfiguration.background(withIdentifier: Self.sessionId)
        cfg.sessionSendsLaunchEvents = true
        cfg.isDiscretionary = false
        cfg.timeoutIntervalForRequest = 600     // server bisa memproses (merge/MP3) dulu sebelum mengirim byte pertama
        cfg.timeoutIntervalForResource = 3600
        cfg.httpAdditionalHeaders = ["User-Agent": AppConfig.userAgent]
        return URLSession(configuration: cfg, delegate: self, delegateQueue: nil)
    }()

    /// Menyambungkan kembali sesi lama (dipanggil saat aplikasi dibangunkan oleh sistem).
    func reconnect() { _ = session }

    func download(url: URL, filename: String) async throws -> URL {
        try await withCheckedThrowingContinuation { cont in
            let task = session.downloadTask(with: url)
            lock.lock()
            continuations[task.taskIdentifier] = cont
            lock.unlock()
            saveMeta(task.taskIdentifier, filename)
            task.resume()
        }
    }

    // MARK: - Metadata nama file (bertahan walau aplikasi dimatikan)

    private func saveMeta(_ id: Int, _ name: String) {
        var m = UserDefaults.standard.dictionary(forKey: Self.metaKey) as? [String: String] ?? [:]
        m[String(id)] = name
        UserDefaults.standard.set(m, forKey: Self.metaKey)
    }

    private func takeMeta(_ id: Int) -> String? {
        var m = UserDefaults.standard.dictionary(forKey: Self.metaKey) as? [String: String] ?? [:]
        let name = m.removeValue(forKey: String(id))
        UserDefaults.standard.set(m, forKey: Self.metaKey)
        return name
    }

    private func finish(_ id: Int, name: String?, result: Result<URL, Error>) {
        lock.lock()
        let cont = continuations.removeValue(forKey: id)
        lock.unlock()

        if let cont = cont {
            switch result {
            case .success(let url): cont.resume(returning: url)
            case .failure(let error): cont.resume(throwing: error)
            }
            return
        }
        // Tidak ada layar yang menunggu (aplikasi sempat dimatikan): simpan langsung + beri tahu.
        switch result {
        case .success(let file):
            Task { @MainActor in
                DownloadStore.shared.add(file)
                Notifier.downloadDone(name: name ?? file.lastPathComponent)
            }
        case .failure(let error):
            Task { @MainActor in Notifier.downloadFailed(message: error.localizedDescription) }
        }
    }

    // MARK: - URLSessionDownloadDelegate

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        let id = downloadTask.taskIdentifier
        let name = takeMeta(id)

        if let http = downloadTask.response as? HTTPURLResponse, http.statusCode >= 400 {
            let body = (try? Data(contentsOf: location)).flatMap { try? JSONDecoder().decode(ExtractResponse.self, from: $0) }
            finish(id, name: name, result: .failure(APIError.server(body?.error ?? "Server menolak unduhan (HTTP \(http.statusCode)).")))
            return
        }
        let safe = (name ?? "download-\(id)").replacingOccurrences(of: "/", with: "-")
        let dest = FileManager.default.temporaryDirectory.appendingPathComponent(safe)
        try? FileManager.default.removeItem(at: dest)
        do {
            try FileManager.default.moveItem(at: location, to: dest) // wajib selesai sebelum delegate kembali
            finish(id, name: name, result: .success(dest))
        } catch {
            finish(id, name: name, result: .failure(error))
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let error = error else { return }
        let id = task.taskIdentifier
        finish(id, name: takeMeta(id), result: .failure(error))
    }

    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        DispatchQueue.main.async {
            self.backgroundCompletion?()
            self.backgroundCompletion = nil
        }
    }
}
