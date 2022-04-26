interface PushwooshConfig {
	projectid: string,
	appid: string,
	serviceName?: string
}

type SuccessRegistrationCallback = {
	pushToken: string;
}

type LocalNotification = {
	msg: string;
	seconds: number;
	userData?: Object;
}

export interface PushNotification {
	onDeviceReady(config: PushwooshConfig): void;
	onAppActivated(config: Object): void;
	registerDevice(success?: (callback: SuccessRegistrationCallback) => void, fail?: (error: Error|string) => void): void;
	unregisterDevice(success?: (callback?: Object) => void, fail?: (error?: Error|string) => void): void;
	additionalAuthorizationOptions(options: Object): void;
	setTags(config: Object, success?: (tags?: Object) => void, fail?: (error?: Error|string) => void): void;
	getTags(success?: (tags: Object) => void, fail?: (error?: Error|string) => void): void;
	getPushToken(success?: (pushToken: string) => void): void;
	getPushwooshHWID(success?: (hwid: string) => void): void;
	getRemoteNotificationStatus(success?: (status: Object) => void, fail?: (error: Error|string) => void): void;
	setApplicationIconBadgeNumber(badge: number): void;
	getApplicationIconBadgeNumber(success?: (badge: number) => void): void;
	addToApplicationIconBadgeNumber(badge: number|string): void;
	getLaunchNotification(success?: (notification: string) => void): void;
	clearLaunchNotification(success?: () => void): void;
	setUserId(userId: string): void;
	postEvent(event: string, attributes?: Object): void;
	addJavaScriptInterface(bridgeName: string): void;
	createLocalNotification(notification: LocalNotification, success?: () => void, fail?: () => void): void;
	clearLocalNotification(): void;
	clearNotificationCenter(): void;
	setMultiNotificationMode(success?: () => void, fail?: () => void): void;
	setSingleNotificationMode(success?: () => void, fail?: () => void): void;
	cancelAllLocalNotifications(success?: () => void): void;
	pushReceivedCallback(notification: string): void;
	notificationCallback(notification: string): void;
	presentInboxUI(params?: Object): void;
	showGDPRConsentUI(): void;
	showGDPRDeletionUI(): void;
	setCommunicationEnabled(enable: boolean, success?: () => void, fail?: (callback: Error|string) => void): void;
	removeAllDeviceData(success?: () => void, fail?: (callback: Error|string) => void): void;
	isCommunicationEnabled(success: (enabled: boolean) => void): void;
	isDeviceDataRemoved(success: (removed: boolean) => void): void;
	isAvailableGDPR(success: (isAvailable: boolean) => void): void;
	enableHuaweiPushNotifications(): void;
	setSoundType(type: string, success?: () => void, fail?: () => void): void;
	setVibrateType(type: string, success?: () => void, fail?: () => void): void;
	setLightScreenOnNotification(on: boolean, success?: () => void, fail?: () => void): void;
	setEnableLED(on: boolean, success?: () => void, fail?: () => void): void;
	setColorLED(color: string, success?: () => void, fail?: () => void): void;
	getPushHistory(success?: (pushHistory: Object) => void): void;
	clearPushHistory(callback: () => void): void;
}