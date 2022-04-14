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
	registerDevice(success?: (callback: SuccessRegistrationCallback) => void, fail?: (error: any) => void): void;
	unregisterDevice(success?: (callback: any) => void, fail?: (callback: any) => void): void;
	additionalAuthorizationOptions(options: Object): void;
	setTags(config: Object, success?: Function, fail?: Function): void;
	getTags(success?: (tags: Object) => void, fail?: (error: any) => void): void;
	getPushToken(success?: (pushToken: string) => void): void;
	getPushwooshHWID(success?: (hwid: string) => void): void;
	getRemoteNotificationStatus(success?: (status: Object) => void, fail?: (error: any) => void): void;
	setApplicationIconBadgeNumber(badge: number): void;
	getApplicationIconBadgeNumber(success?: (badge: number) => void, fail?: (error: any) => void): void;
	addToApplicationIconBadgeNumber(badge: number|string): void;
	getLaunchNotification(success?: (notification: Object) => void, fail?: (error: any) => void): void;
	clearLaunchNotification(success?: () => void, fail?: (error: any) => void): void;
	setUserId(userId: string): void;
	postEvent(event: string, attributes?: Object): void;
	addJavaScriptInterface(bridgeName: string): void;
	createLocalNotification(notification: LocalNotification, success?: (callback: any) => void, fail?: (callback: any) => void): void;
	clearLocalNotification(): void;
	clearNotificationCenter(): void;
	setMultiNotificationMode(success?: (callback: any) => void, fail?: (callback: any) => void): void;
	setSingleNotificationMode(success?: (callback: any) => void, fail?: (callback: any) => void): void;
	cancelAllLocalNotifications(success?: (callback: any) => void): void;
	pushReceivedCallback(notification: Object): void;
	notificationCallback(notification: Object): void;
	presentInboxUI(params?: Object): void;
	showGDPRConsentUI(): void;
	showGDPRDeletionUI(): void;
	setCommunicationEnabled(enable: boolean, success?: (callback: any) => void, fail?: (callback: any) => void): void;
	removeAllDeviceData(success?: (callback: any) => void, fail?: (callback: any) => void): void;
	isCommunicationEnabled(success: (enabled: boolean) => void): void;
	isDeviceDataRemoved(success: (removed: boolean) => void): void;
	isAvailableGDPR(success: (isAvailable: boolean) => void): void;
	enableHuaweiPushNotifications(): void;
	setSoundType(type: string, success?: (callback: any) => void, fail?: (callback: any) => void): void;
	setVibrateType(type: string, success?: (callback: any) => void, fail?: (callback: any) => void): void;
	setLightScreenOnNotification(on: boolean, success?: (callback: any) => void, fail?: (callback: any) => void): void;
	setEnableLED(on: boolean, success?: (callback: any) => void, fail?: (callback: any) => void): void;
	setColorLED(color: string, success?: (callback: any) => void, fail?: (callback: any) => void): void;
	getPushHistory(success?: (pushHistory: Object) => void): void;
	clearPushHistory(callback: (result: any) => void): void;
}