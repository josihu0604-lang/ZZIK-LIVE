'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FEED_POSTS_2025, INFLUENCERS_2025, getInfluencerById } from '@/lib/data/influencers-2025';
import FeedCard from '@/components/feed/FeedCard';
import styles from './feed.module.css';

// LABS feature flag - disabled by default
const ENABLE_FEED = process.env.NEXT_PUBLIC_ENABLE_FEED === 'true';

export default function FeedPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'live' | 'offers'>('all');
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Feature flag check - redirect if disabled
    if (!ENABLE_FEED) {
      router.replace('/');
      return;
    }
    
    // Check if user is a guest
    const guestCookie = document.cookie.includes('zzik_guest=1');
    setIsGuest(guestCookie);
  }, [router]);

  const filteredPosts = FEED_POSTS_2025.filter(post => {
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
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className="h1">ZZIK LIVE</h1>
          <p className="sub">실시간 나노 크리에이터 콘텐츠</p>
        </div>
        
        {isGuest && (
          <div className={styles.guestBanner}>
            <span>🎉 게스트 모드로 둘러보는 중</span>
            <button 
              className={styles.loginBtn}
              onClick={() => router.push('/auth/login')}
            >
              로그인
            </button>
          </div>
        )}
      </header>

      {/* Filter Tabs */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'live' ? styles.active : ''}`}
          onClick={() => setFilter('live')}
        >
          🔴 LIVE
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'offers' ? styles.active : ''}`}
          onClick={() => setFilter('offers')}
        >
          💰 할인중
        </button>
      </div>

      {/* Stats Bar */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{INFLUENCERS_2025.length}</span>
          <span className={styles.statLabel}>크리에이터</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{FEED_POSTS_2025.length}</span>
          <span className={styles.statLabel}>라이브 콘텐츠</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {FEED_POSTS_2025.filter(p => p.offer).length}
          </span>
          <span className={styles.statLabel}>진행중 오퍼</span>
        </div>
      </div>

      {/* Feed Grid */}
      <div className={styles.grid}>
        {filteredPosts.map((post) => {
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
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className={styles.empty}>
          <p className="body">해당하는 콘텐츠가 없습니다.</p>
        </div>
      )}
    </main>
  );
}