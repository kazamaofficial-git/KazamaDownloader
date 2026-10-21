import Foundation
import UserNotifications

/// Notifikasi lokal: unduhan selesai/gagal dan pembaruan tersedia. Bisa dimatikan di Pengaturan.
enum Notifier {
    static let downloadKey = "downloadin.notif.download"
    static let updateKey = "downloadin.notif.update"
    static let lastUpdateKey = "downloadin.notif.lastUpdateVersion"

    static var downloadEnabled: Bool {
        get { UserDefaults.standard.object(forKey: downloadKey) as? Bool ?? true }
        set { UserDefaults.standard.set(newValue, forKey: downloadKey) }
    }

    static var updateEnabled: Bool {
        get { UserDefaults.standard.object(forKey: updateKey) as? Bool ?? true }
        set { UserDefaults.standard.set(newValue, forKey: updateKey) }
    }

    /// Minta izin notifikasi (muncul sekali oleh sistem).
    static func requestPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    static func authorized(_ completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().getNotificationSettings { s in
            let ok = s.authorizationStatus == .authorized || s.authorizationStatus == .provisional
            DispatchQueue.main.async { completion(ok) }
        }
    }

    private static func post(_ title: String, _ body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }

    static func downloadDone(name: String) {
        guard downloadEnabled else { return }
        post("Unduhan selesai", name)
    }

    static func downloadFailed(message: String) {
        guard downloadEnabled else { return }
        post("Unduhan gagal", message)
    }

    /// Satu notifikasi per versi (tidak mengulang).
    static func updateAvailable(version: String) {
        guard updateEnabled else { return }
        if UserDefaults.standard.string(forKey: lastUpdateKey) == version { return }
        UserDefaults.standard.set(version, forKey: lastUpdateKey)
        post("DownloadIn \(version) tersedia", "Buka aplikasi lalu ketuk Perbarui untuk mengunduh versi terbaru.")
    }
}
