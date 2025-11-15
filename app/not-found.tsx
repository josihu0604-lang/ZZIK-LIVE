import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: 'var(--text-muted, #999)',
            marginBottom: '16px',
            lineHeight: 1,
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          페이지를 찾을 수 없습니다
        </h1>
        <p
          style={{
            color: 'var(--text-muted, #666)',
            marginBottom: '32px',
            lineHeight: 1.6,
          }}
        >
          요청하신 페이지가 존재하지 않거나 삭제되었습니다.
          <br />
          주소를 다시 확인해 주세요.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/">
            <Button variant="primary" size="lg" aria-label="홈으로 이동">
              홈으로
            </Button>
          </Link>
          <Link href="/feed">
            <Button variant="secondary" size="lg" aria-label="피드 보기">
              피드 보기
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary" size="lg" aria-label="탐색하기">
              탐색하기
            </Button>
          </Link>
        </div>
        <div
          style={{
            marginTop: '48px',
            fontSize: '14px',
            color: 'var(--text-muted, #999)',
          }}
        >
          <Link
            href="/"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
            }}
          >
            메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
