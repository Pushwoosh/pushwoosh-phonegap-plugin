// swift-tools-version: 5.9
import PackageDescription

// Swift Package Manager manifest for cordova-ios 8+. Older cordova-ios keeps installing the
// CocoaPods dependencies declared in plugin.xml (the <pod> entries carry nospm="true").
let package = Package(
    name: "pushwoosh-cordova-plugin",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "pushwoosh-cordova-plugin",
            targets: ["pushwoosh-cordova-plugin"])
    ],
    dependencies: [
        // Keep this line as is: cordova-ios rewrites it into a local path reference on install.
        .package(url: "https://github.com/apache/cordova-ios.git", from: "8.0.0"),
        // tools/release.bash rewrites this line's version via a sed anchored on its exact formatting — keep it on one line, spacing unchanged.
        // exact: is deliberate, mirroring plugin.xml's hard pin: relaxing to from: would let CocoaPods and SPM consumers land on different native SDK versions.
        .package(url: "https://github.com/Pushwoosh/Pushwoosh-XCFramework.git", exact: "7.2.8"),
        // Legacy inbox UI used by presentInboxUI. Frozen at 7.0.42, the last published version (see CLAUDE.md).
        .package(url: "https://github.com/Pushwoosh/PushwooshInboxUI-XCFramework.git", exact: "7.0.42")
    ],
    targets: [
        .target(
            name: "pushwoosh-cordova-plugin",
            dependencies: [
                .product(name: "Cordova", package: "cordova-ios"),
                .product(name: "PushwooshFramework", package: "Pushwoosh-XCFramework"),
                .product(name: "PushwooshCore", package: "Pushwoosh-XCFramework"),
                .product(name: "PushwooshBridge", package: "Pushwoosh-XCFramework"),
                .product(name: "PushwooshInboxUI", package: "PushwooshInboxUI-XCFramework"),
                // pushwoosh-voip-anchor: spec/add-voip-pod.js inserts PushwooshVoIP after this line when PW_VOIP_IOS_ENABLED is true.
            ],
            path: "src/ios",
            publicHeadersPath: ".")
    ]
)
