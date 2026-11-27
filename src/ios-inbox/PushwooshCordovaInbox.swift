import UIKit
import PushwooshCore
import PushwooshFramework
import PushwooshInboxKit

/// The InboxKit screen behind `presentInboxUI` on cordova-ios 8. The Objective-C plugin finds this class
/// with `NSClassFromString`, so the app carries it, and InboxKit with it, only with `PW_INBOX_IOS_ENABLED`.
@objc(PWCordovaInbox)
public final class PushwooshCordovaInbox: NSObject {

    /// Presents the inbox over `presenter`. `style` keeps the `presentInboxUI` keys; `color` and `image` turn
    /// its string values into a color and an image the way the plugin always read them. `onMessageTap` gets
    /// every tap on a message and on a button inside it, with the button as a dictionary. `onClose` is called
    /// once, when the inbox is dismissed by its close button or by a swipe down.
    @objc public static func present(from presenter: UIViewController,
                                     style: [String: Any],
                                     color: @escaping (String) -> UIColor?,
                                     image: @escaping (String) -> UIImage?,
                                     onMessageTap: @escaping (PWInboxMessageProtocol, [String: Any]?) -> Void,
                                     onClose: @escaping () -> Void) {
        let reader = StyleReader(style: style, parseColor: color, loadImage: image)
        let controller = PushwooshInboxKitViewController(attributes: attributes(from: reader))
        let navigation = InboxNavigationController(rootViewController: controller)
        let taps = InboxTaps(handleMessageTap: style["handleMessageTap"] as? Bool ?? false, onMessageTap: onMessageTap)
        navigation.taps = taps
        navigation.onClose = onClose
        controller.delegate = taps

        controller.navigationItem.title = reader.string("barTitle") ?? "Inbox"
        let close = UIBarButtonItem(barButtonSystemItem: .close, target: navigation, action: #selector(InboxNavigationController.close))
        close.tintColor = reader.color("barAccentColor")
        controller.navigationItem.rightBarButtonItem = close
        applyBarStyle(reader, to: navigation.navigationBar)

        presenter.present(navigation, animated: true)
    }

    /// Style keys of the legacy inbox that set fixed colors of the message cards.
    static let legacyContentColorKeys = [
        "backgroundColor", "defaultTextColor", "titleColor", "readTitleColor",
        "descriptionColor", "readDescriptionColor", "dateColor",
    ]

    static func attributes(from style: StyleReader) -> PushwooshInboxKitAttributes {
        var attributes = PushwooshInboxKitAttributes()

        if let format = style.string("dateFormat") {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            attributes.style.dateFormatter = { formatter.string(from: $0) }
        }
        if let text = style.string("listEmptyMessage") {
            attributes.emptyMessage = text
        }
        if let text = style.string("listErrorMessage") {
            attributes.errorMessage = text
        }
        if let image = style.image("defaultImageIcon") {
            attributes.style.imagePlaceholder = image
        }
        if let color = style.color("accentColor") {
            attributes.style.unreadBadgeColor = color
        }
        if let color = style.color("backgroundColor") {
            attributes.style.backgroundColor = color
        }
        // The legacy inbox drew titles and descriptions in defaultTextColor unless their own colour was set.
        let titleColor = style.color("titleColor") ?? style.color("defaultTextColor")
        let descriptionColor = style.color("descriptionColor") ?? style.color("defaultTextColor")
        if let color = titleColor {
            attributes.style.titleColorUnread = color
        }
        if let color = style.color("readTitleColor") ?? titleColor {
            attributes.style.titleColorRead = color
        }
        if let color = descriptionColor {
            attributes.style.bodyColorUnread = color
        }
        if let color = style.color("readDescriptionColor") ?? descriptionColor {
            attributes.style.bodyColorRead = color
        }
        if let color = style.color("dateColor") {
            attributes.style.dateColor = color
        }

        if let enabled = style.bool("swipeToDeleteEnabled") {
            attributes.swipeToDeleteEnabled = enabled
        }
        if let enabled = style.bool("automaticReadOnDisplay") {
            attributes.automaticReadOnDisplay = enabled
        }
        if let enabled = style.bool("automaticReadOnDisappear") {
            attributes.automaticReadOnDisappear = enabled
        }
        if let enabled = style.bool("enableDarkTheme") {
            attributes.enableDarkTheme = enabled
        } else if legacyContentColorKeys.contains(where: { style.color($0) != nil }) {
            // Legacy colors were picked for the always-light InboxUI: dark cards would hide them.
            attributes.enableDarkTheme = false
        }
        if let enabled = style.bool("pinningEnabled") {
            attributes.pinningEnabled = enabled
        }
        if let visible = style.bool("pinIndicatorVisible") {
            attributes.pinIndicatorVisible = visible
        }
        if let color = style.color("pinIndicatorColor") {
            attributes.style.pinIndicatorColor = color
        }
        if let image = style.image("pinIndicatorImage") {
            attributes.style.pinIndicatorImage = image
        }
        if let enabled = style.bool("inlineButtonsEnabled") {
            attributes.inlineButtonsEnabled = enabled
        }
        if let color = style.color("buttonTextColor") {
            attributes.style.buttonTextColor = color
        }
        if let color = style.color("buttonBackgroundColor") {
            attributes.style.buttonBackgroundColor = color
        }
        if let size = style.number("buttonFontSize") {
            attributes.style.buttonFont = attributes.style.buttonFont.withSize(CGFloat(size))
        }
        if let radius = style.number("buttonCornerRadius") {
            attributes.style.buttonCornerRadius = CGFloat(radius)
        }
        return attributes
    }

    static func buttonDictionary(_ button: PushwooshInboxButton) -> [String: Any] {
        var dictionary: [String: Any] = ["title": button.title]
        switch button.action {
        case .openURL(let url):
            dictionary["action"] = "openURL"
            dictionary["url"] = url.absoluteString
        case .dismiss:
            dictionary["action"] = "dismiss"
        case .markRead:
            dictionary["action"] = "markRead"
        case .custom(let payload):
            dictionary["action"] = "custom"
            dictionary["payload"] = payload
        @unknown default:
            break
        }
        return dictionary
    }

    private static func applyBarStyle(_ style: StyleReader, to bar: UINavigationBar) {
        if let color = style.color("barAccentColor") {
            bar.tintColor = color
        }
        let background = style.color("barBackgroundColor")
        let text = style.color("barTextColor")
        guard background != nil || text != nil else { return }

        let standard = UINavigationBarAppearance()
        let scrollEdge = UINavigationBarAppearance()
        if let background = background {
            standard.configureWithOpaqueBackground()
            standard.backgroundColor = background
            scrollEdge.configureWithOpaqueBackground()
            scrollEdge.backgroundColor = background
        } else {
            standard.configureWithDefaultBackground()
            scrollEdge.configureWithTransparentBackground()
        }
        if let text = text {
            standard.titleTextAttributes = [.foregroundColor: text]
            scrollEdge.titleTextAttributes = [.foregroundColor: text]
        }
        bar.standardAppearance = standard
        bar.compactAppearance = standard
        bar.scrollEdgeAppearance = scrollEdge
    }
}

/// Reads `presentInboxUI` style values; a value of the wrong type counts as unset.
struct StyleReader {
    let style: [String: Any]
    let parseColor: (String) -> UIColor?
    let loadImage: (String) -> UIImage?

    func string(_ key: String) -> String? {
        style[key] as? String
    }

    // A JS boolean arrives as an NSNumber made from kCFBoolean, and a number must not pass for one.
    func bool(_ key: String) -> Bool? {
        guard let value = style[key] as? NSNumber, CFGetTypeID(value) == CFBooleanGetTypeID() else { return nil }
        return value.boolValue
    }

    func number(_ key: String) -> Double? {
        guard let value = style[key] as? NSNumber, CFGetTypeID(value) != CFBooleanGetTypeID() else { return nil }
        return value.doubleValue
    }

    func color(_ key: String) -> UIColor? {
        string(key).flatMap(parseColor)
    }

    func image(_ key: String) -> UIImage? {
        string(key).flatMap(loadImage)
    }
}

final class InboxNavigationController: UINavigationController {
    // The inbox holds its delegate weakly: the navigation controller keeps it for the life of the screen.
    var taps: InboxTaps?
    var onClose: (() -> Void)?

    @objc func close() {
        dismiss(animated: true)
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        // A screen the inbox shows over itself (rich media) hides it without dismissing it.
        guard isBeingDismissed else { return }
        onClose?()
        onClose = nil
    }
}

/// Reports every tap to the app. The inbox asks synchronously whether to run its own action, so the answer
/// comes from `handleMessageTap` and not from the app.
final class InboxTaps: PushwooshInboxKitDelegate {
    private let handleMessageTap: Bool
    private let onMessageTap: (PWInboxMessageProtocol, [String: Any]?) -> Void

    init(handleMessageTap: Bool, onMessageTap: @escaping (PWInboxMessageProtocol, [String: Any]?) -> Void) {
        self.handleMessageTap = handleMessageTap
        self.onMessageTap = onMessageTap
    }

    func inboxKit(_ vc: PushwooshInboxKitViewController, didSelect message: PWInboxMessageProtocol) -> Bool {
        onMessageTap(message, nil)
        return !handleMessageTap
    }

    func inboxKit(_ vc: PushwooshInboxKitViewController,
                  didTapButton button: PushwooshInboxButton,
                  onMessage message: PWInboxMessageProtocol) -> Bool {
        onMessageTap(message, PushwooshCordovaInbox.buttonDictionary(button))
        return !handleMessageTap
    }
}
