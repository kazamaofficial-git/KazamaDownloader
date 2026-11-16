import SwiftUI

/// Layar utama: tab Beranda + Unduhan. Mode Offline: semua layar tetap bisa dibuka, hanya mengunduh yang dinonaktifkan.
/// Pembaruan wajib: bila ada versi lebih baru, aplikasi dikunci di layar pembaruan.
struct ContentView: View {
    @StateObject private var vm = HomeViewModel()
    @StateObject private var net = NetworkMonitor()
    @ObservedObject private var store = DownloadStore.shared
    @ObservedObject private var failed = FailedStore.shared
    @State private var tab = 0
    @State private var update: UpdateInfo? = nil

    private var showHome: Bool { tab == 0 }

    var body: some View {
        if let required = update {
            KazamaForceUpdateView(info: required)
        } else {
            mainContent
        }
    }

    private var mainContent: some View {
        VStack(spacing: 0) {
            if !net.online {
                strip("Mode offline · tidak bisa mengunduh", fill: Neo.pink, icon: "wifi.slash")
            }

            ZStack {
                Neo.lilac.ignoresSafeArea()
                if showHome {
                    HomeView(vm: vm)
                } else {
                    DownloadsView(store: store, failed: failed, vm: vm, online: net.online)
                }
            }

            tabBar
        }
        .background(Neo.lilac.ignoresSafeArea())
        .task {
            vm.kazamaIsOnline = net.online
            await checkUpdate()
        }
        .onChange(of: net.online) { online in
            vm.kazamaIsOnline = online
            if online { Task { await checkUpdate() } }
        }
        .onOpenURL { url in // downloadin://?url=https://...
            guard let link = URLComponents(url: url, resolvingAgainstBaseURL: false)?
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

    private var tabBar: some View {
        VStack(spacing: 0) {
            Rectangle().fill(Neo.ink).frame(height: Neo.border)
            HStack(spacing: 0) {
                tabButton("Beranda", icon: "house.fill", selected: showHome, enabled: true) { tab = 0 }
                tabButton("Unduhan" + (store.files.count + failed.jobs.count == 0 ? "" : " (\(store.files.count + failed.jobs.count))"),
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
    }
}
