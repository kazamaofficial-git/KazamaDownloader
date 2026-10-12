import SwiftUI

/// Tab Unduhan: satu-satunya layar yang bisa dibuka saat offline.
struct DownloadsView: View {
    @ObservedObject var store: DownloadStore
    @State private var shareItem: ShareItem? = nil

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text("Unduhan")
                        .font(.system(size: 34, weight: .heavy))
                        .foregroundColor(Neo.ink)
                    Spacer()
                    if !store.files.isEmpty {
                        Button { store.removeAll() } label: {
                            Image(systemName: "trash.fill")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(Neo.ink)
                                .frame(width: 44, height: 44)
                                .neoBox(fill: Neo.pink, radius: 12, shadow: 3)
                        }
                        .accessibilityLabel("Hapus semua")
                    }
                }

                if store.files.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Belum ada unduhan").font(.system(size: 18, weight: .heavy))
                        Text("File yang kamu unduh tersimpan di sini dan di app Berkas > DownloadIn. Bisa dibuka kapan saja, termasuk saat offline.")
                            .font(.system(size: 14, weight: .medium))
                    }
                    .foregroundColor(Neo.ink)
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .neoBox(fill: .white)
                } else {
                    ForEach(store.files) { f in
                        row(f)
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 20)
        }
        .onAppear { store.refresh() }
        .sheet(item: $shareItem) { item in ShareSheet(url: item.url) }
    }

    private func row(_ f: LocalFile) -> some View {
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
                Text(ByteCountFormatter.string(fromByteCount: f.size, countStyle: .file) + " · " + f.ext.uppercased())
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Neo.muted)
            }
            Spacer(minLength: 4)

            Button { shareItem = ShareItem(url: f.url) } label: {
                Image(systemName: "square.and.arrow.up").font(.system(size: 16, weight: .bold))
            }
            .accessibilityLabel("Buka atau bagikan")
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

    private func icon(for ext: String) -> String {
        if ["mp4", "mov", "m4v", "mkv", "webm"].contains(ext) { return "play.rectangle.fill" }
        if ["mp3", "m4a", "aac", "opus", "ogg", "wav"].contains(ext) { return "music.note" }
        if ["jpg", "jpeg", "png", "webp", "heic", "gif"].contains(ext) { return "photo.fill" }
        return "doc.fill"
    }
}
