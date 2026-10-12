import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var server = AppConfig.base

    var body: some View {
        ZStack {
            Neo.lilac.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack {
                        Text("Pengaturan").font(.system(size: 28, weight: .heavy)).foregroundColor(Neo.ink)
                        Spacer()
                        Button { dismiss() } label: {
                            Image(systemName: "xmark").font(.system(size: 16, weight: .heavy)).foregroundColor(Neo.ink)
                                .frame(width: 40, height: 40).neoBox(fill: .white, radius: 10, shadow: 3)
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Alamat server").font(.system(size: 16, weight: .heavy))
                        Text("Aplikasi iOS memproses link lewat server DownloadIn. Ubah hanya jika kamu menjalankan server sendiri.")
                            .font(.system(size: 13, weight: .medium)).foregroundColor(Neo.muted)
                        TextField(AppConfig.defaultBase, text: $server)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                            .keyboardType(.URL)
                            .font(.system(size: 15, weight: .semibold))
                            .padding(12)
                            .neoBox(fill: .white, radius: 12, shadow: 4)
                        Button("Simpan") {
                            AppConfig.base = server
                            dismiss()
                        }
                        .buttonStyle(NeoButtonStyle(fill: Neo.yellow))
                        .padding(.trailing, 4)
                        Button("Kembalikan bawaan") {
                            server = AppConfig.defaultBase
                            AppConfig.base = AppConfig.defaultBase
                        }
                        .buttonStyle(NeoButtonStyle(fill: .white))
                        .padding(.trailing, 4)
                    }
                    .foregroundColor(Neo.ink)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .neoBox(fill: .white)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Tentang").font(.system(size: 16, weight: .heavy))
                        Text("DownloadIn (KazamaDownloader) \(Self.version)\nDibuat oleh KazamaTech · Developer: KazamaDev")
                            .font(.system(size: 13, weight: .medium))
                        Text("Berdasar XyDownloader © 2026 XyVerse (GPL-3.0-or-later). Kode sumber dan lisensi lengkap ada di GitHub.")
                            .font(.system(size: 12, weight: .medium)).foregroundColor(Neo.muted)
                        Text("Gunakan hanya untuk konten milik sendiri atau yang kamu punya izin mengunduhnya.")
                            .font(.system(size: 12, weight: .medium)).foregroundColor(Neo.muted)
                    }
                    .foregroundColor(Neo.ink)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .neoBox(fill: Neo.pink)
                }
                .padding(18)
            }
        }
    }

    static var version: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.1.0"
    }
}
