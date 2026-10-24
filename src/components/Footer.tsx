import { EMAIL, mailto } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="foot on-ink">
      <div className="foot-top">
        <nav className="foot-links" aria-label="קישורים">
          <a href={mailto()}>
            <bdi>{EMAIL}</bdi>
          </a>
          <a href="#store">מרעיון לחנות</a>
          <a href="#flow">מעומס לזרימה</a>
          <a href="#feel">ממסך לחוויה</a>
          <a href="#start">באיזה צד אתם</a>
        </nav>
        <p className="foot-stack">
          מפתח תוכנה. <bdi dir="ltr">React · Next.js · TypeScript · React Native · Flutter · Node.js</bdi>
        </p>
      </div>
      <p className="foot-name" aria-label="מאור חדד">
        <span className="foot-name-paper" aria-hidden="true">
          מאור
        </span>{" "}
        <span aria-hidden="true">חדד</span>
      </p>
      <div className="foot-credits">
        <p>
          צילומי המסך של <bdi>Protein Market</bdi> אמיתיים. שאר הממשקים בדף הם המחשה עם נתוני דוגמה, בלי שליחה ובלי חיוב.
        </p>
        <p>
          תמונות מוצרים: <bdi>Open Food Facts contributors</bdi>, <a href="https://creativecommons.org/licenses/by-sa/3.0/"><bdi>CC BY-SA 3.0</bdi></a>, דרך{" "}
          <bdi>Protein Market</bdi>. קפה: <a href="https://commons.wikimedia.org/wiki/File:Latte_art,_espresso_with_cup_and_saucer_on_wood_table.jpg">״<bdi>Latte art, espresso with cup and saucer on wood table</bdi>״</a>,{" "}
          <bdi>HungryHuy</bdi>, <a href="https://creativecommons.org/licenses/by/2.0/"><bdi>CC BY 2.0</bdi></a> (נחתך);{" "}
          <a href="https://www.rawpixel.com/image/5927781/photo-image-public-domain-gold-wooden">״<bdi>Free iced black coffee saucer</bdi>״</a>, <bdi>rawpixel</bdi>, <bdi>CC0</bdi>.
        </p>
      </div>
    </footer>
  );
}
