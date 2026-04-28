import { Link } from 'react-router-dom'
import { trackEvent } from '../lib/analytics'

export function HomePage() {
  return (
    <article className="page page-home home-paper">
      <section className="paper-hero">
        <div className="paper-hero-hands left" />
        <div className="paper-hero-hands right" />
        <div className="paper-hero-center">
          <h1>Handmade Gifts</h1>
          <p>Creation begins with you. We help it reach the right person.</p>
          <Link
            className="btn btn-primary nav-link-btn hero-primary-btn"
            to="/join"
            onClick={() => trackEvent('home_cta_clicked', { location: 'hero' })}
          >
            Become an Artisan
          </Link>
        </div>
        <div className="torn-divider" />
      </section>

      <section className="paper-values">
        <article>
          <span className="value-icon">♡</span>
          <h3>Made by real people</h3>
          <p>Not machines.</p>
        </article>
        <article>
          <span className="value-icon">🧵</span>
          <h3>Support artists</h3>
          <p>Empower creativity.</p>
        </article>
        <article>
          <span className="value-icon">🎁</span>
          <h3>Gifts that mean more</h3>
          <p>Thoughtful. Personal. Timeless.</p>
        </article>
      </section>

      <section className="artisan-banner">
        <div>
          <p>Are you a creator?</p>
          <h3>Make something beautiful. Get paid for it.</h3>
        </div>
        <Link className="btn btn-primary nav-link-btn" to="/join">
          Join as Creator
        </Link>
      </section>

      <section className="paper-section" id="how-it-works">
        <h2 className="center-title">How it works</h2>
        <div className="how-papers">
          <article>
            <span>1</span>
            <h4>Join</h4>
            <p>Create your profile and tell your story.</p>
          </article>
          <article>
            <span>2</span>
            <h4>List</h4>
            <p>Add your creations and set your price.</p>
          </article>
          <article>
            <span>3</span>
            <h4>Get discovered</h4>
            <p>Connect with people who love handmade.</p>
          </article>
          <article>
            <span>4</span>
            <h4>Earn & grow</h4>
            <p>Get paid, build your brand, and keep creating.</p>
          </article>
        </div>
      </section>

      <section className="paper-footer-cta">
        <h3>Stay inspired</h3>
        <p>Get stories, new collections, and special offers straight to your inbox.</p>
        <form className="paper-footer-form">
          <input type="email" placeholder="Enter your email" />
          <button className="btn btn-primary" type="button">
            Subscribe
          </button>
        </form>
      </section>
    </article>
  )
}
