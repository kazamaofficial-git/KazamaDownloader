import Foundation
import BackgroundTasks

/// Cek pembaruan aplikasi di latar belakang (iOS yang menentukan kapan tepatnya; biasanya beberapa kali sehari).
enum BackgroundRefresh {
    static let identifier = "com.kazamatech.dlin.refresh"

    static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: nil) { task in
            schedule() // jadwalkan berikutnya
            let work = Task {
                if let info = await UpdateChecker.latest() {
                    Notifier.updateAvailable(version: info.version)
                }
                task.setTaskCompleted(success: true)
            }
            task.expirationHandler = { work.cancel() }
        }
    }

    static func schedule() {
        let request = BGAppRefreshTaskRequest(identifier: identifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 6 * 3600)
        try? BGTaskScheduler.shared.submit(request)
    }
}
