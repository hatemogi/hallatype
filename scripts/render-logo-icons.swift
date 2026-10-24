import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = root.appendingPathComponent("src/assets/geulsum-logo.svg")
guard let logo = NSImage(contentsOf: source) else {
    fatalError("SVG 로고를 열 수 없습니다: \(source.path)")
}

func png(_ size: Int) -> Data {
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ), let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
        fatalError("\(size)픽셀 비트맵을 만들 수 없습니다.")
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context.imageInterpolation = .high
    logo.draw(in: NSRect(x: 0, y: 0, width: size, height: size),
              from: .zero, operation: .copy, fraction: 1)
    context.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()

    guard let data = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("\(size)픽셀 PNG를 만들 수 없습니다.")
    }
    return data
}

func appendUInt16(_ value: Int, to data: inout Data) {
    data.append(UInt8(value & 0xff))
    data.append(UInt8((value >> 8) & 0xff))
}

func appendUInt32(_ value: Int, to data: inout Data) {
    for shift in [0, 8, 16, 24] { data.append(UInt8((value >> shift) & 0xff)) }
}

let iconSizes = [16, 32, 180, 192, 512]
let images = Dictionary(uniqueKeysWithValues: iconSizes.map { ($0, png($0)) })
let faviconSizes = [16, 32]
var favicon = Data()
appendUInt16(0, to: &favicon)
appendUInt16(1, to: &favicon)
appendUInt16(faviconSizes.count, to: &favicon)
var offset = 6 + faviconSizes.count * 16
for size in faviconSizes {
    let image = images[size]!
    favicon.append(UInt8(size))
    favicon.append(UInt8(size))
    favicon.append(contentsOf: [0, 0])
    appendUInt16(1, to: &favicon)
    appendUInt16(32, to: &favicon)
    appendUInt32(image.count, to: &favicon)
    appendUInt32(offset, to: &favicon)
    offset += image.count
}
for size in faviconSizes { favicon.append(images[size]!) }

for directory in ["public", "pages/public"] {
    let base = root.appendingPathComponent(directory)
    try favicon.write(to: base.appendingPathComponent("favicon.ico"))
    for size in iconSizes {
        let name: String
        switch size {
        case 16, 32: name = "favicon-\(size)x\(size).png"
        case 180: name = "apple-touch-icon.png"
        default: name = "android-chrome-\(size)x\(size).png"
        }
        try images[size]!.write(to: base.appendingPathComponent("img/icons/\(name)"))
    }
}
