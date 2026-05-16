interface OneSignalWindow extends Window {
  OneSignalDeferred?: any[];
  OneSignal?: any;
}

declare const window: OneSignalWindow;

const ONESIGNAL_APP_ID = "e187962a-f10d-4758-a048-498513d8bbde";

export const initOneSignal = () => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false,
      },
    });
  });
};

export const loginToOneSignal = async (workerName: string) => {
  const OneSignal = window.OneSignal;
  if (!OneSignal) return;
  try {
    await OneSignal.login(workerName);
  } catch (e) {
    console.warn("OneSignal login error:", e);
  }
};

export const requestNotificationPermission = async () => {
  const OneSignal = window.OneSignal;
  if (!OneSignal) return;
  try {
    await OneSignal.Notifications.requestPermission();
  } catch (e) {
    console.warn("OneSignal permission error:", e);
  }
};
