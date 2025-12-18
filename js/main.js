/**
 * Exhale Waitlist - Advanced Scroll Effects & Form Handling
 * Premium interactions with Lenis smooth scroll
 */

// ===========================================
// Configuration
// ===========================================
const CONFIG = {
    webhookUrl: 'https://greyai.app.n8n.cloud/webhook/ec0cd3e4-87b0-4d52-b23e-3d642f2e3b80'
};

// ===========================================
// Initialize on DOM Load
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    // initLenis(); // Disabled - causes scroll delay on GitHub Pages
    initParallax();
    initScrollReveal();
    initFormHandler('waitlistForm', 'emailInput', 'submitBtn', 'inputGroup', 'successMsg');
    initFormHandler('waitlistFormBottom', 'emailInputBottom', 'submitBtnBottom', 'inputGroupBottom', 'successMsgBottom');
    initCursorGlow();
});

// ===========================================
// Theme Toggle (Dark/Light Mode)
// ===========================================
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    // Check for saved preference or default to dark
    const savedTheme = localStorage.getItem('theme');

    // Default is dark mode (no class), light mode adds 'light-mode' class
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');

        // Update cursor glow color
        const glow = document.querySelector('.cursor-glow');
        if (glow) {
            if (isLight) {
                glow.style.background = 'radial-gradient(circle, rgba(13, 115, 119, 0.15) 0%, transparent 70%)';
            } else {
                glow.style.background = 'radial-gradient(circle, rgba(173, 251, 246, 0.15) 0%, transparent 70%)';
            }
        }
    });

    // Listen for system theme changes (only if no saved preference)
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('light-mode');
            } else {
                document.body.classList.remove('light-mode');
            }
        }
    });
}

// ===========================================
// Lenis Smooth Scroll
// ===========================================
let lenis;

function initLenis() {
    if (typeof Lenis === 'undefined') {
        console.warn('Lenis not loaded, using native scroll');
        return;
    }

    lenis = new Lenis({
        duration: 0.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
        wheelMultiplier: 1.2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                lenis.scrollTo(target, { offset: -40 });
            }
        });
    });
}

// ===========================================
// Parallax Effects - Lightweight
// ===========================================
function initParallax() {
    const heroContent = document.querySelector('.hero-content');

    // Only apply hero fade, skip orb parallax for performance
    if (!heroContent) return;

    let lastScrollY = 0;
    let ticking = false;

    const updateParallax = () => {
        const scrollY = lastScrollY;

        // Hero content fade on scroll (only in hero section)
        if (scrollY < window.innerHeight) {
            heroContent.style.opacity = Math.max(0, 1 - scrollY / 500);
        }

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        lastScrollY = window.pageYOffset;

        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });
}

// ===========================================
// Scroll Reveal Animations - Optimized
// ===========================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    // Lighter stagger delays for smoother feel
    const staggerConfig = {
        '.pain-card': 50,
        '.feature-card': 60,
        '.step': 80
    };

    Object.entries(staggerConfig).forEach(([selector, stagger]) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            el.style.transitionDelay = `${index * stagger}ms`;
        });
    });

    // Intersection Observer with better threshold
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.05
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Use requestAnimationFrame for smoother class addition
                requestAnimationFrame(() => {
                    entry.target.classList.add('revealed');
                });
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
}

// ===========================================
// Form Handler with Webhook
// ===========================================
function initFormHandler(formId, emailId, btnId, groupId, successId) {
    const form = document.getElementById(formId);
    const emailInput = document.getElementById(emailId);
    const submitBtn = document.getElementById(btnId);
    const inputGroup = document.getElementById(groupId);
    const successMsg = document.getElementById(successId);

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput?.value.trim();

        // Validate email
        if (!email || !isValidEmail(email)) {
            shakeElement(inputGroup);
            return;
        }

        // Update button state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                // Success - animate out form and show success
                inputGroup.style.transform = 'translateY(-10px)';
                inputGroup.style.opacity = '0';
                inputGroup.style.transition = 'all 0.4s ease';

                setTimeout(() => {
                    inputGroup.classList.add('hidden');
                    successMsg.classList.add('show');
                }, 400);
            } else {
                // Server returned an error
                const errorData = await response.json().catch(() => ({}));
                console.error('Webhook error:', errorData);
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            submitBtn.textContent = 'Try again';
            submitBtn.disabled = false;

            setTimeout(() => {
                submitBtn.textContent = originalText;
            }, 2000);
        }
    });
}

// ===========================================
// Cursor Glow Effect
// ===========================================
function initCursorGlow() {
    // Skip on touch devices
    if ('ontouchstart' in window) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateGlow() {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;

        glow.style.left = `${glowX}px`;
        glow.style.top = `${glowY}px`;

        requestAnimationFrame(animateGlow);
    }

    animateGlow();
}

// ===========================================
// Utility Functions
// ===========================================

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Shakes an element to indicate error
 * @param {HTMLElement} element - Element to shake
 */
function shakeElement(element) {
    if (!element) return;

    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both';

    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Add shake keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
        20%, 40%, 60%, 80% { transform: translateX(6px); }
    }
`;
document.head.appendChild(style);
