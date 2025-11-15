'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, TrendingUp, Clock, Star, Play } from 'lucide-react';
import { FEED_POSTS_2025, INFLUENCERS_2025, getInfluencerById } from '@/lib/data/influencers-2025';
import FeedCard from '@/components/feed/FeedCard';
import { SkeletonFeedCard } from '@/components/ui/Skeleton';
import { EmptyFeed } from '@/components/ui/EmptyState';
import styles from './content.module.css';

type TabType = 'trending' | 'latest' | 'top' | 'live';
type FilterType = 'all' | 'video' | 'live' | 'offers';

function ContentPageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
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

  // Filter and sort posts based on active tab and filters
  const getFilteredPosts = () => {
    let posts = [...FEED_POSTS_2025];

    // Apply filter
    if (filter === 'video') {
      posts = posts.filter((post) => post.contentType === 'video' || post.contentType === 'short');
    } else if (filter === 'live') {
      posts = posts.filter((post) => post.type === 'live');
    } else if (filter === 'offers') {
      posts = posts.filter((post) => !!post.offer);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter((post) => {
        const influencer = getInfluencerById(post.influencerId);
        return (
          post.content.toLowerCase().includes(query) ||
          post.hashtags?.some((tag) => tag.toLowerCase().includes(query)) ||
          influencer?.name.toLowerCase().includes(query) ||
          influencer?.category.toLowerCase().includes(query)
        );
      });
    }

    // Sort by tab
    switch (activeTab) {
      case 'trending':
        // Sort by engagement (views + likes)
        posts.sort((a, b) => b.views + b.likes - (a.views + a.likes));
        break;
      case 'latest':
        // Sort by timestamp (newest first)
        posts.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'top':
        // Sort by likes
        posts.sort((a, b) => b.likes - a.likes);
        break;
      case 'live':
        // Only show live content
        posts = posts.filter((post) => post.type === 'live');
        posts.sort((a, b) => b.timestamp - a.timestamp);
        break;
    }

    return posts;
  };

  const filteredPosts = getFilteredPosts();

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
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1 className="h2">콘텐츠 탐색</h1>
            <p className="caption text-muted">나노 인플루언서의 트렌딩 콘텐츠</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.searchToggle}
              onClick={() => setShowSearch(!showSearch)}
              aria-label="검색 토글"
            >
              <Search size={20} />
            </button>
            <button type="button" className={styles.filterToggle} aria-label="필터 열기">
              <Filter size={20} />
              {filter !== 'all' && <span className={styles.filterBadge}>1</span>}
            </button>
          </div>
        </div>

        {showSearch && (
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="크리에이터, 해시태그, 콘텐츠 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="콘텐츠 검색"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearchQuery('')}
                aria-label="검색어 지우기"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {isGuest && (
          <div className={styles.guestBanner} role="status" aria-live="polite">
            <span>💡 로그인하면 맞춤 콘텐츠를 추천받을 수 있어요</span>
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

      {/* Tab Navigation */}
      <nav className={styles.tabs} role="navigation" aria-label="콘텐츠 탭">
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'trending' ? styles.active : ''}`}
          onClick={() => setActiveTab('trending')}
          aria-selected={activeTab === 'trending'}
        >
          <TrendingUp size={16} />
          <span>트렌딩</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'latest' ? styles.active : ''}`}
          onClick={() => setActiveTab('latest')}
          aria-selected={activeTab === 'latest'}
        >
          <Clock size={16} />
          <span>최신</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'top' ? styles.active : ''}`}
          onClick={() => setActiveTab('top')}
          aria-selected={activeTab === 'top'}
        >
          <Star size={16} />
          <span>인기</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'live' ? styles.active : ''}`}
          onClick={() => setActiveTab('live')}
          aria-selected={activeTab === 'live'}
        >
          <Play size={16} />
          <span>라이브</span>
          {FEED_POSTS_2025.filter((p) => p.type === 'live').length > 0 && (
            <span className={styles.liveBadge}>
              {FEED_POSTS_2025.filter((p) => p.type === 'live').length}
            </span>
          )}
        </button>
      </nav>

      {/* Filter Pills */}
      <div className={styles.filters} role="navigation" aria-label="콘텐츠 필터">
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          전체
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'video' ? styles.active : ''}`}
          onClick={() => setFilter('video')}
          aria-pressed={filter === 'video'}
        >
          🎬 동영상
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'live' ? styles.active : ''}`}
          onClick={() => setFilter('live')}
          aria-pressed={filter === 'live'}
        >
          🔴 라이브
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filter === 'offers' ? styles.active : ''}`}
          onClick={() => setFilter('offers')}
          aria-pressed={filter === 'offers'}
        >
          🏷️ 오퍼
        </button>
      </div>

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

      {/* Show search results count */}
      {searchQuery && !isLoading && (
        <div className={styles.searchResults}>
          <p className="caption text-muted">
            "{searchQuery}" 검색 결과: {filteredPosts.length}개의 콘텐츠
          </p>
        </div>
      )}
    </main>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ContentPageContent />
    </Suspense>
  );
}
