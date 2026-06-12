import { Camera } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  return (
    <div
      className="splash-screen"
      onAnimationEnd={() => {
        setTimeout(onFinish, 500);
      }}
      style={{
        animation: 'none' // controlled by CSS classes
      }}
    >
      <div className="splash-logo">
        <Camera size={38} color="#fff" />
      </div>

      <div className="splash-title">
        <span>do'i</span>
        <span className="text-gradient">picture</span>
      </div>

      <div className="splash-subtitle">Camera-To-Cloud Workstation</div>

      <div className="splash-loader">
        <div className="splash-loader-bar" />
      </div>

      <div className="splash-tagline">
        Premium photo booth experience — self-hosted, yours forever
      </div>
    </div>
  );
};
