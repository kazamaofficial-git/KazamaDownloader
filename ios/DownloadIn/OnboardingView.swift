import SwiftUI

/// Layar sambutan saat aplikasi pertama kali dipasang.
struct OnboardingView: View {
    let onFinish: () -> Void
    @State private var page = 0

    private struct Page {
        let title: String
        let body: String
        let symbol: String?   // nil = logo khusus (halaman pertama & terakhir)
        let fill: Color
    }

    private let pages: [Page] = [
        Page(title: "DownloadIn", body: "Satu link, semua platform. Unduh video, MP3, dan foto dari 1.700+ situs. Gratis, tanpa iklan.", symbol: nil, fill: Neo.yellow),
        Page(title: "Tempel atau bagikan", body: "Tempel link dari TikTok, Instagram, YouTube, dan lainnya, lalu pilih kualitas yang kamu mau.", symbol: "globe", fill: Neo.cyan),
        Page(title: "Pilih kualitasnya", body: "Video per resolusi tanpa watermark, MP3, audio asli, foto slide, dan Live Photo. Putar langsung di dalam aplikasi.", symbol: "play.rectangle.fill", fill: Neo.lime),
        Page(title: "Jalan di latar belakang", body: "Unduhan tetap berjalan saat aplikasi ditutup. Kamu diberi tahu saat selesai atau ada versi baru.", symbol: "bolt.fill", fill: Neo.pink),
        Page(title: "Offline pun aman", body: "Tanpa internet, Unduhan tetap bisa dibuka. Punya file lama? Pulihkan dari app Berkas.", symbol: "tray.fill", fill: Neo.cyan),
        Page(title: "Dibuat oleh KazamaTech", body: "Gratis, tanpa pelacakan, dan terbuka. Siap mengunduh?", symbol: nil, fill: Neo.yellow),
    ]

    private var isLast: Bool { page == pages.count - 1 }

    var body: some View {
        ZStack {
            Neo.lilac.ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Spacer()
                    if !isLast {
                        Button("Lewati") { onFinish() }
                            .font(.system(size: 15, weight: .heavy))
                            .foregroundColor(Neo.ink)
                            .padding(16)
                    } else {
                        Color.clear.frame(height: 52)
                    }
                }

                TabView(selection: $page) {
                    ForEach(0..<pages.count, id: \.self) { i in
                        pageView(i).tag(i)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                HStack(spacing: 8) {
                    ForEach(0..<pages.count, id: \.self) { i in
                        Capsule()
                            .fill(i == page ? Neo.ink : Neo.ink.opacity(0.25))
                            .frame(width: i == page ? 26 : 10, height: 10)
                    }
                }
                .padding(.vertical, 18)

                Button(isLast ? "Mulai" : "Lanjut") {
                    if isLast { onFinish() } else { withAnimation { page += 1 } }
                }
                .buttonStyle(NeoButtonStyle(fill: Neo.yellow))
                .padding(.horizontal, 24)
                .padding(.trailing, 4)
                .padding(.bottom, 24)
            }
        }
    }

    @ViewBuilder
    private func pageView(_ i: Int) -> some View {
        let p = pages[i]
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            Group {
                if i == 0 {
                    Image(systemName: "arrow.down.to.line")
                        .font(.system(size: 84, weight: .heavy))
                        .foregroundColor(Neo.ink)
                        .frame(width: 190, height: 190)
                        .neoBox(fill: Neo.yellow, radius: 28, shadow: 8)
                } else if p.symbol == nil {
                    Image("KazamaTech").resizable().scaledToFit().frame(width: 230, height: 230)
                } else {
                    Image(systemName: p.symbol ?? "star")
                        .font(.system(size: 80, weight: .heavy))
                        .foregroundColor(Neo.ink)
                        .frame(width: 190, height: 190)
                        .neoBox(fill: p.fill, radius: 28, shadow: 8)
                }
            }
            Spacer(minLength: 0)
            Text(p.title)
                .font(.system(size: 28, weight: .heavy))
                .foregroundColor(Neo.ink)
                .multilineTextAlignment(.center)
            Text(p.body)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(Neo.muted)
                .multilineTextAlignment(.center)
                .padding(.top, 10)
                .padding(.horizontal, 28)
            Spacer(minLength: 16)
        }
        .padding(.horizontal, 12)
    }
}
