import SwiftUI
import Photos
import UIKit

@MainActor
final class HomeViewModel: ObservableObject {
    enum Phase {
        case idle
        case loading
        case result(ExtractResponse)
        case failed(String)
    }

    @Published var link = ""
    private(set) var lastLink: String? = nil
    @Published var phase: Phase = .idle
    @Published var busy: String? = nil
    @Published var toast: String? = nil
    @Published var shareItem: ShareItem? = nil

    func pasteAndFetch() {
        guard let s = UIPasteboard.general.string, !s.isEmpty else {
            showToast("Clipboard kosong")
            return
        }
        link = s
        Task { await fetch() }
    }

    func fetch() async {
        let text = link.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else {
            showToast("Tempel link dulu ya")
            return
        }
        phase = .loading
        lastLink = text
        do {
            phase = .result(try await API.extract(text))
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    func clear() {
        link = ""
        phase = .idle
    }

    func save(path: String, filename: String, ext: String, title: String = "", link: String? = nil) async {
        busy = "Mengunduh… (video gabungan/MP3 diproses server dulu)"
        defer { busy = nil }
        let source = link ?? lastLink
        do {
            let file = try await downloadRefreshing(path: path, filename: filename, link: source)
            FailedStore.shared.removeMatching(filename: filename)
            await deliver(file, ext: ext)
            if UIApplication.shared.applicationState != .active { Notifier.downloadDone(name: filename) }
        } catch {
            FailedStore.shared.add(FailedJob(
                title: title.isEmpty ? filename : title, path: path, filename: filename, ext: ext,
                link: source, error: error.localizedDescription, date: Date()))
            showToast("Gagal. Bisa dicoba lagi di Unduhan > Gagal")
            if UIApplication.shared.applicationState != .active { Notifier.downloadFailed(message: error.localizedDescription) }
        }
    }

    func retry(_ job: FailedJob) {
        Task { await save(path: job.path, filename: job.filename, ext: job.ext, title: job.title, link: job.link) }
    }

    /// Unduh; bila tautan sudah kedaluwarsa (6 jam), ambil tautan baru dari link asal lalu coba sekali lagi.
    private func downloadRefreshing(path: String, filename: String, link: String?) async throws -> URL {
        do {
            return try await API.download(path, filename: filename)
        } catch let e as APIError {
            if case .server(let message) = e, message.lowercased().contains("kedaluwarsa"), let link = link {
                let fresh = try await API.extract(link)
                if let newPath = Self.findPath(in: fresh, filename: filename) {
                    return try await API.download(newPath, filename: filename)
                }
            }
            throw e
        }
    }

    private static func findPath(in response: ExtractResponse, filename: String) -> String? {
        for entry in response.entries ?? [] {
            for option in (entry.video ?? []) + (entry.audio ?? []) where option.filename == filename {
                return option.url
            }
            for item in entry.gallery ?? [] {
                if let image = item.image, image.filename == filename { return image.url }
                if let video = item.video, video.filename == filename { return video.url }
            }
        }
        return nil
    }

    /// Video/foto -> app Foto; lainnya (MP3, dll) -> lembar Bagikan.
    private func deliver(_ file: URL, ext: String) async {
        // salinan lokal untuk tab Unduhan (bisa dibuka saat offline)
        let saved = DownloadStore.shared.add(file) ?? file
        let e = ext.lowercased()
        let isVideo = ["mp4", "mov", "m4v"].contains(e)
        let isImage = ["jpg", "jpeg", "png", "heic", "gif"].contains(e)
        if isVideo || isImage {
            let ok = await saveToPhotos(saved, isVideo: isVideo)
            if ok {
                showToast("Tersimpan di Foto dan Unduhan")
                return
            }
        }
        shareItem = ShareItem(url: saved)
    }

    private func saveToPhotos(_ url: URL, isVideo: Bool) async -> Bool {
        let status = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
        guard status == .authorized || status == .limited else { return false }
        return await withCheckedContinuation { cont in
            PHPhotoLibrary.shared().performChanges({
                if isVideo {
                    _ = PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
                } else {
                    _ = PHAssetChangeRequest.creationRequestForAssetFromImage(atFileURL: url)
                }
            }, completionHandler: { ok, _ in
                cont.resume(returning: ok)
            })
        }
    }

    func showToast(_ message: String) {
        toast = message
        Task {
            try? await Task.sleep(nanoseconds: 2_800_000_000)
            if toast == message { toast = nil }
        }
    }
}
