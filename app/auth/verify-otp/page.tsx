'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyOTPPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams?.get('phone') || null;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every((digit) => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits) {
      const newCode = digits.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      setCode(newCode);

      // Focus last filled input or the next empty one
      const lastFilledIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();

      // Auto-submit if complete
      if (digits.length === 6) {
        handleVerify(digits);
      }
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const fullCode = otpCode || code.join('');
    if (fullCode.length !== 6) {
      setMessage('6자리 코드를 모두 입력해주세요');
      return;
    }

    setMessage(undefined);
    setIsLoading(true);

    try {
      // API call would go here
      // const response = await fetch('/api/auth/otp/verify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone, code: fullCode }),
      // });

      // For demo, simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Store token (demo)
      localStorage.setItem('zzik_token', 'demo_token_' + Date.now());

      // Navigate to main app
      router.replace('/(tabs)/explore');
    } catch (error) {
      setMessage('❌ 잘못된 인증 코드입니다. 다시 시도해주세요.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage('📨 새로운 인증 코드를 전송했습니다');
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <main
      id="main-content"
      className="zzik-page"
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}
      role="main"
    >
      <div className="grid" style={{ gap: '24px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>OTP 인증</h1>
          <p className="muted typo-body">
            {phone ? `${phone}로 전송된` : '전송된'} 6자리 코드를 입력하세요
          </p>
        </div>

        {/* OTP Input */}
        <div className="row" style={{ justifyContent: 'center', gap: '8px' }} role="group" aria-label="OTP 6자리 입력 필드">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="\d"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="zzik-input"
              style={{
                width: '48px',
                height: '56px',
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 600,
                fontFamily: 'var(--font-geist-mono)',
              }}
              aria-label={`OTP ${index + 1}번째 자리`}
              disabled={isLoading}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleVerify()}
          className="btn"
          disabled={isLoading || code.some((d) => !d)}
          aria-label="OTP 코드 확인"
        >
          {isLoading ? '확인 중...' : '확인'}
        </button>

        {message && (
          <div role="status" aria-live="polite" className="card" style={{ padding: '12px 16px' }}>
            <p className="typo-caption">{message}</p>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleResend}
            className="btn ghost"
            disabled={isLoading}
            style={{ fontSize: '14px' }}
            aria-label="인증 코드 다시 받기"
          >
            인증 코드 다시 받기
          </button>
        </div>
      </div>
    </main>
  );
}
