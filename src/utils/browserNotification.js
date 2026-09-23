/**
 * Browser Web Notifications & Audio chime utility.
 * Allows instant native alerts in the seller/admin browser when new orders,
 * payments, or alerts arrive.
 */

// Synthesize a pleasant chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    
    // First tone (523.25 Hz - C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Second tone higher (783.99 Hz - G5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.8);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Request permission for native browser notifications.
 */
export async function requestBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Display a native browser notification if permitted, and play chime.
 */
export function showBrowserNotification(title, { body = '', link = '', icon = '/favicon.ico' } = {}) {
  // Always play chime if possible
  playNotificationChime();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission === 'granted') {
    try {
      const notif = new window.Notification(title, {
        body,
        icon,
        badge: icon,
        silent: true, // We already played our custom chime
      });

      if (link) {
        notif.onclick = () => {
          window.focus();
          window.location.href = link;
          notif.close();
        };
      }

      return notif;
    } catch {
      return null;
    }
  }

  return null;
}
