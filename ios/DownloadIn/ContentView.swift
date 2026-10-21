import SwiftUI

struct HomeView: View {
    @ObservedObject var vm: HomeViewModel
    @State private var showSettings = false
    @FocusState private var focused: Bool

    var body: some View {
        ZStack(alignment: .bottom) {
            Neo.lilac.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    header
                    inputCard
                    resultView
                    Text("KazamaTech · Developer: KazamaDev")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Neo.muted)
                        .padding(.top, 8)
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 20)
            }

            if let busy = vm.busy {
                banner(busy, fill: Neo.cyan, loading: true)
            } else if let toast = vm.toast {
                banner(toast, fill: Neo.yellow, loading: false)
            }
        }
        .sheet(item: $vm.shareItem) { item in ShareSheet(url: item.url) }
        .sheet(isPresented: $showSettings) { SettingsView() }
    }

    // MARK: - Bagian layar

    private var header: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 6) {
                Text("DownloadIn")
                    .font(.system(size: 38, weight: .heavy))
                    .foregroundColor(Neo.ink)
                Text("Tempel link. Unduh filenya.")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Neo.muted)
            }
            Spacer()
            Button { showSettings = true } label: {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Neo.ink)
                    .frame(width: 44, height: 44)
                    .neoBox(fill: .white, radius: 12, shadow: 3)
            }
            .accessibilityLabel("Pengaturan")
        }
    }

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                TextField("Tempel link video atau postingan", text: $vm.link)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .keyboardType(.URL)
                    .submitLabel(.go)
                    .focused($focused)
                    .onSubmit { focused = false; Task { await vm.fetch() } }
                    .font(.system(size: 16, weight: .semibold))
                if vm.link.isEmpty {
                    Button { vm.pasteAndFetch() } label: {
                        Image(systemName: "doc.on.clipboard").font(.system(size: 18, weight: .bold))
                    }
                    .accessibilityLabel("Tempel")
                } else {
                    Button { vm.clear() } label: {
                        Image(systemName: "xmark.circle.fill").font(.system(size: 20))
                    }
                    .accessibilityLabel("Hapus")
                }
            }
            .foregroundColor(Neo.ink)
            .padding(14)
            .neoBox(fill: .white, radius: 14, shadow: 5)

            Button {
                focused = false
                Task { await vm.fetch() }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "arrow.down.to.line").font(.system(size: 16, weight: .heavy))
                    Text(isLoading ? "Membaca link…" : "Ambil file")
                }
            }
            .buttonStyle(NeoButtonStyle(fill: Neo.yellow))
            .disabled(isLoading)
            .padding(.trailing, 4)
        }
    }

    private var isLoading: Bool {
        if case .loading = vm.phase { return true }
        return false
    }

    @ViewBuilder
    private var resultView: some View {
        switch vm.phase {
        case .idle:
            EmptyView()
        case .loading:
            HStack(spacing: 14) {
                ProgressView().tint(Neo.ink)
                Text("Membaca link, tunggu sebentar…")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(Neo.ink)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .neoBox(fill: Neo.cyan)
        case .failed(let message):
            VStack(alignment: .leading, spacing: 6) {
                Label("Belum bisa diunduh", systemImage: "exclamationmark.triangle.fill")
                    .font(.system(size: 18, weight: .heavy))
                Text(message).font(.system(size: 15, weight: .medium))
            }
            .foregroundColor(Neo.ink)
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .neoBox(fill: Neo.pink)
        case .result(let data):
            VStack(alignment: .leading, spacing: 24) {
                ForEach(data.entries ?? []) { entry in
                    EntryCard(entry: entry, platform: data.platform?.name) { path, filename, ext in
                        Task { await vm.save(path: path, filename: filename, ext: ext, title: entry.title ?? "") }
                    }
                }
                if data.truncated == true {
                    Text("Hanya sebagian item yang ditampilkan.")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Neo.muted)
                }
            }
        }
    }

    private func banner(_ text: String, fill: Color, loading: Bool) -> some View {
        HStack(spacing: 10) {
            if loading { ProgressView().tint(Neo.ink) }
            Text(text).font(.system(size: 14, weight: .heavy)).foregroundColor(Neo.ink)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .neoBox(fill: fill, radius: 12, shadow: 4)
        .padding(.bottom, 18)
        .padding(.horizontal, 18)
        .transition(.move(edge: .bottom))
    }
}

// MARK: - Kartu hasil

struct EntryCard: View {
    let entry: Entry
    let platform: String?
    let onSave: (_ path: String, _ filename: String, _ ext: String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: 14) {
                thumb
                VStack(alignment: .leading, spacing: 8) {
                    Text(entry.title ?? "Tanpa judul")
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundColor(Neo.ink)
                        .lineLimit(3)
                    HStack(spacing: 6) {
                        if let p = platform { tag(p) }
                        if let u = entry.uploader { tag(u) }
                        if let d = entry.duration, d > 0 { tag(Self.duration(d)) }
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(14)

            if let videos = entry.video, !videos.isEmpty {
                section("Video", options: videos, fill: Neo.cyan)
            }
            if let audios = entry.audio, !audios.isEmpty {
                section("Audio", options: audios, fill: Neo.lime)
            }
            if let items = entry.gallery, !items.isEmpty {
                gallery(items)
            }
        }
        .neoBox(fill: .white, radius: 14, shadow: 5)
    }

    private var thumb: some View {
        Group {
            if let t = entry.thumbnail, let url = API.absolute(t) {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Neo.violet
                }
            } else {
                Neo.violet
            }
        }
        .frame(width: 88, height: 88)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Neo.ink, lineWidth: 2))
    }

    private func tag(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundColor(Neo.ink)
            .lineLimit(1)
            .padding(.horizontal, 7)
            .padding(.vertical, 2)
            .background(Neo.yellow)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Neo.ink, lineWidth: 2))
            .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private func section(_ title: String, options: [Option], fill: Color) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Divider().overlay(Neo.ink)
            Text(title).font(.system(size: 16, weight: .heavy)).foregroundColor(Neo.ink)
            ForEach(options) { opt in
                Button {
                    onSave(opt.url, opt.filename, opt.ext)
                } label: {
                    HStack {
                        Text(opt.label).font(.system(size: 15, weight: .heavy))
                        Spacer()
                        Text(Self.subtitle(opt)).font(.system(size: 12, weight: .semibold))
                    }
                }
                .buttonStyle(NeoButtonStyle(fill: fill))
                .padding(.trailing, 4)
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 14)
    }

    private func gallery(_ items: [GalleryItem]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Divider().overlay(Neo.ink)
            Text("Galeri · \(items.count) item").font(.system(size: 16, weight: .heavy)).foregroundColor(Neo.ink)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 130), spacing: 14)], spacing: 14) {
                ForEach(items) { item in
                    VStack(spacing: 0) {
                        if let t = item.thumb, let url = API.absolute(t) {
                            AsyncImage(url: url) { image in
                                image.resizable().scaledToFill()
                            } placeholder: { Neo.violet }
                                .frame(height: 120)
                                .clipped()
                        } else {
                            Neo.violet.frame(height: 120)
                        }
                        HStack(spacing: 0) {
                            if let img = item.image {
                                mini("Foto", Neo.lime) { onSave(img.url, img.filename, img.ext) }
                            }
                            if let vid = item.video {
                                mini(item.type == "live" ? "Video" : "Unduh", Neo.cyan) { onSave(vid.url, vid.filename, vid.ext) }
                            }
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Neo.ink, lineWidth: 3))
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 14)
    }

    private func mini(_ title: String, _ fill: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: .heavy))
                .foregroundColor(Neo.ink)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(fill)
        }
        .overlay(Rectangle().stroke(Neo.ink, lineWidth: 1.5))
    }

    // MARK: Format teks

    static func subtitle(_ o: Option) -> String {
        var parts = [o.ext.uppercased()]
        if let c = o.codec { parts.append(c) }
        if let s = o.size, s > 0 { parts.append(ByteCountFormatter.string(fromByteCount: Int64(s), countStyle: .file)) }
        return parts.joined(separator: " · ")
    }

    static func duration(_ seconds: Double) -> String {
        let s = Int(seconds.rounded())
        let h = s / 3600, m = (s % 3600) / 60, sec = s % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, sec) : String(format: "%d:%02d", m, sec)
    }
}
