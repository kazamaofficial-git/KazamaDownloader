import Foundation

/// Gerbang anti bajak: memeriksa bahwa identitas aplikasi tidak diubah (ID bundel, nama aplikasi, nama pengembang, penerbit).
/// Nilai pembanding disimpan terenkode agar tidak ikut berubah saat seseorang mengganti nama secara massal.
/// Catatan: IPA selalu ditandatangani ulang oleh alat sideload di perangkat pengguna, jadi tanda tangan tidak diperiksa.
enum Integrity {
    private static func d(_ s: String) -> String {
        String(data: Data(base64Encoded: s) ?? Data(), encoding: .utf8) ?? ""
    }

    private static let bundle = d("Y29tLmthemFtYXRlY2guZGxpbg==")
    private static let appName = d("RG93bmxvYWRJbg==")
    private static let developer = d("S2F6YW1hRGV2")
    private static let org = d("S2F6YW1hVGVjaA==")
    private static let host = d("ZGxpbi5rYXphbWFzaXRlLmJpei5pZA==")

    static var isOfficial: Bool {
        let info = Bundle.main.infoDictionary ?? [:]
        let id = Bundle.main.bundleIdentifier ?? ""
        let name = (info["CFBundleDisplayName"] as? String) ?? (info["CFBundleName"] as? String) ?? ""
        // alat sideload (AltStore) bisa menambah akhiran pada ID bundel, jadi cukup diawali ID resmi
        return id.hasPrefix(bundle)
            && name == appName
            && (info["KDDeveloper"] as? String) == developer
            && (info["KDOrg"] as? String) == org
            && AppConfig.defaultBase.contains(host)
    }
}
