
import Expo
import React
import ReactAppDependencyProvider
import UIKit

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  var initialLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    initialLaunchOptions = launchOptions

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)

    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    bindReactNativeFactory(factory)

    #if DEBUG
    // Expo Dev Launcher expects React Native to be prepared
    // before ExpoAppDelegate runs its launch subscribers.
    //
    // The temporary window will be connected to the actual
    // UIWindowScene later by SceneDelegate.

    let debugWindow = UIWindow(frame: UIScreen.main.bounds)
    window = debugWindow

    factory.startReactNative(
      withModuleName: "main",
      in: debugWindow,
      launchOptions: launchOptions
    )
    #endif

    return super.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )
  }

  // MARK: - Linking API

  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(
      app,
      open: url,
      options: options
    ) || RCTLinkingManager.application(
      app,
      open: url,
      options: options
    )
  }

  // MARK: - Universal Links

  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )

    return super.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    ) || result
  }
}

// MARK: - Scene lifecycle for iOS 27+

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      return
    }

    #if DEBUG
    // React Native was already started in AppDelegate.
    // Connect the existing window to the scene.
    // Do not start React Native again.

    if let existingWindow = appDelegate.window {
      existingWindow.windowScene = windowScene

      self.window = existingWindow

      existingWindow.makeKeyAndVisible()
      return
    }
    #endif

    // Release: create the window when the scene connects.
    // This preserves the existing iOS 27 launch lifecycle.

    let sceneWindow = UIWindow(windowScene: windowScene)

    self.window = sceneWindow
    appDelegate.window = sceneWindow

    factory.startReactNative(
      withModuleName: "main",
      in: sceneWindow,
      launchOptions: appDelegate.initialLaunchOptions
    )
  }
}

// MARK: - React Native Delegate

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {

  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings()
      .jsBundleURL(
        forBundleRoot: ".expo/.virtual-metro-entry"
      )
    #else
    return Bundle.main.url(
      forResource: "main",
      withExtension: "jsbundle"
    )
    #endif
  }
}
