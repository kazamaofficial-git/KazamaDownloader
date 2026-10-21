import SwiftUI
import AVFoundation

/// Model pemutar musik (AVPlayer).
final class AudioModel: ObservableObject {
    @Published var playing = false
    @Published var position: Double = 0
    @Published var duration: Double = 0
    @Published var failed = false

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?

    func load(_ url: URL) {
        try? AVAudioSession.sharedInstance().setCategory(.playback)
        try? AVAudioSession.sharedInstance().setActive(true)
        let item = AVPlayerItem(url: url)
        let p = AVPlayer(playerItem: item)
        player = p
        timeObserver = p.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.25, preferredTimescale: 600), queue: .main) { [weak self] t in
            guard let self = self else { return }
            self.position = t.seconds.isFinite ? t.seconds : 0
            let d = item.duration.seconds
            self.duration = d.isFinite ? d : 0
            self.playing = p.rate > 0
        }
        endObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { [weak self] _ in
            self?.playing = false
        }
        p.play()
    }

    func toggle() {
        guard let p = player else { return }
        if duration > 0, position >= duration - 0.3 {
            p.seek(to: .zero)
            p.play()
        } else if p.rate > 0 {
            p.pause()
        } else {
            p.play()
        }
        playing = p.rate > 0
    }

    func seek(to seconds: Double) {
        player?.seek(to: CMTime(seconds: max(0, min(seconds, duration > 0 ? duration : seconds)), preferredTimescale: 600))
    }

    func skip(_ delta: Double) { seek(to: position + delta) }

    func stop() {
        player?.pause()
        if let t = timeObserver { player?.removeTimeObserver(t) }
        if let e = endObserver { NotificationCenter.default.removeObserver(e) }
        timeObserver = nil
        endObserver = nil
        player = nil
    }

    deinit { stop() }
}

/// Pemutar musik: sampul, penggeser posisi, putar/jeda, mundur/maju 10 detik. Terpisah dari pemutar video.
struct AudioPlayerView: View {
    let url: URL
    let onClose: () -> Void
    @StateObject private var model = AudioModel()
    @State private var scrubbing = false
    @State private var scrubValue: Double = 0

    private func fmt(_ s: Double) -> String {
        let t = Int(max(0, s))
        return String(format: "%d:%02d", t / 60, t % 60)
    }

    var body: some View {
        ZStack {
            Neo.lilac.ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Text("Pemutar musik").font(.system(size: 18, weight: .heavy)).foregroundColor(Neo.ink)
                    Spacer()
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundColor(Neo.ink)
                            .frame(width: 40, height: 40)
                            .neoBox(fill: Neo.yellow, radius: 10, shadow: 3)
                    }
                    .accessibilityLabel("Tutup")
                }
                .padding(20)

                Spacer()
                Image(systemName: "music.note")
                    .font(.system(size: 90, weight: .heavy))
                    .foregroundColor(Neo.ink)
                    .frame(width: 220, height: 220)
                    .neoBox(fill: Neo.pink, radius: 28, shadow: 8)
                Text(url.deletingPathExtension().lastPathComponent)
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundColor(Neo.ink)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .padding(.horizontal, 28)
                    .padding(.top, 26)

                VStack(spacing: 4) {
                    Slider(
                        value: Binding(
                            get: { scrubbing ? scrubValue : model.position },
                            set: { scrubValue = $0 }
                        ),
                        in: 0...max(model.duration, 1),
                        onEditingChanged: { editing in
                            scrubbing = editing
                            if !editing { model.seek(to: scrubValue) }
                        }
                    )
                    .tint(Neo.ink)
                    HStack {
                        Text(fmt(scrubbing ? scrubValue : model.position))
                        Spacer()
                        Text(fmt(model.duration))
                    }
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Neo.ink)
                }
                .padding(.horizontal, 28)
                .padding(.top, 20)

                HStack(spacing: 22) {
                    roundButton("gobackward.10", size: 56, fill: Neo.cyan) { model.skip(-10) }
                    roundButton(model.playing ? "pause.fill" : "play.fill", size: 78, fill: Neo.yellow) { model.toggle() }
                    roundButton("goforward.10", size: 56, fill: Neo.cyan) { model.skip(10) }
                }
                .padding(.top, 20)

                Spacer()
                ShareLink(item: url) {
                    HStack(spacing: 8) {
                        Image(systemName: "square.and.arrow.up")
                        Text("Bagikan")
                    }
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundColor(Neo.ink)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .neoBox(fill: Neo.cyan, radius: 10, shadow: 3)
                }
                .padding(.bottom, 24)
            }
        }
        .onAppear { model.load(url) }
        .onDisappear { model.stop() }
    }

    private func roundButton(_ symbol: String, size: CGFloat, fill: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: size * 0.4, weight: .heavy))
                .foregroundColor(Neo.ink)
                .frame(width: size, height: size)
                .background(Circle().fill(Neo.ink).offset(x: 4, y: 4))
                .background(Circle().fill(fill))
                .overlay(Circle().stroke(Neo.ink, lineWidth: Neo.border))
        }
        .buttonStyle(.plain)
    }
}
