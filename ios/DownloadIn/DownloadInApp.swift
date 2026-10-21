import SwiftUI
import UIKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        if Integrity.isOfficial { BackgroundRefresh.register() }
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
    @AppStorage("downloadin.onboarded") private var onboarded = false

    var body: some Scene {
        WindowGroup {
            Group {
                if !Integrity.isOfficial {
                    TamperView()
                } else if onboarded {
                    ContentView()
                } else {
                    OnboardingView {
                        Notifier.requestPermission()   // izin notifikasi diminta setelah "Mulai"
                        onboarded = true
                    }
                }
            }
            .onAppear {
                BackgroundDownloader.shared.reconnect()
                if onboarded { Notifier.requestPermission() }
            }
        }
        .onChange(of: scenePhase) { phase in
            if phase == .background { BackgroundRefresh.schedule() }
        }
    }
}
