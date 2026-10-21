import Foundation

/// Unduhan yang gagal. Disimpan supaya bisa dicoba lagi dari tab Unduhan tanpa memproses link dari awal.
struct FailedJob: Identifiable, Codable, Equatable {
    var id = UUID()
    var title: String
    var path: String        // tautan unduhan dari server (relatif atau absolut)
    var filename: String
    var ext: String
    var link: String?       // link asal; dipakai memperbarui tautan bila sudah kedaluwarsa
    var error: String
    var date: Date
}

@MainActor
final class FailedStore: ObservableObject {
    static let shared = FailedStore()
    private let key = "downloadin.failed.v1"

    @Published private(set) var jobs: [FailedJob] = []

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let list = try? JSONDecoder().decode([FailedJob].self, from: data) {
            jobs = list
        }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(jobs) { UserDefaults.standard.set(data, forKey: key) }
    }

    func add(_ job: FailedJob) {
        jobs.removeAll { $0.filename == job.filename }
        jobs.insert(job, at: 0)
        save()
    }

    func remove(_ job: FailedJob) {
        jobs.removeAll { $0.id == job.id }
        save()
    }

    func removeMatching(filename: String) {
        jobs.removeAll { $0.filename == filename }
        save()
    }

    func removeAll() {
        jobs = []
        save()
    }
}
