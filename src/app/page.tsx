import Board from "@/components/board/Board";
import Build from "@/components/Build";
import Choice from "@/components/choice/Choice";
import Enter from "@/components/Enter";
import Feel from "@/components/feel/Feel";
import Footer from "@/components/Footer";
import Hero from "@/components/hero/Hero";
import SiteBar from "@/components/SiteBar";
import Store from "@/components/store/Store";

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        דילוג לתוכן
      </a>
      <div id="top" />
      <SiteBar />
      <main id="main">
        <Hero />
        <Build />
        <Store />
        <Board />
        <Feel />
        <Choice />
      </main>
      <Footer />
      <Enter />
    </>
  );
}
