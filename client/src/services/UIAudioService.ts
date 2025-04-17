export function playUiSound(sound: 'button' | 'error' | 'success' = 'button') {
  const soundMap = {
    button: '/assets/sounds/usual_button.mp3',
    error: '/assets/sounds/error.mp3',
    success: '/assets/sounds/success.mp3'
  };
  const audio = new Audio(soundMap[sound]);
  audio.volume = 0.5;
  audio.play();
} 