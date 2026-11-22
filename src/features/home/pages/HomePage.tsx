import { Link } from 'react-router'
import { useItems } from '@/features/catalog/api/use-items'
import { formatPrice } from '@/features/catalog/model/price'
import { ItemImage } from '@/features/catalog/ui/ItemImage'
import { Card } from '@/shared/ui/Card'
import { Tag } from '@/shared/ui/Chip'
import styles from './HomePage.module.css'

const FEATURED_COUNT = 8

const steps = [
  { title: 'Start with a pack', text: 'Seeds and a soil sensor, chosen for beginners.' },
  { title: 'Keep a journal', text: 'Photos and a short questionnaire at every checkpoint.' },
  { title: 'Get help fast', text: 'An AI diagnosis first, and a botanist when it is not clear.' },
]

function FeaturedItems() {
  const items = useItems()

  if (items.error) {
    return (
      <Card className={styles.teaser}>
        <p>Sign in to see the packs and their prices.</p>
        <Link to="/login" state={{ from: '/' }}>
          Sign in
        </Link>
      </Card>
    )
  }
  if (!items.data) return null

  return (
    <ul className={styles.grid}>
      {items.data.slice(0, FEATURED_COUNT).map((item) => (
        <Card as="li" key={item.id} className={styles.featured}>
          <ItemImage itemType={item.item_type} slug={item.slug} />
          <div className={styles.featuredBody}>
            <h3>{item.name}</h3>
            <p className={styles.meta}>{item.plant_species ?? 'Soil sensor'}</p>
            {item.labels.length > 0 && (
              <ul className={styles.tags} aria-label="Labels">
                {item.labels.map((label) => (
                  <li key={label}>
                    <Tag>{label}</Tag>
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.price}>{formatPrice(item.price_cents)}</p>
            <Link to={`/shop?q=${encodeURIComponent(item.name)}`}>View in the shop</Link>
          </div>
        </Card>
      ))}
    </ul>
  )
}

export function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <h1>Grow something that lives.</h1>
        <p className={styles.lead}>
          Pick a starter pack, keep a journal with photos, and get an answer the moment a leaf looks
          wrong.
        </p>
        <div className={styles.actions}>
          <Link to="/shop" className={styles.primary}>
            Browse the shop
          </Link>
          <a href="#how" className={styles.quiet}>
            How it works
          </a>
        </div>
      </section>

      <ol className={styles.steps} id="how" aria-label="How GrowPath works">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>

      <section className={styles.section} aria-labelledby="from-shop">
        <div className={styles.head}>
          <h2 id="from-shop">From the shop</h2>
          <Link to="/shop">See everything →</Link>
        </div>
        <FeaturedItems />
      </section>

      <section className={styles.duo} aria-label="Help">
        <Card as="article" className={`${styles.panel} ${styles.accent}`}>
          <h2>Ask a botanist</h2>
          <p>
            If the AI is not sure, you decide whether to send your question to an expert. You always
            see how many consultations are left before you spend one.
          </p>
        </Card>
        <Card as="article" className={styles.panel}>
          <p className="eyebrow">AI chat</p>
          <h2>Answers with sources</h2>
          <p>
            Ask a care question and get an answer from our knowledge base, with the sections it came
            from.
          </p>
          <Link to="/chat" className={styles.arrow}>
            Open the chat →
          </Link>
        </Card>
      </section>
    </>
  )
}
