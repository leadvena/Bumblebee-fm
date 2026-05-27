import { useState, useEffect } from 'react';

export default function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Intercept standard PWA beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstalled(false);
      console.log("Bumblebee: PWA Install Prompt registered ready.");
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log("Bumblebee: PWA successfully installed to Home Screen!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already running in standalone/installed mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) {
      console.warn("PWA installation prompt not ready yet.");
      return;
    }

    try {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the BUMBLEBEE installation!');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the BUMBLEBEE installation.');
      }
      setInstallPrompt(null);
    } catch (e) {
      console.error("Installation trigger failed:", e);
    }
  };

  return {
    isReadyToInstall: !!installPrompt,
    isInstalled,
    triggerInstall
  };
}
