// Tutorial Page JavaScript
class TutorialManager {
    constructor() {
        this.currentTab = 'rps-tutorial';
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupFAQAccordion();
        this.setupAnimations();
        this.preventSpaceScroll();
    }

    setupTabNavigation() {
        const tutorialTabs = document.querySelectorAll('.tutorial-tab');
        const tutorialSections = document.querySelectorAll('.tutorial-section');
        
        tutorialTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Update active tab
                tutorialTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding section
                tutorialSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === tabId) {
                        section.classList.add('active');
                        this.currentTab = tabId;
                    }
                });
                
                // Smooth scroll to top of section
                document.querySelector('.tutorial-content').scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    }

    setupFAQAccordion() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                const isActive = faqItem.classList.contains('active');
                
                // Close all other FAQ items
                document.querySelectorAll('.faq-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Toggle current item
                if (!isActive) {
                    faqItem.classList.add('active');
                }
            });
        });
    }

    setupAnimations() {
        // Add smooth animations to tutorial cards
        const tutorialCards = document.querySelectorAll('.tutorial-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        tutorialCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });
        
        // Add hover effect to rule visuals
        const ruleItems = document.querySelectorAll('.rule-item');
        
        ruleItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.05)';
                item.style.transition = 'transform 0.3s ease';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
            });
        });
        
        // Add hover effect to difficulty badges
        const difficultyLevels = document.querySelectorAll('.difficulty-level');
        
        difficultyLevels.forEach(level => {
            level.addEventListener('mouseenter', () => {
                level.style.transform = 'translateY(-3px)';
                level.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
            });
            
            level.addEventListener('mouseleave', () => {
                level.style.transform = 'translateY(0)';
                level.style.boxShadow = 'none';
            });
        });
    }

    preventSpaceScroll() {
        // Prevent spacebar from scrolling the page
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
            }
        });
    }

    // Method to programmatically switch tabs
    switchToTab(tabId) {
        const tab = document.querySelector(`[data-tab="${tabId}"]`);
        if (tab) {
            tab.click();
        }
    }

    // Method to expand specific FAQ
    expandFAQ(index) {
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems[index]) {
            faqItems[index].classList.add('active');
        }
    }
}

// Additional interactive features for tutorial page
function addInteractiveElements() {
    // Make tutorial numbers clickable with a fun effect
    const tutorialNumbers = document.querySelectorAll('.tutorial-number');
    
    tutorialNumbers.forEach(number => {
        number.style.cursor = 'pointer';
        number.addEventListener('click', () => {
            number.style.transform = 'scale(1.2)';
            number.style.color = 'white';
            setTimeout(() => {
                number.style.transform = 'scale(1)';
            }, 300);
        });
    });
    
    // Add copy code functionality for room codes example
    const codeExamples = document.querySelectorAll('code');
    codeExamples.forEach(code => {
        code.style.cursor = 'pointer';
        code.title = 'Click to copy';
        code.addEventListener('click', async () => {
            const text = code.textContent;
            try {
                await navigator.clipboard.writeText(text);
                showCopyFeedback('Code copied to clipboard!');
            } catch (err) {
                console.log('Failed to copy: ', err);
            }
        });
    });
    
    // Add keyboard shortcuts info
    addKeyboardShortcutsInfo();
}

function showCopyFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--gradient);
        color: white;
        padding: 10px 20px;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInUp 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => {
            if (feedback.parentNode) {
                document.body.removeChild(feedback);
            }
        }, 300);
    }, 2000);
}

function addKeyboardShortcutsInfo() {
    // This could be expanded to show keyboard shortcuts for games
    console.log('⌨️ Keyboard shortcuts available on games page');
    
    // Add animation for keyboard keys in tutorial
    const keyElements = document.querySelectorAll('.key');
    keyElements.forEach(key => {
        key.addEventListener('mouseenter', () => {
            key.style.transform = 'translateY(-3px)';
            key.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        });
        
        key.addEventListener('mouseleave', () => {
            key.style.transform = 'translateY(0)';
            key.style.boxShadow = 'none';
        });
    });
}

// Initialize tutorial page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tutorialManager = new TutorialManager();
    
    // Check if there's a hash in URL to navigate to specific section
    const hash = window.location.hash;
    if (hash) {
        const tabId = hash.replace('#', '') + '-tutorial';
        tutorialManager.switchToTab(tabId);
    }
    
    // Add some console messages for fun
    console.log('📚 GameHub Tutorials Loaded!');
    console.log('💡 Pro Tip: Click on FAQ questions to expand answers');
    console.log('🎮 Ready to play? Head to the Games page!');
    
    // Add interactive elements to tutorial cards
    addInteractiveElements();
    
    // Add CSS animations
    addAnimations();
});

function addAnimations() {
    // Add custom animations for tutorial page
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(20px);
                opacity: 0;
            }
        }
        
        .key {
            display: inline-block;
            padding: 5px 10px;
            background: var(--bg-secondary);
            border-radius: 5px;
            font-family: monospace;
            font-weight: bold;
            margin: 0 2px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
}
