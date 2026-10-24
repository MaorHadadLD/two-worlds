import { sketchBox, stroke } from "@/lib/sketch";
import "./build.css";

/** Three small drawings. On hover or focus the pencil lines ink and the surfaces fill. */
function SiteDrawing() {
  return (
    <svg viewBox="0 0 160 120" className="mini-art" aria-hidden="true">
      <path className="fill" d="M6 6h148v108H6z" />
      <path className="line" d={sketchBox(6, 6, 148, 108, 61, 2, 8)} />
      <path className="line" d={stroke(16, 22, 60, 22, 62)} />
      <path className="fill-live" d="M118 16h26v12h-26z" />
      <path className="line" d={sketchBox(16, 40, 60, 62, 63, 1.4, 4)} />
      <path className="line" d={sketchBox(84, 40, 60, 62, 64, 1.4, 4)} />
    </svg>
  );
}
function BoardDrawing() {
  return (
    <svg viewBox="0 0 160 120" className="mini-art" aria-hidden="true">
      <path className="fill" d="M6 6h148v108H6z" />
      <path className="line" d={sketchBox(6, 6, 148, 108, 71, 2, 8)} />
      {[0, 1, 2].map((c) => (
        <g key={c}>
          <path className="line" d={stroke(122 - c * 46, 20, 146 - c * 46, 20, 72 + c)} />
          <path className="line" d={sketchBox(114 - c * 46, 30, 34, 22, 75 + c, 1.2, 3)} />
          {c < 2 ? <path className="line" d={sketchBox(114 - c * 46, 58, 34, 22, 79 + c, 1.2, 3)} /> : null}
        </g>
      ))}
      <path className="fill-live" d="M22 30h34v22H22z" />
    </svg>
  );
}
function PhoneDrawing() {
  return (
    <svg viewBox="0 0 160 120" className="mini-art" aria-hidden="true">
      <path className="fill" d="M58 6h44v108H58z" />
      <path className="line" d={sketchBox(58, 6, 44, 108, 81, 1.6, 10)} />
      <path className="line" d={stroke(92, 22, 68, 22, 82)} />
      <path className="line" d={sketchBox(66, 32, 28, 28, 83, 1.2, 4)} />
      <path className="fill-live" d="M66 92h28v10H66z" />
      <path className="line" d={sketchBox(66, 92, 28, 10, 84, 1, 5)} />
    </svg>
  );
}

const ROWS = [
  {
    href: "#store",
    name: "אתרים וחנויות",
    text: "אתרי תדמית, דפי נחיתה וחנויות אונליין שנטענים מהר ונוחים בטלפון.",
    tech: "Next.js · React · TypeScript",
    art: <SiteDrawing />,
  },
  {
    href: "#flow",
    name: "מערכות עבודה",
    text: "לוחות ניהול, תהליכים פנימיים וממשקי API שמחברים בין אנשים לנתונים.",
    tech: "Node.js · TypeScript · React",
    art: <BoardDrawing />,
  },
  {
    href: "#feel",
    name: "אפליקציות",
    text: "אפליקציות לאנדרואיד ול־iOS, עם תגובה מדויקת לכל מגע.",
    tech: "React Native · Flutter",
    art: <PhoneDrawing />,
  },
];

export default function Build() {
  return (
    <section className="build wrap" aria-labelledby="build-title" data-enter>
      <div className="build-head" data-part style={{ ["--i" as string]: 0 }}>
        <h2 id="build-title" className="chapter-title">
          מה אני בונה
        </h2>
        <p className="chapter-lead">
          כל אחד מהם מתחיל באותו מקום: מחשבה, כמה קווים על דף, ושאלה אחת: מה הדבר הראשון שזה צריך לעשות טוב. בהמשך הדף אפשר לנסות כל אחד מהם.
        </p>
      </div>
      <ul className="ledger" data-part style={{ ["--i" as string]: 1 }}>
        {ROWS.map((r) => (
          <li key={r.href}>
            <a className="ledger-row" href={r.href}>
              <span className="ledger-art">{r.art}</span>
              <span className="ledger-name">{r.name}</span>
              <span className="ledger-text">{r.text}</span>
              <span className="ledger-tech" dir="ltr">
                {r.tech}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
