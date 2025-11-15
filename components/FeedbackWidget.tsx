import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Lightbulb,
  Bug,
  Star,
} from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';
type RatingValue = 1 | 2 | 3 | 4 | 5;

interface FeedbackData {
  type: FeedbackType;
  rating: RatingValue | null;
  message: string;
  email?: string;
  url: string;
  userAgent: string;
  timestamp: number;
}

const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'form' | 'success'>('initial');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('other');
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { type: 'bug' as FeedbackType, label: 'Bug Report', icon: Bug, color: 'red' },
    { type: 'feature' as FeedbackType, label: 'Feature Request', icon: Lightbulb, color: 'yellow' },
    { type: 'improvement' as FeedbackType, label: 'Improvement', icon: ThumbsUp, color: 'blue' },
    { type: 'other' as FeedbackType, label: 'Other', icon: MessageSquare, color: 'gray' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const feedbackData: FeedbackData = {
      type: feedbackType,
      rating,
      message,
      email: email || undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };

    try {
      // Send to your feedback API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setStep('success');
        setTimeout(() => {
          setIsOpen(false);
          resetForm();
        }, 3000);
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Store locally as fallback
      const storedFeedback = localStorage.getItem('pending-feedback') || '[]';
      const pendingFeedback = JSON.parse(storedFeedback);
      pendingFeedback.push(feedbackData);
      localStorage.setItem('pending-feedback', JSON.stringify(pendingFeedback));

      setStep('success');
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('initial');
    setFeedbackType('other');
    setRating(null);
    setMessage('');
    setEmail('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Open feedback"
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feedback modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {step === 'success' ? 'Thank You!' : 'Send Feedback'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'initial' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      What would you like to tell us?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {feedbackTypes.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.type}
                            onClick={() => {
                              setFeedbackType(item.type);
                              setStep('form');
                            }}
                            className={`p-4 rounded-xl border-2 ${
                              feedbackType === item.type
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            } transition-all`}
                          >
                            <Icon size={32} className={`mx-auto mb-2 text-${item.color}-500`} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 'form' && (
                  <motion.form
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        How would you rate your experience?
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value as RatingValue)}
                            className="p-2 hover:scale-110 transition-transform"
                          >
                            <Star
                              size={32}
                              className={
                                rating && value <= rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-300 dark:text-gray-600'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="feedback-message"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Tell us more
                      </label>
                      <textarea
                        id="feedback-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="What can we do better?"
                      />
                    </div>

                    {/* Email (optional) */}
                    <div>
                      <label
                        htmlFor="feedback-email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Email (optional)
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        We'll only use this to follow up on your feedback
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep('initial')}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="flex-1 px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          'Sending...'
                        ) : (
                          <>
                            Send <Send size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}

                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <ThumbsUp size={40} className="text-green-600 dark:text-green-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Thank you!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your feedback helps us improve ZZIK LIVE for everyone.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget;
