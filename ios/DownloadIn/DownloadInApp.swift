import SwiftUI
import UIKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        BackgroundRefresh.register()
        return true
    }

    /// Sistem membangunkan aplikasi karena unduhan background selesai.
    func application(_ application: UIApplication,
                     handleEventsForBackgroundURLSession identifier: String,
                     completionHandler: @escaping () -> Void) {
        BackgroundDownloader.shared.backgroundCompletion = completionHandler
        BackgroundDownloader.shared.reconnect()
    }
}

@main
struct DownloadInApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    BackgroundDownloader.shared.reconnect()
                    Notifier.requestPermission()
                }
        }
        .onChange(of: scenePhase) { phase in
            if phase == .background { BackgroundRefresh.schedule() }
        }
    }
}
