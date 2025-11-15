'use client';

import { Post, Influencer } from '@/lib/data/influencers-2025';
import { formatNumber } from '@/lib/data/influencers-2025';
import styles from './FeedCard.module.css';

interface FeedCardProps {
  post: Post;
  influencer: Influencer;
  onClick?: () => void;
}

export default function FeedCard({ post, influencer, onClick }: FeedCardProps) {
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  return (
    <article className={styles.card} onClick={onClick}>
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        <div className={styles.thumbnailIcon}>{post.thumbnail}</div>
        {post.type === 'live' && (
          <div className={styles.liveBadge}>
            <span className={styles.liveIndicator}></span>
            LIVE
          </div>
        )}
        {post.offer && (
          <div className={styles.offerBadge}>
            {post.offer.discount}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.profile}>
            <span className={styles.avatar}>{influencer.avatar}</span>
            <div className={styles.info}>
              <div className={styles.name}>
                {influencer.displayName}
                {influencer.verified && (
                  <span className={styles.verified}>✓</span>
                )}
              </div>
              <div className={styles.meta}>
                {post.location.name} · {timeAgo(post.timestamp)}
              </div>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.description}>{post.description}</p>

        {/* Tags */}
        <div className={styles.tags}>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <span className={styles.stat}>
            ❤️ {formatNumber(post.likes)}
          </span>
          <span className={styles.stat}>
            💬 {formatNumber(post.comments)}
          </span>
          <span className={styles.stat}>
            👁️ {formatNumber(post.views)}
          </span>
        </div>
      </div>
    </article>
  );
}