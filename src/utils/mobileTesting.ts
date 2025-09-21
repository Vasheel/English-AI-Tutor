// Mobile testing utilities for LearnQuest
export const testMobileCompatibility = () => {
  console.log('📱 Testing Mobile Compatibility...');
  
  // Test viewport configuration
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const content = viewport.getAttribute('content');
    console.log('✅ Viewport meta tag found:', content);
    
    if (content?.includes('width=device-width')) {
      console.log('✅ Responsive viewport configured');
    } else {
      console.log('❌ Viewport not properly configured');
    }
  } else {
    console.log('❌ Viewport meta tag missing');
  }
  
  // Test touch-friendly button sizes
  const buttons = document.querySelectorAll('button, .btn, [role="button"]');
  let touchFriendlyButtons = 0;
  
  buttons.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    const minSize = 44; // Minimum touch target size
    
    if (rect.width >= minSize && rect.height >= minSize) {
      touchFriendlyButtons++;
    }
  });
  
  const touchFriendlyPercentage = (touchFriendlyButtons / buttons.length) * 100;
  console.log(`📊 Touch-friendly buttons: ${touchFriendlyButtons}/${buttons.length} (${touchFriendlyPercentage.toFixed(1)}%)`);
  
  // Test responsive breakpoints
  const currentWidth = window.innerWidth;
  console.log(`📏 Current viewport width: ${currentWidth}px`);
  
  if (currentWidth < 768) {
    console.log('📱 Mobile viewport detected');
  } else if (currentWidth < 1024) {
    console.log('💻 Tablet viewport detected');
  } else {
    console.log('🖥️ Desktop viewport detected');
  }
  
  // Test mobile navigation
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (mobileMenu) {
    console.log('✅ Mobile navigation menu found');
  } else {
    console.log('⚠️ Mobile navigation menu not found');
  }
  
  // Test PWA features
  if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker support available');
  }
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ Running as PWA');
  }
  
  // Test touch events
  if ('ontouchstart' in window) {
    console.log('✅ Touch events supported');
  }
  
  // Test mobile-specific CSS
  const mobileStyles = document.querySelector('link[href*="mobile.css"]');
  if (mobileStyles) {
    console.log('✅ Mobile CSS loaded');
  }
  
  console.log('\n📱 Mobile compatibility test completed!');
  return {
    viewportConfigured: !!viewport,
    touchFriendlyButtons: touchFriendlyPercentage,
    currentWidth,
    hasMobileMenu: !!mobileMenu,
    pwaSupport: 'serviceWorker' in navigator,
    touchSupport: 'ontouchstart' in window
  };
};

// Test responsive design
export const testResponsiveDesign = () => {
  console.log('📐 Testing Responsive Design...');
  
  const testBreakpoints = [
    { name: 'Mobile', width: 375 },
    { name: 'Tablet', width: 768 },
    { name: 'Desktop', width: 1024 },
    { name: 'Large Desktop', width: 1440 }
  ];
  
  testBreakpoints.forEach(breakpoint => {
    // Simulate different screen sizes
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: breakpoint.width,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    console.log(`📱 Testing ${breakpoint.name} (${breakpoint.width}px):`);
    
    // Check if layout adapts properly
    const container = document.querySelector('.container');
    if (container) {
      const containerWidth = container.getBoundingClientRect().width;
      console.log(`  Container width: ${containerWidth}px`);
    }
    
    // Restore original width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    });
  });
  
  console.log('✅ Responsive design test completed!');
};

// Test mobile performance
export const testMobilePerformance = () => {
  console.log('⚡ Testing Mobile Performance...');
  
  // Test image loading
  const images = document.querySelectorAll('img');
  let loadedImages = 0;
  
  images.forEach(img => {
    if (img.complete && img.naturalHeight !== 0) {
      loadedImages++;
    }
  });
  
  console.log(`🖼️ Images loaded: ${loadedImages}/${images.length}`);
  
  // Test CSS animations
  const animatedElements = document.querySelectorAll('[style*="animation"], .animate-*');
  console.log(`🎬 Animated elements: ${animatedElements.length}`);
  
  // Test network requests
  if ('performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log(`🌐 Page load time: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
    }
  }
  
  console.log('✅ Performance test completed!');
};

// Run all mobile tests
export const runMobileTests = () => {
  console.log('🚀 Starting Mobile Compatibility Tests...\n');
  
  try {
    const compatibilityResults = testMobileCompatibility();
    console.log('\n');
    testResponsiveDesign();
    console.log('\n');
    testMobilePerformance();
    
    console.log('\n📊 Mobile Test Summary:');
    console.log('='.repeat(40));
    console.log(`Viewport Configured: ${compatibilityResults.viewportConfigured ? '✅' : '❌'}`);
    console.log(`Touch-Friendly Buttons: ${compatibilityResults.touchFriendlyButtons.toFixed(1)}%`);
    console.log(`Current Width: ${compatibilityResults.currentWidth}px`);
    console.log(`Mobile Menu: ${compatibilityResults.hasMobileMenu ? '✅' : '❌'}`);
    console.log(`PWA Support: ${compatibilityResults.pwaSupport ? '✅' : '❌'}`);
    console.log(`Touch Support: ${compatibilityResults.touchSupport ? '✅' : '❌'}`);
    
    console.log('\n✅ All mobile tests completed successfully!');
    return compatibilityResults;
  } catch (error) {
    console.error('❌ Mobile test failed:', error);
    return null;
  }
};
