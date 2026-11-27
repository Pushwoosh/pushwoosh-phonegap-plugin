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
            targets: ["pushwoosh-cordova-plugin"]),
        // The InboxKit screen of presentInboxUI, built only when something depends on it: the plugin target, where the
        // install hook adds it with PW_INBOX_IOS_ENABLED, or an app that installs the plugin with --link and adds this product.
        .library(
            name: "PushwooshCordovaInbox",
            targets: ["PushwooshCordovaInbox"])
    ],
    dependencies: [
        // Keep this line as is: cordova-ios rewrites it into a local path reference on install.
        .package(url: "https://github.com/apache/cordova-ios.git", from: "8.0.0"),
        // tools/release.bash rewrites this line's version via a sed anchored on its exact formatting — keep it on one line, spacing unchanged.
        // exact: is deliberate, mirroring plugin.xml's hard pin: relaxing to from: would let CocoaPods and SPM consumers land on different native SDK versions.
        .package(url: "https://github.com/Pushwoosh/Pushwoosh-XCFramework.git", exact: "7.3.2"),
    ],
    targets: [
        .target(
            name: "pushwoosh-cordova-plugin",
            dependencies: [
                .product(name: "Cordova", package: "cordova-ios"),
                .product(name: "PushwooshFramework", package: "Pushwoosh-XCFramework"),
                .product(name: "PushwooshCore", package: "Pushwoosh-XCFramework"),
                .product(name: "PushwooshBridge", package: "Pushwoosh-XCFramework"),
                // pushwoosh-voip-anchor: spec/add-voip-pod.js inserts PushwooshVoIP after this line when PW_VOIP_IOS_ENABLED is true.
                // pushwoosh-inapp-anchor: spec/add-voip-pod.js inserts PushwooshInApp after this line when PW_INAPP_IOS_ENABLED is true.
                // pushwoosh-inbox-anchor: spec/add-voip-pod.js inserts the PushwooshCordovaInbox target after this line when PW_INBOX_IOS_ENABLED is true.
            ],
            path: "src/ios",
            publicHeadersPath: "."),
        .target(
            name: "PushwooshCordovaInbox",
            dependencies: [
                .product(name: "PushwooshFramework", package: "Pushwoosh-XCFramework"),
                .product(name: "PushwooshCore", package: "Pushwoosh-XCFramework"),
                .product(name: "PushwooshInboxKit", package: "Pushwoosh-XCFramework")
            ],
            path: "src/ios-inbox")
    ]
)
