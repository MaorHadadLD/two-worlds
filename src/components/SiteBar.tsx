export default function SiteBar() {
  return (
    <header className="bar">
      <a className="bar-mark" href="#top" aria-label="מאור חדאד, מפתח תוכנה. לראש הדף">
        <span className="bar-name">מאור חדאד</span>
        <span className="bar-role">מפתח תוכנה</span>
      </a>
      <nav className="bar-nav" aria-label="פרקים">
        <a href="#store">חנות</a>
        <a href="#flow">זרימה</a>
        <a href="#feel">חוויה</a>
      </nav>
      <a className="btn btn--ink bar-cta" href="#start">
        נדבר על רעיון
      </a>
    </header>
  );
}
