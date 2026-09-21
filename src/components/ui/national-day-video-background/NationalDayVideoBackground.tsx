import styles from "./NationalDayVideoBackground.module.css";

export function NationalDayVideoBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      <video
        className={styles.video}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
      >
        <source
          src="/videos/national-day-login-background.mp4"
          type="video/mp4"
        />
      </video>
      <div className={styles.overlay} />
    </div>
  );
}
