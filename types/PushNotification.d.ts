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

type InboxNotification = {
	code: string;
	title?: string;
	message?: string;
	imageUrl?: string;
	sendDate?: string;
	type?: number;
	bannerUrl?: string;
	customData?: Object;
	isRead?: boolean;
	actionParams?: Object;
	isActionPerformed?: boolean;
}

type AuthOptions = Record<string, number|string>

type RemoteNotificationStatus = Record<string,string|number|boolean>

interface PushwooshTags {
	[index: string]: string | number | string[] | number[]
}

export interface PushNotification {
	onDeviceReady(config: PushwooshConfig): void;
	onAppActivated(config: Object): void;
	registerDevice(success?: (callback: SuccessRegistrationCallback) => void, fail?: (error: Error|string) => void): void;
	unregisterDevice(success?: (callback?: string) => void, fail?: (error?: Error|string) => void): void;
	additionalAuthorizationOptions(options: AuthOptions): void;
	setTags(config: PushwooshTags, success?: (tags?: Record<string,PushwooshTags>) => void, fail?: (error?: Error|string) => void): void;
	getTags(success?: (tags: PushwooshTags) => void, fail?: (error?: Error|string) => void): void;
	getPushToken(success?: (pushToken: string) => void): void;
	getPushwooshHWID(success?: (hwid: string) => void): void;
	getRemoteNotificationStatus(success?: (status: RemoteNotificationStatus) => void, fail?: (error: Error|string) => void): void;
	setApplicationIconBadgeNumber(badge: number): void;
	getApplicationIconBadgeNumber(success?: (badge: number) => void): void;
	addToApplicationIconBadgeNumber(badge: number|string): void;
	getLaunchNotification(success?: (notification: string) => void): void;
	clearLaunchNotification(success?: () => void): void;
	setUserId(userId: string): void;
	setLanguage(language: string): void;
	postEvent(event: string, attributes?: Record<string, string>): void;
	addJavaScriptInterface(bridgeName: string): void;
	createLocalNotification(notification: LocalNotification, success?: () => void, fail?: () => void): void;
	clearLocalNotification(): void;
	clearNotificationCenter(): void;
	setMultiNotificationMode(success?: () => void, fail?: () => void): void;
	setSingleNotificationMode(success?: () => void, fail?: () => void): void;
	cancelAllLocalNotifications(success?: () => void): void;
	pushReceivedCallback(notification: string): void;
	notificationCallback(notification: string): void;
	presentInboxUI(params?: Record<string,any>): void;
	loadMessages(success?: (messages: InboxNotification[]) =>void, fail?: (error?: Error|string) => void): void;
	messagesWithNoActionPerformedCount(callback: (result: number) => void): void;
    unreadMessagesCount(callback: (result: number) => void): void;
    messagesCount(callback: (result: number) => void): void;
    readMessage(id: string): void;
    deleteMessage(id: string): void;
    performAction(id: string): void;
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