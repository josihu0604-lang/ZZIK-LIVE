/**
 * 2025 인플루언서 목업 데이터
 * 실제 트렌드를 반영한 가상의 나노/마이크로 크리에이터
 */

export interface Influencer {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  followers: number;
  category: string;
  location: string;
  bio: string;
  engagementRate: number;
}

export interface Post {
  id: string;
  influencerId: string;
  type: 'reel' | 'photo' | 'live';
  contentType?: 'video' | 'image' | 'short' | 'live';
  thumbnail: string;
  videoUrl?: string;
  title: string;
  description: string;
  content?: string;
  location: {
    name: string;
    address: string;
    geohash5: string;
  };
  tags: string[];
  hashtags?: string[];
  likes: number;
  comments: number;
  views: number;
  timestamp: string | number;
  offer?: {
    discount: number;
    validUntil: string;
  };
}

export const INFLUENCERS_2025: Influencer[] = [
  {
    id: 'inf_001',
    username: '@seoulfoodies_mia',
    displayName: '미아 | 서울맛집',
    avatar: '👩🏻‍🍳',
    verified: true,
    followers: 12500,
    category: 'Food & Beverage',
    location: '성수동, 서울',
    bio: '🍜 나노 푸디 | 숨은 맛집 헌터 | 성수동 단골',
    engagementRate: 8.5,
  },
  {
    id: 'inf_002',
    username: '@lifestyle_juno',
    displayName: '준오 | 라이프스타일',
    avatar: '👨🏻',
    verified: true,
    followers: 8900,
    category: 'Lifestyle',
    location: '강남구, 서울',
    bio: '✨ 일상 크리에이터 | 카페투어 | 감성 공간',
    engagementRate: 7.2,
  },
  {
    id: 'inf_003',
    username: '@fitness_sora',
    displayName: '소라 | 헬스&웰니스',
    avatar: '💪🏻',
    verified: true,
    followers: 15200,
    category: 'Fitness & Wellness',
    location: '홍대입구, 서울',
    bio: '🏋️ PT & 필라테스 | 건강한 루틴 공유',
    engagementRate: 9.1,
  },
  {
    id: 'inf_004',
    username: '@beauty_yuna',
    displayName: '유나 | 뷰티크리에이터',
    avatar: '💄',
    verified: true,
    followers: 18700,
    category: 'Beauty & Skincare',
    location: '청담동, 서울',
    bio: '💋 스킨케어 덕후 | 클린뷰티 추천',
    engagementRate: 8.8,
  },
  {
    id: 'inf_005',
    username: '@tech_kevin',
    displayName: '케빈 | 테크리뷰어',
    avatar: '📱',
    verified: false,
    followers: 6800,
    category: 'Tech & Gadgets',
    location: '판교, 경기',
    bio: '🤖 가젯 리뷰어 | IT 트렌드 분석',
    engagementRate: 6.5,
  },
  {
    id: 'inf_006',
    username: '@travel_hana',
    displayName: '하나 | 국내여행',
    avatar: '✈️',
    verified: true,
    followers: 11200,
    category: 'Travel',
    location: '부산, 부산',
    bio: '🗺️ 국내여행 전문 | 숨은 명소 발굴',
    engagementRate: 7.9,
  },
];

export const FEED_POSTS_2025: Post[] = [
  {
    id: 'post_001',
    influencerId: 'inf_001',
    type: 'reel',
    thumbnail: '🍕',
    title: '성수동 숨은 피자집 발견!',
    description: '100년 전통 나폴리 화덕에서 구운 정통 마르게리타 🔥 수제 모짜렐라가 진짜 미쳤어요',
    location: {
      name: '나폴리 피자리아',
      address: '서울 성동구 성수동2가 289-5',
      geohash5: 'wydm6',
    },
    tags: ['성수맛집', '피자', '이탈리안', '데이트'],
    likes: 1247,
    comments: 89,
    views: 8934,
    timestamp: '2025-01-15T14:30:00Z',
    offer: {
      discount: 15,
      validUntil: '2025-01-31',
    },
  },
  {
    id: 'post_002',
    influencerId: 'inf_002',
    type: 'photo',
    thumbnail: '☕',
    title: '강남 신상 감성 카페',
    description: '미니멀 디자인에 자연광 가득한 루프탑 🌿 라떼아트가 예술이에요',
    location: {
      name: '라이트하우스 카페',
      address: '서울 강남구 신사동 542-3',
      geohash5: 'wydm7',
    },
    tags: ['강남카페', '루프탑', '인스타감성', '브런치'],
    likes: 892,
    comments: 43,
    views: 5621,
    timestamp: '2025-01-15T11:20:00Z',
  },
  {
    id: 'post_003',
    influencerId: 'inf_003',
    type: 'reel',
    thumbnail: '🏋️',
    title: '홈트 10분 루틴 공개',
    description: '기구 없이도 가능한 전신 운동! 따라하기 쉬운 초보자 루틴 💪',
    location: {
      name: '피트니스 스튜디오 홍대',
      address: '서울 마포구 양화로 160',
      geohash5: 'wydmd',
    },
    tags: ['홈트레이닝', '운동루틴', '필라테스', '다이어트'],
    likes: 2134,
    comments: 156,
    views: 15678,
    timestamp: '2025-01-15T09:00:00Z',
    offer: {
      discount: 20,
      validUntil: '2025-01-25',
    },
  },
  {
    id: 'post_004',
    influencerId: 'inf_004',
    type: 'reel',
    thumbnail: '🧴',
    title: '겨울 피부 수분 채우는 법',
    description: '피부과 의사가 추천한 레이어링 순서! 건조한 겨울 극복 팁 ❄️',
    location: {
      name: '클린뷰티 청담',
      address: '서울 강남구 청담동 118-1',
      geohash5: 'wydm8',
    },
    tags: ['스킨케어', '겨울뷰티', '건성피부', '루틴'],
    likes: 1876,
    comments: 234,
    views: 12453,
    timestamp: '2025-01-15T08:30:00Z',
  },
  {
    id: 'post_005',
    influencerId: 'inf_005',
    type: 'photo',
    thumbnail: '📱',
    title: '2025 스마트워치 비교',
    description: '실사용 1개월 후기! 배터리, 헬스 기능 완벽 분석 ⌚',
    location: {
      name: '테크 스토어 판교',
      address: '경기 성남시 분당구 판교역로 235',
      geohash5: 'wydm5',
    },
    tags: ['테크리뷰', '스마트워치', '가젯', 'IT'],
    likes: 567,
    comments: 78,
    views: 4521,
    timestamp: '2025-01-14T19:00:00Z',
  },
  {
    id: 'post_006',
    influencerId: 'inf_006',
    type: 'reel',
    thumbnail: '🌊',
    title: '부산 숨은 해변 VLOG',
    description: '관광객 없는 조용한 해변 찾았어요! 일출 명소 🌅',
    location: {
      name: '송정해수욕장',
      address: '부산 해운대구 송정동',
      geohash5: 'wydm4',
    },
    tags: ['부산여행', '국내여행', '해변', '일출'],
    likes: 1543,
    comments: 92,
    views: 9876,
    timestamp: '2025-01-14T17:30:00Z',
    offer: {
      discount: 10,
      validUntil: '2025-02-15',
    },
  },
  {
    id: 'post_007',
    influencerId: 'inf_001',
    type: 'live',
    thumbnail: '🍜',
    title: '[LIVE] 성수 라멘집 리얼 후기',
    description: '지금 바로 방문 중! 실시간으로 맛 체크합니다 🔴',
    location: {
      name: '라멘야 성수',
      address: '서울 성동구 성수이로 100',
      geohash5: 'wydm6',
    },
    tags: ['라이브', '라멘', '성수맛집', '일식'],
    likes: 3421,
    comments: 567,
    views: 23456,
    timestamp: '2025-01-15T12:00:00Z',
    offer: {
      discount: 25,
      validUntil: '2025-01-15',
    },
  },
  {
    id: 'post_008',
    influencerId: 'inf_002',
    type: 'photo',
    thumbnail: '🎨',
    title: '한남동 갤러리 카페',
    description: '예술 작품 감상하며 커피 한 잔 🖼️ 조용한 분위기 완벽',
    location: {
      name: '아트 브루잉',
      address: '서울 용산구 한남동 683-102',
      geohash5: 'wydm9',
    },
    tags: ['한남동', '갤러리카페', '아트', '힐링'],
    likes: 678,
    comments: 34,
    views: 4321,
    timestamp: '2025-01-15T10:15:00Z',
  },
];

// Helper function to get posts by influencer
export function getPostsByInfluencer(influencerId: string): Post[] {
  return FEED_POSTS_2025.filter(post => post.influencerId === influencerId);
}

// Helper function to get influencer by id
export function getInfluencerById(id: string): Influencer | undefined {
  return INFLUENCERS_2025.find(inf => inf.id === id);
}

// Helper function to get trending posts
export function getTrendingPosts(limit: number = 10): Post[] {
  return FEED_POSTS_2025
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// Helper function to format numbers (Korean style)
export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}천`;
  }
  return num.toString();
}