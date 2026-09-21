import Image from "next/image";
import styles from "./MainLoader.module.css";

export default function MainLoader() {
  return (
    <div
      className={styles.root}
      role="status"
      aria-live="polite"
      aria-label="جارٍ التحميل"
    >
      <div className={styles.identityCard}>
        <Image
          src="/images/logo/logo.png"
          alt="معزز"
          width={112}
          height={112}
          priority
          className={`${styles.logo} logo-loader`}
        />

        <span className={styles.divider} aria-hidden="true" />

        <Image
          src="/images/national-day/national-day-motto.png"
          alt="عزّنا بطبعنا"
          width={601}
          height={107}
          priority
          className={styles.motto}
        />

        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}
