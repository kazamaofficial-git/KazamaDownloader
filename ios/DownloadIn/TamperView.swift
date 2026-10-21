import SwiftUI

/// Tampil bila aplikasi bukan build resmi KazamaTech (identitas aplikasi diubah).
struct TamperView: View {
    var body: some View {
        ZStack {
            Neo.pink.ignoresSafeArea()
            VStack(spacing: 18) {
                Image("KazamaTech").resizable().scaledToFit().frame(width: 150, height: 150)
                Text("Aplikasi tiruan terdeteksi")
                    .font(.system(size: 26, weight: .heavy))
                    .foregroundColor(Neo.ink)
                    .multilineTextAlignment(.center)
                Text("Aplikasi ini bukan build resmi DownloadIn dari KazamaTech: nama, ID bundel, atau identitas pengembangnya sudah diubah. Demi keamananmu aplikasi dihentikan. Unduh versi resmi dari website atau GitHub resmi KazamaTech.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(Neo.ink)
                    .multilineTextAlignment(.center)
                Button("Unduh versi resmi") {
                    if let url = URL(string: AppConfig.defaultBase) { UIApplication.shared.open(url) }
                }
                .buttonStyle(NeoButtonStyle(fill: Neo.yellow))
                .padding(.trailing, 4)
            }
            .padding(28)
        }
    }
}
