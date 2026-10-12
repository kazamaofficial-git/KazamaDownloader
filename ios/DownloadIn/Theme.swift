import SwiftUI

// Neo-Brutalism — disamakan dengan website & aplikasi Android DownloadIn.
enum Neo {
    static let ink = Color.black
    static let lilac = Color(red: 0xE7 / 255, green: 0xE2 / 255, blue: 0xFF / 255)
    static let yellow = Color(red: 1, green: 0xE1 / 255, blue: 0x4D / 255)
    static let pink = Color(red: 1, green: 0x6F / 255, blue: 0xB1 / 255)
    static let cyan = Color(red: 0x5C / 255, green: 0xE1 / 255, blue: 0xE6 / 255)
    static let lime = Color(red: 0xB6 / 255, green: 0xF3 / 255, blue: 0x5B / 255)
    static let violet = Color(red: 0x7B / 255, green: 0x5C / 255, blue: 1)
    static let muted = Color(red: 0x3B / 255, green: 0x35 / 255, blue: 0x56 / 255)
    static let border: CGFloat = 3
}

/// Kotak dengan garis hitam tebal + bayangan keras (tanpa blur).
struct NeoBox: ViewModifier {
    var fill: Color = .white
    var radius: CGFloat = 14
    var shadow: CGFloat = 5

    func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: radius).fill(Neo.ink).offset(x: shadow, y: shadow)
                    RoundedRectangle(cornerRadius: radius).fill(fill)
                }
            )
            .overlay(RoundedRectangle(cornerRadius: radius).stroke(Neo.ink, lineWidth: Neo.border))
    }
}

extension View {
    func neoBox(fill: Color = .white, radius: CGFloat = 14, shadow: CGFloat = 5) -> some View {
        modifier(NeoBox(fill: fill, radius: radius, shadow: shadow))
    }
}

/// Tombol yang "tertekan": bayangan mengecil saat ditekan.
struct NeoButtonStyle: ButtonStyle {
    var fill: Color = Neo.yellow

    func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed
        return configuration.label
            .font(.system(size: 16, weight: .heavy))
            .foregroundColor(Neo.ink)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .neoBox(fill: fill, radius: 12, shadow: pressed ? 0 : 4)
            .offset(x: pressed ? 4 : 0, y: pressed ? 4 : 0)
            .animation(.easeOut(duration: 0.08), value: pressed)
    }
}
