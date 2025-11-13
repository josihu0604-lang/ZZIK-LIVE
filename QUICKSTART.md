# ZZIK LIVE - Quick Start Guide

Get up and running with ZZIK LIVE in minutes!

## 🚀 Prerequisites

- **Node.js** 18.17 or higher
- **npm** or **yarn** package manager
- **Git** for version control

## 📥 Installation

### 1. Clone or Access the Repository

```bash
cd /home/user/webapp
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons
- All other dependencies

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## 🌐 Access the Live Demo

**Current Deployment**: https://3000-i7yp3yojfq5yxuz35b779-8f57ffe2.sandbox.novita.ai

## 📱 What to Explore

### 1. Pass Tab (Default Landing)
- Try the search bar
- Click on filter chips
- Scroll through the reels carousel
- View the mini map
- Click "전체 지도 보기" for full map

### 2. Offers Tab
- Switch between "전체", "새로온", "만료임박" filters
- Click "수락" to accept an offer
- Click "나중에" to dismiss
- Explore offer details

### 3. Scan Tab
- View the QR scanner interface
- Test camera permissions
- Try "수동 입력" for mock scanning
- See result handling

### 4. Wallet Tab
- View summary cards (Points, Stamps, Vouchers)
- Click "보유 체험권" to see vouchers
- Filter vouchers by status
- View expiring vouchers

## 🎨 Understanding the Design System

### Color Tokens
All colors use CSS variables for consistency:

```css
--text-primary    /* Main text */
--text-secondary  /* Secondary text */
--brand          /* Brand blue */
--success        /* Success green */
--warning        /* Warning orange */
--danger         /* Error red */
```

### Spacing
Based on 4px grid:

```css
--sp-1: 4px
--sp-2: 8px
--sp-3: 12px
--sp-4: 16px
--sp-6: 24px
```

### Usage Example

```tsx
<div className="p-[var(--sp-4)] bg-[var(--bg-base)]">
  <h1 className="text-[var(--text-primary)]">Title</h1>
</div>
```

## 📂 Key Files to Know

### Pages
- `app/(tabs)/pass/page.tsx` - Pass discovery page
- `app/(tabs)/offers/page.tsx` - Offers list
- `app/(tabs)/scan/page.tsx` - QR scanner
- `app/(tabs)/wallet/page.tsx` - Wallet home

### Components
- `components/navigation/BottomTabBar.tsx` - Main navigation
- `components/pass/SearchBar.tsx` - Search interface
- `components/offers/OfferCard.tsx` - Offer display
- `components/wallet/WalletSummary.tsx` - Wallet stats

### Utilities
- `lib/analytics.ts` - Event tracking system
- `lib/button-presets.ts` - Button style utilities
- `types/index.ts` - TypeScript definitions

## 🔧 Common Tasks

### Add a New Component

```bash
# Create component file
touch components/pass/NewComponent.tsx
```

```tsx
'use client';

interface NewComponentProps {
  // Define props
}

export default function NewComponent({ }: NewComponentProps) {
  return (
    <div className="p-[var(--sp-4)]">
      {/* Component content */}
    </div>
  );
}
```

### Add a New Page

```bash
# Create page directory and file
mkdir -p app/(tabs)/new-section
touch app/(tabs)/new-section/page.tsx
```

### Track an Analytics Event

```tsx
import { analytics } from '@/lib/analytics';

// In your component
const handleClick = () => {
  analytics.track('button_click', {
    button_name: 'example',
    page: '/pass'
  });
};
```

## 🎯 Testing Your Changes

### 1. Type Check

```bash
npm run build
```

This runs TypeScript compilation and checks for errors.

### 2. Lint Code

```bash
npm run lint
```

Checks code quality and style issues.

### 3. Visual Testing

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Navigate through all tabs
4. Test on different screen sizes (Chrome DevTools)
5. Test with keyboard navigation
6. Test with screen reader (if available)

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Dependencies Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### TypeScript Errors

Check `tsconfig.json` is properly configured and run:

```bash
npx tsc --noEmit
```

## 📚 Learning Resources

### Documentation
- **README.md** - Project overview and setup
- **ARCHITECTURE.md** - Technical architecture details
- **PROJECT_SUMMARY.md** - Feature completion status

### Next.js Resources
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [TypeScript with Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Dark Mode](https://tailwindcss.com/docs/dark-mode)

## 🔐 Environment Variables

Create `.env.local` for local development:

```env
# Required for production
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here

# Optional
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_ENABLE_MAPBOX=false
NEXT_PUBLIC_ENABLE_QR=true
```

## 🚢 Production Deployment

### Build for Production

```bash
npm run build
```

### Test Production Build Locally

```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

Or use Vercel CLI:

```bash
npm i -g vercel
vercel
```

### Deploy to Other Platforms

The app is a standard Next.js application and can be deployed to:
- Vercel (recommended)
- AWS Amplify
- Netlify
- Railway
- Your own server with Node.js

## 📊 Performance Tips

### During Development

1. Use React DevTools for component profiling
2. Monitor Network tab for API calls
3. Check Lighthouse scores regularly
4. Test on actual mobile devices

### Before Production

1. Enable compression
2. Optimize images
3. Minimize bundle size
4. Enable caching headers
5. Set up CDN

## 🎨 Customization

### Change Brand Colors

Edit `app/globals.css`:

```css
:root {
  --brand: #YOUR_COLOR;
  --brand-hover: #YOUR_HOVER_COLOR;
  --brand-active: #YOUR_ACTIVE_COLOR;
}
```

### Add New Animations

```css
@keyframes your-animation {
  from { /* start state */ }
  to { /* end state */ }
}

.animate-your-animation {
  animation: your-animation 300ms ease-out;
}
```

### Modify Navigation Tabs

Edit `components/navigation/BottomTabBar.tsx`:

```tsx
const tabs = [
  { id: 'pass', label: '체험권', icon: Ticket, path: '/pass' },
  // Add or modify tabs here
];
```

## 💡 Pro Tips

1. **Hot Reload**: Save files to see instant changes
2. **Component Isolation**: Test components in isolation first
3. **Type Safety**: Let TypeScript guide you with autocomplete
4. **Design Tokens**: Always use CSS variables, never hardcode values
5. **Analytics**: Track everything for future data-driven decisions
6. **Accessibility**: Test with keyboard-only navigation regularly

## 🆘 Getting Help

### Check These First
1. Console for error messages
2. Network tab for failed requests
3. TypeScript errors in your editor
4. ESLint warnings

### Common Issues & Solutions

**Issue**: "Cannot find module"  
**Solution**: Run `npm install`

**Issue**: "Port 3000 already in use"  
**Solution**: Kill process or use different port

**Issue**: Styles not updating  
**Solution**: Clear `.next` cache and restart

**Issue**: TypeScript errors  
**Solution**: Check imports and type definitions

## 🎯 Next Steps

Once you're comfortable with the basics:

1. **Backend Integration**: Connect to real API endpoints
2. **External Services**: Integrate Mapbox, QR scanner, etc.
3. **Testing**: Add unit and integration tests
4. **Optimization**: Profile and optimize performance
5. **Deployment**: Deploy to production environment

---

## ⚡ Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Check code quality

# Utilities
npx kill-port 3000   # Kill process on port
rm -rf .next         # Clear cache
git status           # Check git status
```

---

**Ready to build?** Start with `npm run dev` and open http://localhost:3000

**Questions?** Check the documentation files or examine the code - it's well-commented!

**Happy coding! 🚀**
