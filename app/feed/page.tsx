'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FEED_POSTS_2025, INFLUENCERS_2025, getInfluencerById } from '@/lib/data/influencers-2025';
import FeedCard from '@/components/feed/FeedCard';
import { SkeletonFeedCard } from '@/components/ui/Skeleton';
import { EmptyFeed } from '@/components/ui/EmptyState';
import styles from './feed.module.css';

export default function FeedPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'live' | 'offers'>('all');
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is a guest
    const guestCookie = document.cookie.includes('zzik_guest=1');
    setIsGuest(guestCookie);

    // Simulate loading state
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  const filteredPosts = FEED_POSTS_2025.filter((post) => {
    if (filter === 'live') return post.type === 'live';
    if (filter === 'offers') return !!post.offer;
    return true;
  });

  const handlePostClick = (postId: string) => {
    if (isGuest) {
      // Show login prompt for guests
      const confirmLogin = confirm('로그인하면 더 많은 기능을 이용할 수 있어요. 로그인하시겠어요?');
      if (confirmLogin) {
        router.push(`/auth/login?next=/feed/${postId}`);
      }
    } else {
      // Navigate to post detail
      router.push(`/feed/${postId}`);
    }
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className="h1">ZZIK LIVE</h1>
          <p className="sub">실시간 나노 크리에이터 콘텐츠</p>
        </div>

        {isGuest && (
          <div className={styles.guestBanner} role="status" aria-live="polite">
            <span>게스트 모드로 둘러보는 중</span>
            <button
              type="button"
              className={styles.loginBtn}
              onClick={() => router.push('/auth/login')}
              aria-label="로그인하기"
            >
              로그인
            </button>
          </div>
        )}
      </header>

      <nav className={styles.filters} role="navigation" aria-label="피드 필터">
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          aria-label="전체 피드 보기"
        >
          전체
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'live' ? styles.active : ''}`}
          onClick={() => setFilter('live')}
          aria-pressed={filter === 'live'}
          aria-label="라이브 피드만 보기"
        >
          LIVE
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'offers' ? styles.active : ''}`}
          onClick={() => setFilter('offers')}
          aria-pressed={filter === 'offers'}
          aria-label="할인 중인 피드만 보기"
        >
          할인중
        </button>
      </nav>

      <div className={`${styles.stats} container mb-6 grid grid-cols-3 gap-4`}>
        <div className={`${styles.statItem} text-center p-4 rounded-lg bg-subtle`}>
          <span className={`${styles.statValue} block text-2xl font-bold mb-1`}>
            {INFLUENCERS_2025.length}
          </span>
          <span className={`${styles.statLabel} text-small text-muted`}>크리에이터</span>
        </div>
        <div className={`${styles.statItem} text-center p-4 rounded-lg bg-subtle`}>
          <span className={`${styles.statValue} block text-2xl font-bold mb-1`}>
            {FEED_POSTS_2025.length}
          </span>
          <span className={`${styles.statLabel} text-small text-muted`}>라이브 콘텐츠</span>
        </div>
        <div className={`${styles.statItem} text-center p-4 rounded-lg bg-subtle`}>
          <span className={`${styles.statValue} block text-2xl font-bold mb-1`}>
            {FEED_POSTS_2025.filter((p) => p.offer).length}
          </span>
          <span className={`${styles.statLabel} text-small text-muted`}>진행중 오퍼</span>
        </div>
      </div>

      <div
        className={`${styles.grid} container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-nav`}
      >
        {isLoading ? (
          // Loading state with skeleton cards
          Array.from({ length: 6 }).map((_, i) => <SkeletonFeedCard key={`skeleton-${i}`} />)
        ) : filteredPosts.length === 0 ? (
          // Empty state
          <div className="col-span-full">
            <EmptyFeed />
          </div>
        ) : (
          // Actual content
          filteredPosts.map((post) => {
            const influencer = getInfluencerById(post.influencerId);
            if (!influencer) return null;

            return (
              <FeedCard
                key={post.id}
                post={post}
                influencer={influencer}
                onClick={() => handlePostClick(post.id)}
              />
            );
          })
        )}
      </div>

      {filteredPosts.length === 0 && (
        <div className={styles.empty}>
          <p className="body">해당하는 콘텐츠가 없습니다.</p>
        </div>
      )}
    </main>
  );
}
