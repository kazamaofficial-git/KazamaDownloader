import Foundation

/// Alamat server DownloadIn. Bisa diganti di layar Atur (disimpan di UserDefaults).
enum AppConfig {
    static let defaultBase = "https://dlin.kazamasite.biz.id"
    static let baseKey = "downloadin.baseURL"

    static var base: String {
        get {
            let v = UserDefaults.standard.string(forKey: baseKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return v.isEmpty ? defaultBase : v.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        }
        set { UserDefaults.standard.set(newValue, forKey: baseKey) }
    }

    static let userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) DownloadInApp/1.1"
}

// MARK: - Model (cermin dari JSON /api/extract)

struct ExtractResponse: Decodable {
    let ok: Bool
    let title: String?
    let platform: PlatformInfo?
    let entries: [Entry]?
    let truncated: Bool?
    let total: Int?
    let error: String?
}

struct PlatformInfo: Decodable {
    let name: String
}

struct Entry: Decodable, Identifiable {
    let title: String?
    let uploader: String?
    let duration: Double?
    let thumbnail: String?
    let webpage_url: String?
    let video: [Option]?
    let audio: [Option]?
    let gallery: [GalleryItem]?

    var id: String { (webpage_url ?? "") + (title ?? "") }
}

struct Option: Decodable, Identifiable {
    let id: String
    let label: String
    let ext: String
    let size: Double?   // server bisa mengirim angka desimal (perkiraan ukuran)
    let codec: String?
    let filename: String
    let url: String
}

struct Media: Decodable {
    let url: String
    let ext: String
    let filename: String
}

struct GalleryItem: Decodable, Identifiable {
    let index: Int
    let type: String
    let thumb: String?
    let image: Media?
    let video: Media?

    var id: Int { index }
}

// MARK: - Klien

enum APIError: LocalizedError {
    case server(String)
    case badURL

    var errorDescription: String? {
        switch self {
        case .server(let m): return m
        case .badURL: return "Alamat server tidak valid."
        }
    }
}

enum API {
    /// URL relatif dari server (mis. "/api/download?t=...") -> URL absolut.
    static func absolute(_ path: String, download: Bool = false) -> URL? {
        var s = path.hasPrefix("http") ? path : AppConfig.base + path
        if download { s += (s.contains("?") ? "&" : "?") + "dl=1" }
        return URL(string: s)
    }

    static func extract(_ link: String) async throws -> ExtractResponse {
        guard let url = URL(string: AppConfig.base + "/api/extract") else { throw APIError.badURL }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.timeoutInterval = 90
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(AppConfig.userAgent, forHTTPHeaderField: "User-Agent")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["url": link])

        let (data, resp) = try await URLSession.shared.data(for: req)
        let decoded = try? JSONDecoder().decode(ExtractResponse.self, from: data)
        if let d = decoded, d.ok { return d }
        let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
        throw APIError.server(decoded?.error ?? "Gagal memproses link (HTTP \(status)).")
    }

    /// Unduh berkas lewat sesi background (tetap jalan saat aplikasi di latar belakang).
    static func download(_ path: String, filename: String) async throws -> URL {
        guard let url = absolute(path, download: true) else { throw APIError.badURL }
        return try await BackgroundDownloader.shared.download(url: url, filename: filename)
    }
}

// MARK: - Pembaruan aplikasi

struct UpdateInfo: Equatable {
    let version: String
    let url: URL
}

struct AndroidInfo: Decodable {
    struct IOS: Decodable { let href: String }
    let ok: Bool
    let available: Bool?
    let version: String?
    let ios: IOS?
}

enum UpdateChecker {
    static var currentVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0"
    }

    /// true bila a lebih baru dari b (bandingkan angka per ruas, abaikan akhiran -dev).
    static func isNewer(_ a: String, than b: String) -> Bool {
        let x = parts(a)
        let y = parts(b)
        let count = max(x.count, y.count)
        for i in 0..<count {
            let l = i < x.count ? x[i] : 0
            let r = i < y.count ? y[i] : 0
            if l != r { return l > r }
        }
        return false
    }

    private static func parts(_ version: String) -> [Int] {
        let clean = version.replacingOccurrences(of: "v", with: "")
        let core = clean.components(separatedBy: "-").first ?? clean
        return core.components(separatedBy: ".").map { Int($0) ?? 0 }
    }

    /// Mengembalikan info versi baru (dan tautan IPA) bila ada.
    static func latest() async -> UpdateInfo? {
        guard let url = URL(string: AppConfig.base + "/api/android") else { return nil }
        var req = URLRequest(url: url)
        req.timeoutInterval = 15
        req.setValue(AppConfig.userAgent, forHTTPHeaderField: "User-Agent")
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            let info = try JSONDecoder().decode(AndroidInfo.self, from: data)
            guard info.ok, info.available == true,
                  let v = info.version,
                  let href = info.ios?.href,
                  isNewer(v, than: currentVersion),
                  let dl = URL(string: AppConfig.base + href) else { return nil }
            return UpdateInfo(version: v, url: dl)
        } catch {
            return nil
        }
    }
}
