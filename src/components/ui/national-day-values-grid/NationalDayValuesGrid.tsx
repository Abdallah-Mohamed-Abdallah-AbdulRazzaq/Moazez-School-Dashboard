import Image from "next/image";
import styles from "./NationalDayValuesGrid.module.css";

const nationalDayValues = [
  { src: "/images/national-day/values/value-01.png", alt: "عزّنا برؤيتنا" },
  { src: "/images/national-day/values/value-02.png", alt: "عزّنا بكرمنا" },
  { src: "/images/national-day/values/value-03.png", alt: "عزّنا بفزعتنا" },
  { src: "/images/national-day/values/value-04.png", alt: "عزّنا بأصالتنا" },
  { src: "/images/national-day/values/value-05.png", alt: "عزّنا بطموحنا" },
  { src: "/images/national-day/values/value-06.png", alt: "عزّنا بكرمنا" },
] as const;

export function NationalDayValuesGrid() {
  return (
    <ul className={styles.grid} aria-label="قيم اليوم الوطني السعودي" dir="rtl">
      {nationalDayValues.map(({ src, alt }) => (
        <li className={styles.card} key={src}>
          <Image src={src} alt={alt} fill sizes="96px" className={styles.image} />
        </li>
      ))}
    </ul>
  );
}
