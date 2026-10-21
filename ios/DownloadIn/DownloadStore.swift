import Foundation

struct LocalFile: Identifiable {
    let url: URL
    let size: Int64
    let date: Date
    var id: String { url.lastPathComponent }
    var name: String { url.lastPathComponent }
    var ext: String { url.pathExtension.lowercased() }
}

/// Salinan unduhan di Documents/DownloadIn (terlihat di app Berkas, bisa dibuka saat offline).
@MainActor
final class DownloadStore: ObservableObject {
    static let shared = DownloadStore()

    @Published private(set) var files: [LocalFile] = []

    private var directory: URL {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("DownloadIn", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    init() { refresh() }

    func refresh() {
        let keys: [URLResourceKey] = [.fileSizeKey, .contentModificationDateKey]
        let urls = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: keys)) ?? []
        files = urls.compactMap { u -> LocalFile? in
            guard let v = try? u.resourceValues(forKeys: Set(keys)) else { return nil }
            return LocalFile(url: u, size: Int64(v.fileSize ?? 0), date: v.contentModificationDate ?? .distantPast)
        }
        .sorted { $0.date > $1.date }
    }

    /// Menyalin berkas ke folder unduhan. Mengembalikan lokasi salinan.
    @discardableResult
    func add(_ file: URL) -> URL? {
        var dest = directory.appendingPathComponent(file.lastPathComponent)
        var n = 1
        while FileManager.default.fileExists(atPath: dest.path) {
            let base = file.deletingPathExtension().lastPathComponent
            dest = directory.appendingPathComponent("\(base)-\(n)").appendingPathExtension(file.pathExtension)
            n += 1
        }
        do {
            try FileManager.default.copyItem(at: file, to: dest)
            refresh()
            return dest
        } catch {
            return nil
        }
    }

    func remove(_ f: LocalFile) {
        try? FileManager.default.removeItem(at: f.url)
        refresh()
    }

    func removeAll() {
        for f in files { try? FileManager.default.removeItem(at: f.url) }
        refresh()
    }
}
