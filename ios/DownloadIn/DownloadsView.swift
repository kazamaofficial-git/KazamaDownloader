import SwiftUI
import UniformTypeIdentifiers

/// Tab Unduhan: satu-satunya layar yang bisa dibuka saat offline.
struct DownloadsView: View {
    @ObservedObject var store: DownloadStore
    @ObservedObject var failed: FailedStore
    @ObservedObject var vm: HomeViewModel
    let online: Bool
    @State private var category = 0
    @State private var shareItem: ShareItem? = nil
    @State private var viewerItem: ViewerItem? = nil
    @State private var showImporter = false
    @State private var message: String? = nil

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header

                    if store.files.isEmpty && failed.jobs.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Belum ada unduhan").font(.system(size: 18, weight: .heavy))
                            Text("File yang kamu unduh tersimpan di sini dan di app Berkas > DownloadIn. Bisa dibuka kapan saja, termasuk saat offline.")
                                .font(.system(size: 14, weight: .medium))
                            Text("Sudah punya file unduhan sebelumnya? Pulihkan dari app Berkas.")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(Neo.muted)
                            Button { showImporter = true } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "tray.and.arrow.down.fill")
                                    Text("Pulihkan unduhan")
                                }
                            }
                            .buttonStyle(NeoButtonStyle(fill: Neo.yellow))
                            .padding(.trailing, 4)
                        }
                        .foregroundColor(Neo.ink)
                        .padding(18)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .neoBox(fill: .white)
                    } else {
                        chips
                        let shownFailed = category == 0 || category == 4 ? failed.jobs : []
                        let shownFiles = store.files.filter { matches($0, category) }
                        if shownFailed.isEmpty && shownFiles.isEmpty {
                            Text("Belum ada file di kategori \(Self.categories[category]). Tarik ke bawah untuk menyegarkan.")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(Neo.muted)
                        }
                        ForEach(shownFailed) { job in failedRow(job) }
                        ForEach(shownFiles) { f in row(f) }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 20)
            }

            if let message = message {
                Text(message)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundColor(Neo.ink)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .neoBox(fill: Neo.yellow, radius: 12, shadow: 4)
                    .padding(.bottom, 18)
            }
        }
        .refreshable { await refreshAll() }
        .onAppear { store.refresh() }
        .sheet(item: $shareItem) { item in ShareSheet(url: item.url) }
        .fullScreenCover(item: $viewerItem) { item in MediaViewer(url: item.url) }
        .fileImporter(
            isPresented: $showImporter,
            allowedContentTypes: [.movie, .audio, .image, .item],
            allowsMultipleSelection: true
        ) { result in
            restore(result)
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            Text("Unduhan")
                .font(.system(size: 34, weight: .heavy))
                .foregroundColor(Neo.ink)
            Spacer()
            Button { Task { await refreshAll() } } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Neo.ink)
                    .frame(width: 44, height: 44)
                    .neoBox(fill: .white, radius: 12, shadow: 3)
            }
            .accessibilityLabel("Segarkan")
            Button { showImporter = true } label: {
                HStack(spacing: 6) {
                    Image(systemName: "tray.and.arrow.down.fill").font(.system(size: 13, weight: .heavy))
                    Text("Pulihkan").font(.system(size: 13, weight: .heavy))
                }
                .foregroundColor(Neo.ink)
                .padding(.horizontal, 12)
                .frame(height: 44)
                .neoBox(fill: Neo.cyan, radius: 12, shadow: 3)
            }
            .accessibilityLabel("Pulihkan unduhan dari Berkas")
            if !store.files.isEmpty || !failed.jobs.isEmpty {
                Button { store.removeAll(); failed.removeAll() } label: {
                    Image(systemName: "trash.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Neo.ink)
                        .frame(width: 44, height: 44)
                        .neoBox(fill: Neo.pink, radius: 12, shadow: 3)
                }
                .accessibilityLabel("Hapus semua")
            }
        }
        .padding(.trailing, 3)
    }

    private func row(_ f: LocalFile) -> some View {
        HStack(spacing: 12) {
            Button { open(f) } label: {
                HStack(spacing: 12) {
                    Image(systemName: icon(for: f.ext))
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Neo.ink)
                        .frame(width: 44, height: 44)
                        .background(Neo.cyan)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Neo.ink, lineWidth: 2))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(f.name)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundColor(Neo.ink)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                        Text(ByteCountFormatter.string(fromByteCount: f.size, countStyle: .file) + " · " + f.ext.uppercased())
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Neo.muted)
                    }
                    Spacer(minLength: 4)
                }
            }
            .buttonStyle(.plain)

            Button { shareItem = ShareItem(url: f.url) } label: {
                Image(systemName: "square.and.arrow.up").font(.system(size: 16, weight: .bold))
            }
            .accessibilityLabel("Bagikan")
            Button { store.remove(f) } label: {
                Image(systemName: "trash").font(.system(size: 16, weight: .bold))
            }
            .accessibilityLabel("Hapus")
        }
        .foregroundColor(Neo.ink)
        .padding(12)
        .neoBox(fill: .white, radius: 14, shadow: 4)
        .padding(.trailing, 4)
    }

    // MARK: Kategori

    static let categories = ["Semua", "Video", "Audio", "Foto", "Gagal"]

    private func matches(_ f: LocalFile, _ c: Int) -> Bool {
        switch c {
        case 0: return true
        case 1: return ["mp4", "mov", "m4v", "mkv", "webm"].contains(f.ext)
        case 2: return ["mp3", "m4a", "aac", "opus", "ogg", "wav"].contains(f.ext)
        case 3: return ["jpg", "jpeg", "png", "webp", "heic", "gif"].contains(f.ext)
        default: return false
        }
    }

    private func count(_ c: Int) -> Int {
        if c == 4 { return failed.jobs.count }
        if c == 0 { return store.files.count + failed.jobs.count }
        return store.files.filter { matches($0, c) }.count
    }

    private var chips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(0..<Self.categories.count, id: \.self) { i in
                    let selected = category == i
                    Button { category = i } label: {
                        Text("\(Self.categories[i]) \(count(i))")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundColor(Neo.ink)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .neoBox(fill: selected ? Neo.yellow : .white, radius: 10, shadow: selected ? 0 : 3)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 4)
            .padding(.trailing, 6)
        }
    }

    private func failedRow(_ job: FailedJob) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 14, weight: .bold))
                Text(job.title)
                    .font(.system(size: 14, weight: .heavy))
                    .lineLimit(2)
            }
            Text(job.error)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Neo.muted)
                .lineLimit(3)
            HStack(spacing: 10) {
                Button {
                    if online { vm.retry(job) } else { flash("Tidak ada internet. Coba lagi saat online.") }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.clockwise")
                        Text("Coba lagi")
                    }
                }
                .buttonStyle(NeoButtonStyle(fill: Neo.yellow))
                Button { failed.remove(job) } label: {
                    Image(systemName: "trash").font(.system(size: 16, weight: .bold))
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Hapus")
            }
            .padding(.trailing, 4)
        }
        .foregroundColor(Neo.ink)
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .neoBox(fill: Neo.pink, radius: 14, shadow: 4)
        .padding(.trailing, 4)
    }

    /// Segarkan: baca ulang folder unduhan dan buang entri yang filenya sudah hilang.
    private func refreshAll() async {
        let before = store.files.count
        store.refresh()
        let after = store.files.count
        flash(before == after ? "Daftar sudah terbaru" : "Daftar diperbarui (\(after) file)")
    }

    /// Video/audio/foto diputar di dalam aplikasi; format lain lewat lembar Bagikan.
    private func open(_ f: LocalFile) {
        if MediaViewer.canView(f.url) {
            viewerItem = ViewerItem(url: f.url)
        } else {
            shareItem = ShareItem(url: f.url)
        }
    }

    private func restore(_ result: Result<[URL], Error>) {
        guard case .success(let urls) = result else { return }
        var added = 0
        for url in urls {
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            if store.add(url) != nil { added += 1 }
        }
        flash(added > 0 ? "\(added) file dipulihkan" : "Tidak ada file yang dipulihkan")
    }

    private func flash(_ text: String) {
        message = text
        Task {
            try? await Task.sleep(nanoseconds: 2_600_000_000)
            if message == text { message = nil }
        }
    }

    private func icon(for ext: String) -> String {
        if ["mp4", "mov", "m4v", "mkv", "webm"].contains(ext) { return "play.rectangle.fill" }
        if ["mp3", "m4a", "aac", "opus", "ogg", "wav"].contains(ext) { return "music.note" }
        if ["jpg", "jpeg", "png", "webp", "heic", "gif"].contains(ext) { return "photo.fill" }
        return "doc.fill"
    }
}
