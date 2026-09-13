import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

interface Page {
  eyebrow: string;
  title: string;
  body: string;
  icon: ReactNode;
}

const PAGES: Page[] = [
  {
    eyebrow: 'P',
    title: 'Purposeful',
    body: 'Rooted in something that actually matters to you, not a generic goal.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="var(--accent)" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" stroke="var(--accent)" strokeWidth="1.6" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    eyebrow: 'A',
    title: 'Actionable',
    body: 'A concrete, doable step — not a vague intention to "be better."',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path d="M12 4v16M12 4l-5 5M12 4l5 5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    eyebrow: 'C',
    title: 'Continuous',
    body: 'Small enough to repeat, so you learn from a pattern, not one data point.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3c0 4.5-5.5 6-5.5 11.5a5.5 5.5 0 1 0 11 0C17.5 9 12 7.5 12 3Z"
          stroke="var(--accent)"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
  {
    eyebrow: 'T',
    title: 'Trackable',
    body: "A quick check-in captures what happened, so the result isn't just a feeling.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="3.5" stroke="var(--accent)" strokeWidth="1.6" />
        <path d="M8 12.5l2.5 2.5L16 9" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const SWIPE_THRESHOLD = 40;

export function JournalFlip() {
  const [index, setIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(PAGES.length - 1, i)));
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    pointerStartX.current = e.clientX;
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    if (dx <= -SWIPE_THRESHOLD) next();
    else if (dx >= SWIPE_THRESHOLD) prev();
    pointerStartX.current = null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          width: 300,
          height: 340,
          perspective: 1800,
          touchAction: 'pan-y',
          cursor: 'grab',
        }}
      >
        {/* base of the journal, sitting under the pages */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px oklch(24% 0.02 55 / 0.1)',
          }}
        />

        {PAGES.map((page, i) => {
          const turned = i < index;
          return (
            <div
              key={page.title}
              onClick={() => !turned && goTo(i + 1)}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
                transform: `rotateY(${turned ? -178 : 0}deg)`,
                // z-index isn't interpolable, so we delay it to the end of the
                // flip when a page is turning away (keeps it on top while it
                // visibly rotates) but apply it immediately when a page turns
                // back into view (so it's on top before it starts rotating in).
                transition: `transform 0.65s cubic-bezier(.4,.1,.2,1), z-index 0s ${turned ? '0.65s' : '0s'}`,
                zIndex: turned ? i : PAGES.length - i,
                cursor: turned ? 'default' : 'pointer',
              }}
            >
              {/* front face */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--paper)',
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '2px 0 12px oklch(24% 0.02 55 / 0.06)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'var(--ink-faint)',
                  }}
                >
                  {i + 1} / {PAGES.length}
                </span>
                <div style={{ marginTop: 'auto' }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'var(--accent-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    {page.icon}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--accent-dark)' }}>
                    {page.title}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.5 }}>{page.body}</div>
                </div>
                <div style={{ marginTop: 20, fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  {turned ? '' : i === PAGES.length - 1 ? 'tap to finish' : 'tap or swipe to turn the page →'}
                </div>
              </div>
              {/* back face, seen once the page has turned */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'oklch(95% 0.015 78)',
                  transform: 'rotateY(180deg)',
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous page"
          style={{ background: 'none', border: 'none', fontSize: 20, color: index === 0 ? 'var(--border-strong)' : 'var(--ink-muted)' }}
        >
          ‹
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {PAGES.map((page, i) => (
            <span
              key={page.title}
              onClick={() => goTo(i)}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: i === index ? 'var(--accent)' : 'var(--border-strong)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <button
          onClick={next}
          disabled={index === PAGES.length - 1}
          aria-label="Next page"
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            color: index === PAGES.length - 1 ? 'var(--border-strong)' : 'var(--ink-muted)',
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
