// macOS build-time lettering utility. See public/fonts/gallery-signature-SOURCE.md.
import Foundation
import CoreText
import CoreGraphics
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as! [CTFontDescriptor]
let weighted = CTFontDescriptorCreateCopyWithAttributes(descriptors[0], [kCTFontVariationAttribute: [NSNumber(value: 2003265652): NSNumber(value: 600)]] as CFDictionary)
let font = CTFontCreateWithFontDescriptor(weighted, 100, nil)
let line = CTLineCreateWithAttributedString(NSAttributedString(string: ".gallery", attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font]))
let combined = CGMutablePath()
for run in CTLineGetGlyphRuns(line) as! [CTRun] {
  let count = CTRunGetGlyphCount(run)
  var glyphs = [CGGlyph](repeating: 0, count: count)
  var positions = [CGPoint](repeating: .zero, count: count)
  CTRunGetGlyphs(run, CFRangeMake(0, 0), &glyphs)
  CTRunGetPositions(run, CFRangeMake(0, 0), &positions)
  for i in 0..<count {
    if let path = CTFontCreatePathForGlyph(font, glyphs[i], nil) {
      combined.addPath(path, transform: CGAffineTransform(translationX: positions[i].x, y: positions[i].y))
    }
  }
}
let bounds = combined.boundingBoxOfPath.insetBy(dx: -1, dy: -1)
func number(_ value: CGFloat) -> String { String(format: "%.2f", value) }
func point(_ p: CGPoint) -> String { "\(number(p.x - bounds.minX)),\(number(bounds.maxY - p.y))" }
var d = ""
combined.applyWithBlock { element in
  let e = element.pointee
  switch e.type {
  case .moveToPoint: d += "M" + point(e.points[0])
  case .addLineToPoint: d += "L" + point(e.points[0])
  case .addQuadCurveToPoint: d += "Q" + point(e.points[0]) + " " + point(e.points[1])
  case .addCurveToPoint: d += "C" + point(e.points[0]) + " " + point(e.points[1]) + " " + point(e.points[2])
  case .closeSubpath: d += "Z"
  @unknown default: break
  }
}
print("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 \(number(bounds.width)) \(number(bounds.height))\"><title>.gallery</title><path fill=\"#f3f1ed\" d=\"\(d)\"/></svg>")
