// app/auth/login/page.tsx
'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Focus on email input when component mounts
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return '이메일을 입력해주세요.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '올바른 이메일 형식이 아닙니다.';
    }
    return undefined;
  };

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return '비밀번호를 입력해주세요.';
    }
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.';
    }
    return undefined;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouchedFields((prev) => new Set(prev).add(field));

    if (field === 'email') {
      const error = validateEmail(formData.email);
      if (error) {
        setErrors((prev) => ({ ...prev, email: error }));
      }
    } else if (field === 'password') {
      const error = validatePassword(formData.password);
      if (error) {
        setErrors((prev) => ({ ...prev, password: error }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      setTouchedFields(new Set(['email', 'password']));
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      // Navigate to content page after successful login
      router.push('/content');
    } catch (error) {
      setErrors({
        general: '로그인에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Social login handlers
  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      // Simulate social login
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/content');
    } catch (error) {
      setErrors({
        general: `${provider} 로그인에 실패했습니다.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.container} role="main" aria-label="로그인">
      <div className={styles.formWrapper}>
        {/* Logo and Title */}
        <div className={styles.header}>
          <div className={styles.logo} aria-hidden="true">
            🚀
          </div>
          <h1 className={styles.title}>ZZIK LIVE 로그인</h1>
          <p className={styles.subtitle}>실시간 로컬 경험을 시작하세요</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate aria-label="로그인 폼">
          {/* General Error Message */}
          {errors.general && (
            <div className={styles.errorMessage} role="alert" aria-live="polite">
              <span className={styles.errorIcon} aria-hidden="true">
                ⚠️
              </span>
              {errors.general}
            </div>
          )}

          {/* Email Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              이메일
            </label>
            <div className={styles.inputWrapper}>
              <input
                ref={emailRef}
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                className={`${styles.input} ${
                  touchedFields.has('email') && errors.email ? styles.inputError : ''
                }`}
                placeholder="your@email.com"
                autoComplete="email"
                aria-invalid={touchedFields.has('email') && !!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
                required
              />
              <span className={styles.inputIcon} aria-hidden="true">
                📧
              </span>
            </div>
            {touchedFields.has('email') && errors.email && (
              <span id="email-error" className={styles.fieldError} role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              비밀번호
            </label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                className={`${styles.input} ${
                  touchedFields.has('password') && errors.password ? styles.inputError : ''
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={touchedFields.has('password') && !!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {touchedFields.has('password') && errors.password && (
              <span id="password-error" className={styles.fieldError} role="alert">
                {errors.password}
              </span>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className={styles.optionsRow}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                aria-label="로그인 상태 유지"
              />
              <span>로그인 상태 유지</span>
            </label>
            <Link
              href="/auth/reset-password"
              className={styles.forgotLink}
              tabIndex={isLoading ? -1 : 0}
            >
              비밀번호 찾기
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner} aria-label="로그인 중...">
                <span className={styles.spinnerDot}></span>
                <span className={styles.spinnerDot}></span>
                <span className={styles.spinnerDot}></span>
              </span>
            ) : (
              '로그인'
            )}
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span>또는</span>
          </div>

          {/* Social Login Buttons */}
          <div className={styles.socialButtons}>
            <button
              type="button"
              className={`${styles.socialButton} ${styles.googleButton}`}
              onClick={() => handleSocialLogin('Google')}
              disabled={isLoading}
              aria-label="Google로 로그인"
            >
              <span className={styles.socialIcon}>🔵</span>
              Google로 계속하기
            </button>
            <button
              type="button"
              className={`${styles.socialButton} ${styles.kakaoButton}`}
              onClick={() => handleSocialLogin('Kakao')}
              disabled={isLoading}
              aria-label="카카오로 로그인"
            >
              <span className={styles.socialIcon}>💬</span>
              카카오로 계속하기
            </button>
            <button
              type="button"
              className={`${styles.socialButton} ${styles.appleButton}`}
              onClick={() => handleSocialLogin('Apple')}
              disabled={isLoading}
              aria-label="Apple로 로그인"
            >
              <span className={styles.socialIcon}>🍎</span>
              Apple로 계속하기
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className={styles.footer}>
          <p>
            아직 계정이 없으신가요?{' '}
            <Link href="/auth/signup" className={styles.signupLink} tabIndex={isLoading ? -1 : 0}>
              회원가입
            </Link>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className={styles.backgroundPattern} aria-hidden="true">
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>
    </main>
  );
}
