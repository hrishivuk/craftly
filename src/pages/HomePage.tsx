import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <article className="page page-home">
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">For independent artists and makers</p>
          <h1>Build your Artisan shop and turn interest into real projects.</h1>
          <p className="lead">
            Craftly helps artisans and gifters connect through meaning, not just product specs.
            Share your story, showcase handcrafted work, and invite custom requests with one
            profile URL.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary nav-link-btn" to="/join">
              Become an Artisan
            </Link>
            <Link className="btn btn-soft nav-link-btn" to="/a/terra-studio">
              View sample shop
            </Link>
          </div>
        </div>

        <div className="hero-art">
          <div className="sticker sticker-a">Clay</div>
          <div className="sticker sticker-b">Weave</div>
          <div className="sticker sticker-c">Wood</div>
          <div className="art-blob">Pastel craft collage area</div>
        </div>
      </section>

      <section className="feature-trio">
        <div className="card card-mint">
          <h3>Personal shop URL</h3>
          <p>Each Artisan gets a dedicated profile page with products and brand identity.</p>
        </div>
        <div className="card card-peach">
          <h3>Display your product catalog</h3>
          <p>Showcase photos, descriptions, and price hints for ready or custom pieces.</p>
        </div>
        <div className="card card-lilac">
          <h3>Human-centered gifting</h3>
          <p>Turn a purchase into an emotional memory with custom requests and maker context.</p>
        </div>
      </section>
    </article>
  )
}
