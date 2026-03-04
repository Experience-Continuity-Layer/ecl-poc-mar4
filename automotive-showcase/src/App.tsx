import { useEffect, useMemo, useState } from "react";

const models = [
  {
    name: "Astra X",
    category: "Fully electric SUV",
    price: "From EUR 74,900",
    spec: "Up to 580 km range",
  },
  {
    name: "Orion S",
    category: "Plug-in hybrid SUV",
    price: "From EUR 52,800",
    spec: "Electric + petrol flexibility",
  },
  {
    name: "Atlas Tour",
    category: "Mild hybrid estate",
    price: "From EUR 46,900",
    spec: "Long-haul comfort and utility",
  },
  {
    name: "Nova Crossover",
    category: "Electric crossover",
    price: "From EUR 49,200",
    spec: "Fast charging in 28 min (10-80%)",
  },
];

const highlights = [
  {
    title: "Human-centered safety",
    detail:
      "Lidar-assisted sensing, cross-traffic mitigation, and adaptive collision awareness built to support calm driving.",
  },
  {
    title: "Scandinavian craftsmanship",
    detail:
      "Tactile natural materials, low-noise cabins, and intuitive controls with reduced visual clutter.",
  },
  {
    title: "Electrification without friction",
    detail:
      "Plan routes with charging built-in, optimize home energy use, and monitor battery health in one ecosystem.",
  },
];

const ownershipCards = [
  {
    title: "Service and Care",
    text: "Transparent service plans, digital booking, and remote diagnostics before issues escalate.",
  },
  {
    title: "Fleet and Business",
    text: "Electrification advisory, company car policies, and analytics for operational efficiency.",
  },
  {
    title: "Insurance and Roadside",
    text: "Integrated claim flow and 24/7 support designed for minimal downtime.",
  },
];

function App() {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsHeaderCompact(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );

    const revealNodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    revealNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="site-shell">
      <header className={`top-nav ${isHeaderCompact ? "top-nav--compact" : ""}`}>
        <div className="top-nav__inner">
          <a href="#" className="brand-mark" aria-label="Aurelia Motors homepage">
            Aurelia Motors
          </a>
          <nav className="top-nav__links" aria-label="Primary">
            <a href="#models">Cars</a>
            <a href="#safety">Safety</a>
            <a href="#electric">Electric</a>
            <a href="#ownership">Ownership</a>
          </nav>
          <button type="button" className="top-nav__cta">
            Book a test drive
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__veil" />
          <div className="hero__content" data-reveal>
            <p className="eyebrow">A premium mobility experience</p>
            <h1>Designed around your life, not around noise.</h1>
            <p className="hero__copy">
              Explore a modern automotive ecosystem inspired by Scandinavian restraint, built for safety,
              electrification, and effortless ownership.
            </p>
            <div className="hero__actions">
              <button type="button" className="btn btn--light">
                Explore the range
              </button>
              <button type="button" className="btn btn--ghost">
                Build your car
              </button>
            </div>
          </div>
        </section>

        <section id="models" className="section section--models">
          <div className="section__intro" data-reveal>
            <p className="eyebrow">Current lineup</p>
            <h2>Find your next drive.</h2>
          </div>
          <div className="model-grid">
            {models.map((model) => (
              <article key={model.name} className="model-card" data-reveal>
                <p className="model-card__category">{model.category}</p>
                <h3>{model.name}</h3>
                <p className="model-card__spec">{model.spec}</p>
                <div className="model-card__meta">
                  <span>{model.price}</span>
                  <button type="button">View details</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="safety" className="section section--dark">
          <div className="section__split">
            <div className="section__intro" data-reveal>
              <p className="eyebrow">Safety innovation</p>
              <h2>Technology that supports human judgment.</h2>
              <p>
                We design every interface to reduce cognitive load and help you remain attentive in complex
                environments.
              </p>
            </div>
            <div className="highlight-list">
              {highlights.map((item) => (
                <article key={item.title} className="highlight-item" data-reveal>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="electric" className="section section--electric">
          <div className="section__intro" data-reveal>
            <p className="eyebrow">Electrification</p>
            <h2>Charge smarter. Travel further. Waste less.</h2>
          </div>
          <div className="electric-panel" data-reveal>
            <div className="electric-panel__metric">
              <p>Home charging insight</p>
              <strong>17% lower monthly charging cost</strong>
            </div>
            <div className="electric-panel__metric">
              <p>Route confidence</p>
              <strong>98.4% successful charging sessions</strong>
            </div>
            <div className="electric-panel__metric">
              <p>Battery care</p>
              <strong>Remote conditioning and health checks</strong>
            </div>
          </div>
        </section>

        <section id="ownership" className="section section--ownership">
          <div className="section__intro" data-reveal>
            <p className="eyebrow">Ownership ecosystem</p>
            <h2>Premium support through every stage.</h2>
          </div>
          <div className="ownership-grid">
            {ownershipCards.map((card) => (
              <article key={card.title} className="ownership-card" data-reveal>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <p className="footer__brand">Aurelia Motors</p>
          <p className="footer__copy">A concept microsite crafted for premium digital experience exploration.</p>
        </div>
        <div className="footer__links">
          <a href="#">Privacy</a>
          <a href="#">Accessibility</a>
          <a href="#">Sustainability</a>
          <a href="#">Contact</a>
        </div>
        <p className="footer__year">© {year} Aurelia Motors</p>
      </footer>
    </div>
  );
}

export default App;
