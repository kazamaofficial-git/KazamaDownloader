import SwiftUI

/// Layar utama: tab Beranda + Unduhan. Saat offline hanya Unduhan yang bisa dibuka.
struct ContentView: View {
    @StateObject private var vm = HomeViewModel()
    @StateObject private var net = NetworkMonitor()
    @ObservedObject private var store = DownloadStore.shared
    @State private var tab = 0
    @State private var update: UpdateInfo? = nil
    @State private var updateDismissed = false

    private var showHome: Bool { tab == 0 && net.online }

    var body: some View {
        VStack(spacing: 0) {
            if !net.online {
                strip("Mode offline · hanya Unduhan yang bisa dibuka", fill: Neo.pink, icon: "wifi.slash")
            } else if let u = update, !updateDismissed {
                updateStrip(u)
            }

            ZStack {
                Neo.lilac.ignoresSafeArea()
                if showHome {
                    HomeView(vm: vm)
                } else {
                    DownloadsView(store: store)
                }
            }

            tabBar
        }
        .background(Neo.lilac.ignoresSafeArea())
        .task { await checkUpdate() }
        .onChange(of: net.online) { online in
            if online { Task { await checkUpdate() } } else { tab = 1 }
        }
        .onOpenURL { url in // downloadin://?url=https://...
            guard net.online,
                  let link = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                    .queryItems?.first(where: { $0.name == "url" })?.value else { return }
            tab = 0
            vm.link = link
            Task { await vm.fetch() }
        }
    }

    // MARK: - Komponen

    private func strip(_ text: String, fill: Color, icon: String) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Image(systemName: icon).font(.system(size: 14, weight: .heavy))
                Text(text).font(.system(size: 13, weight: .heavy))
                Spacer(minLength: 0)
            }
            .foregroundColor(Neo.ink)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(fill)
            Rectangle().fill(Neo.ink).frame(height: Neo.border)
        }
    }

    private func updateStrip(_ u: UpdateInfo) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Text("Versi \(u.version) tersedia")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundColor(Neo.ink)
                Spacer(minLength: 0)
                Button("Perbarui") { UIApplication.shared.open(u.url) }
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundColor(Neo.ink)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Neo.yellow)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Neo.ink, lineWidth: 2))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                Button { updateDismissed = true } label: {
                    Image(systemName: "xmark").font(.system(size: 13, weight: .heavy)).foregroundColor(Neo.ink)
                }
                .accessibilityLabel("Tutup")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Neo.lime)
            Rectangle().fill(Neo.ink).frame(height: Neo.border)
        }
    }

    private var tabBar: some View {
        VStack(spacing: 0) {
            Rectangle().fill(Neo.ink).frame(height: Neo.border)
            HStack(spacing: 0) {
                tabButton("Beranda", icon: "house.fill", selected: showHome, enabled: net.online) { tab = 0 }
                tabButton("Unduhan" + (store.files.isEmpty ? "" : " (\(store.files.count))"),
                          icon: "arrow.down.circle.fill", selected: !showHome, enabled: true) { tab = 1 }
            }
            .background(Neo.yellow)
        }
    }

    private func tabButton(_ title: String, icon: String, selected: Bool, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Image(systemName: icon).font(.system(size: 18, weight: .bold))
                Text(title).font(.system(size: 11, weight: .heavy))
            }
            .foregroundColor(Neo.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(selected ? Color.white : Color.clear)
            .opacity(enabled ? 1 : 0.35)
        }
        .disabled(!enabled)
    }

    private func checkUpdate() async {
        guard net.online else { return }
        update = await UpdateChecker.latest()
        updateDismissed = false
    }
}
