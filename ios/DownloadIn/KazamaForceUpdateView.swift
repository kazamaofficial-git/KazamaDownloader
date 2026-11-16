import SwiftUI

/// Pembaruan wajib: tidak bisa ditutup. Aplikasi iOS dipasang lewat sideload, jadi tombolnya membuka unduhan versi terbaru.
struct KazamaForceUpdateView: View {
    let info: UpdateInfo

    var body: some View {
        ZStack {
            Neo.lilac.ignoresSafeArea()
            VStack(spacing: 18) {
                Image(systemName: "arrow.down.app.fill")
                    .font(.system(size: 70, weight: .heavy))
                    .foregroundColor(Neo.ink)
                    .frame(width: 150, height: 150)
                    .neoBox(fill: Neo.yellow, radius: 28, shadow: 8)
                Text("Pembaruan wajib")
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundColor(Neo.ink)
                Text("Versi \(info.version) sudah tersedia (terpasang: \(UpdateChecker.currentVersion)). Perbarui dulu untuk melanjutkan memakai DownloadIn.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(Neo.muted)
                    .multilineTextAlignment(.center)
                Button("Unduh versi terbaru") { UIApplication.shared.open(info.url) }
                    .buttonStyle(NeoButtonStyle(fill: Neo.yellow))
                    .padding(.trailing, 4)
                Text("Setelah terunduh, pasang lewat AltStore, Sideloadly, atau TrollStore seperti biasa.")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Neo.muted)
                    .multilineTextAlignment(.center)
            }
            .padding(28)
        }
    }
}
