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

    func save(path: String, filename: String, ext: String) async {
        busy = "Mengunduh… (video gabungan/MP3 diproses server dulu)"
        defer { busy = nil }
        do {
            let file = try await API.download(path, filename: filename)
            await deliver(file, ext: ext)
            if UIApplication.shared.applicationState != .active { Notifier.downloadDone(name: filename) }
        } catch {
            showToast(error.localizedDescription)
            if UIApplication.shared.applicationState != .active { Notifier.downloadFailed(message: error.localizedDescription) }
        }
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
