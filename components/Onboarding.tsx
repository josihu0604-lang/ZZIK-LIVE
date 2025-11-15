import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow, Autoplay } from 'swiper/modules';
import { 
  MapPin, 
  Users, 
  Shield, 
  Bell, 
  ChevronRight,
  CheckCircle2,
  Zap,
  Heart
} from 'lucide-react';
import { Button } from './ui/Button';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface OnboardingSlide {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  features?: string[];
}

interface OnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const slides: OnboardingSlide[] = [
  {
    id: 'welcome',
    icon: MapPin,
    title: 'Welcome to ZZIK LIVE',
    description: 'Your personal safety companion for real-time location sharing and emergency assistance.',
    color: 'from-blue-500 to-purple-600',
    features: [
      'Real-time location sharing',
      'Emergency SOS alerts',
      'Community support'
    ]
  },
  {
    id: 'location',
    icon: MapPin,
    title: 'Share Your Location',
    description: 'Keep your loved ones informed about your whereabouts with secure, real-time location sharing.',
    color: 'from-green-500 to-teal-600',
    features: [
      'Privacy-first approach',
      'Temporary sharing options',
      'Custom safety zones'
    ]
  },
  {
    id: 'community',
    icon: Users,
    title: 'Join Safety Communities',
    description: 'Connect with local safety groups and stay informed about incidents in your area.',
    color: 'from-orange-500 to-red-600',
    features: [
      'Local incident reports',
      'Community alerts',
      'Neighborhood watch'
    ]
  },
  {
    id: 'emergency',
    icon: Shield,
    title: 'Emergency Assistance',
    description: 'Get help instantly with one-touch emergency features and automated alerts.',
    color: 'from-red-500 to-pink-600',
    features: [
      'One-touch SOS',
      'Automatic location sharing',
      'Emergency contacts'
    ]
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Receive intelligent alerts about safety concerns and updates from your network.',
    color: 'from-purple-500 to-indigo-600',
    features: [
      'Customizable alerts',
      'Quiet hours',
      'Priority notifications'
    ]
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [completedSlides, setCompletedSlides] = useState<Set<string>>(new Set());

  const handleSlideChange = (swiper: any) => {
    setCurrentSlide(swiper.activeIndex);
    const slideId = slides[swiper.activeIndex]?.id;
    if (slideId) {
      setCompletedSlides(prev => new Set([...prev, slideId]));
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip button */}
      {onSkip && !isLastSlide && (
        <button
          onClick={onSkip}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
        >
          Skip
        </button>
      )}

      {/* Swiper container */}
      <Swiper
        modules={[Navigation, Pagination, EffectCoverflow, Autoplay]}
        spaceBetween={50}
        slidesPerView={1}
        navigation
        pagination={{ 
          clickable: true,
          dynamicBullets: true
        }}
        effect="coverflow"
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true
        }}
        onSlideChange={handleSlideChange}
        className="h-full w-full"
      >
        {slides.map((slide, index) => {
          const Icon = slide.icon;
          return (
            <SwiperSlide key={slide.id}>
              <div className="h-full flex flex-col items-center justify-center px-8 md:px-16">
                {/* Icon with animated background */}
                <div className="relative mb-8">
                  <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} rounded-full blur-3xl opacity-50 animate-pulse`} />
                  <div className={`relative bg-gradient-to-r ${slide.color} p-6 rounded-3xl shadow-2xl`}>
                    <Icon size={64} className="text-white" />
                  </div>
                </div>

                {/* Content */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
                  {slide.title}
                </h1>
                
                <p className="text-lg md:text-xl text-gray-300 mb-8 text-center max-w-2xl">
                  {slide.description}
                </p>

                {/* Features */}
                {slide.features && (
                  <div className="mb-8 space-y-3">
                    {slide.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-gray-300">
                        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {isLastSlide && (
                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={onComplete}

                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Slide indicators */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-8 bg-white' 
                : completedSlides.has(slide.id)
                  ? 'w-2 bg-white/60'
                  : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;