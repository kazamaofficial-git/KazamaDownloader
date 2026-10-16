import SwiftUI
import AVKit

struct ViewerItem: Identifiable {
    let id = UUID()
    let url: URL
}

/// Pemutar bawaan: video, audio, dan foto diputar di dalam aplikasi (tanpa membuka aplikasi lain).
struct MediaViewer: View {
    let url: URL
    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer? = nil

    static let playable: Set<String> = ["mp4", "m4v", "mov", "mp3", "m4a", "aac", "wav", "caf"]
    static let images: Set<String> = ["jpg", "jpeg", "png", "heic", "gif", "webp"]

    static func canView(_ url: URL) -> Bool {
        let e = url.pathExtension.lowercased()
        return playable.contains(e) || images.contains(e)
    }

    private var ext: String { url.pathExtension.lowercased() }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()

            Group {
                if Self.images.contains(ext), let image = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: image).resizable().scaledToFit()
                } else {
                    VideoPlayer(player: player)
                        .onAppear {
                            let p = AVPlayer(url: url)
                            player = p
                            p.play()
                        }
                        .onDisappear { player?.pause() }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            HStack(spacing: 12) {
                ShareLink(item: url) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundColor(Neo.ink)
                        .frame(width: 40, height: 40)
                        .neoBox(fill: Neo.cyan, radius: 10, shadow: 3)
                }
                .accessibilityLabel("Bagikan")
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundColor(Neo.ink)
                        .frame(width: 40, height: 40)
                        .neoBox(fill: Neo.yellow, radius: 10, shadow: 3)
                }
                .accessibilityLabel("Tutup")
            }
            .padding(16)
        }
    }
}
