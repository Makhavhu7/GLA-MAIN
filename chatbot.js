function updateTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function toggleChatbot() {
    console.log('Toggling chatbot...');
    const chatbot = document.getElementById('chatbotContainer');
    const toggleButton = document.getElementById('toggleButton');
    
    if (!chatbot) {
        console.error('Chatbot container not found!');
        return;
    }
    if (!toggleButton) {
        console.error('Toggle button not found!');
        return;
    }
    
    console.log('Current chatbot classes:', chatbot.className);
    console.log('Has hidden class:', chatbot.classList.contains('hidden'));
    
    if (chatbot.classList.contains('hidden')) {
        console.log('Showing chatbot...');
        chatbot.classList.remove('hidden');
        toggleButton.classList.remove('visible');
    } else {
        console.log('Hiding chatbot...');
        chatbot.classList.add('hidden');
        toggleButton.classList.add('visible');
    }
    
    console.log('New chatbot classes:', chatbot.className);
}

// Function to show the chatbot on specific pages
export function showChatbot() {
    console.log('Showing chatbot');
    const toggleButton = document.getElementById('toggleButton');
    if (toggleButton) {
        toggleButton.classList.add('visible');
    }
}

let conversationHistory = [];

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing chatbot');
    // Initialize lucide icons for the entire page
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
        console.log('Lucide icons created');
    } else {
        console.warn('Lucide library not available');
    }
    updateTime();
    setInterval(updateTime, 60000);
});

async function checkRateLimit() {
    // Rate limiting is now handled by OpenRouter - just return true
    return true;
}
// Conversation history and caching functionality removed - using OpenRouter API directly

function stripHtmlTags(text) {
    return text.replace(/<[^>]*>/g, '');
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripMarkdown(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1 ($2)')
        .replace(/#+\s*/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function formatAnswer(rawAnswer) {
    const noHtml = stripHtmlTags(rawAnswer || '');
    const normalized = noHtml.replace(/\r\n/g, '\n');

    const body = normalized
        // Remove all source/metadata indicators
        .replace(/based\s+solely\s+on\s+the\s+provided\s+context\s*:?\s*/gi, '')
        .replace(/\*\*\s*source\s*\*\*\s*:\s*.*$/gmi, '')
        .replace(/^\s*source\s*:\s*.*$/gmi, '')
        .replace(/<p><strong>source<\/strong>:.*?<\/p>/gi, '')
        .replace(/\[source[^\]]*\]/gi, '')
        .replace(/\(source:[^)]*\)/gi, '')
        .replace(/source:\s+[^.\n]*\.?/gi, '')
        .replace(/source\s*:\s*\S+.*?(?=\n|$)/gi, '')
        // Remove note/error messages that expose system info
        .replace(/\*\*note\*\*:?\s*this\s+is\s+a\s+fallback\s+response.*?contact\s+info@gritlabafrica\.org\.?/gi, '')
        .replace(/note:\s*this\s+is\s+a\s+fallback.*?contact\s+.*?\.?/gi, '')
        .replace(/http\s+error!?\s+status:\s*\d+/gi, '')
        .replace(/for\s+more\s+details,\s+contact\s+.*?\.?/gi, '')
        // Remove suggestion/fallback prompts
        .replace(/please\s+try\s+again\s+or\s+ask\s+about\s+grit\s+lab\s+africa'?s\s+programs,\s+benefits,\s+awards,\s+certificates,\s+team,\s+or\s+projects\.?/gi, '')
        .replace(/please\s+try\s+again\s+or\s+ask\s+about.*?\.?$/gmi, '')
        // Remove PDF references and document names
        .replace(/MGSLG_PGDip_Module_\d+__.*?\.pdf.*?(?=\n|$)/gi, '')
        .replace(/\.pdf.*?(?:\n|$)/gi, '')
        .replace(/page\s+\d+/gi, '')
        // Remove metadata about provided context
        .replace(/the\s+provided\s+context\s*[:,]?\s*/gi, '')
        .replace(/according\s+to\s+the\s+context\s*[:,]?\s*/gi, '')
        // Remove recommendation/suggestion phrases
        .replace(/i\s+recommend\s+contacting\s+grit\s+lab\s+africa.*?(?=\n|$)/gi, '')
        .replace(/they\s+can\s+provide\s+the\s+most\s+reliable\s+information.*?(?=\n|$)/gi, '')
        .replace(/you\s+may\s+want\s+to\s+contact.*?(?=\n|$)/gi, '')
        // Remove URLs
        .replace(/https?:\/\/[^\s]+/gi, '')
        .replace(/www\.[^\s]+/gi, '')
        // Clean up excessive line breaks
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    const plainBody = stripMarkdown(body || '');
    const bodyHtml = escapeHtml(plainBody).replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
    return `<div class="answer-body">${bodyHtml}</div>`;
}


async function handleSendMessage(event) {
    console.log('handleSendMessage triggered');
    event.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    console.log('Message input:', message);
    if (!message) {
        console.log('Empty message, exiting');
        return;
    }

    const userId = 'anonymous-user';
    const messagesContainer = document.getElementById('chatMessages');
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.innerHTML = `
        <div class="avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        </div>
        <div class="message-content">
            ${message}
        </div>
    `;
    messagesContainer.appendChild(userMessage);
    input.value = '';
    console.log('User message appended');

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = `
        <div class="avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        </div>
        <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    messagesContainer.appendChild(loadingSpinner);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    console.log('Loading spinner added');

    await new Promise(resolve => setTimeout(resolve, 1500));

    let answer = '';
    const normalizedQuery = message.toLowerCase().trim();
    console.log('Normalized query:', normalizedQuery);

    try {
        console.log('Fetching from OpenRouter API');
        
        const models = [
            'anthropic/claude-opus-4.6',
            'liquid/lfm-2.5-1.2b-thinking:free',
            'upstage/solar-pro-3:free',
            'arcee-ai/trinity-large-preview:free',
            'sourceful/riverflow-v2-pro'
        ];

        let apiResponse = null;
        let success = false;

        for (const model of models) {
            try {
                apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer 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',
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://www.gritlabafrica.org',
                        'X-Title': 'GRIT Lab Africa Chatbot'
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { 
                                role: 'system', 
                                content: `You are a helpful assistant for GRIT Lab Africa. Here is the official information from gritlabafrica.org:

ABOUT GRIT Lab Africa:
- Founded in 2016 by Professor Abejide Ade-Ibijola
- Mission: Offer free training in computer programming skills and mentoring in mindset, discipline, and GRIT to young people throughout Africa
- Vision: Create an inclusive space training diverse young Africans to become champions in computer programming and develop strong characters
- Training focus: Technical skills in computer programming AND character development
- Has trained hundreds of young Africans in technical skills over 5 years
- Mentors 116 young people across 38 higher institutions in 11 African countries
- Non-profit program for young Africans across Africa

FOUNDER & LEADERSHIP:
- Founder: Professor Abejide Ade-Ibijola (also called Abejide)

PROGRAMS:
- Free training in computer programming
- Character development and mindset training
- GRIT (determination, resilience) development
- Mentoring programs

ACHIEVEMENTS:
- Graduates have found jobs in South Africa's technology industry
- Graduates have started their own tech ventures
- Built a strong community of problem-solvers and innovators across the continent
- Applications open February 9th, 2026

KINGSMAN ACADEMIC:
- An identity symbolizing a person who can transcend societal divisions, continuously acquire future-fit skills, solve for society using technology, and help others

CONTACT:
- Email: info@gritlabafrica.org
- Website: https://www.gritlabafrica.org

IMPORTANT: Only answer questions based on this official information. If asked about something not listed here, say "I don't have that specific information on the GRIT Lab Africa website. Please contact info@gritlabafrica.org for more details."` 
                            },
                            { 
                                role: 'user', 
                                content: message 
                            }
                        ],
                        max_tokens: 500
                    })
                });
                
                if (apiResponse.ok) {
                    const data = await apiResponse.json();
                    answer = data.choices[0].message.content;
                    success = true;
                    break;
                }
            } catch (err) {
                console.error(`Model ${model} failed:`, err.message);
                continue;
            }
        }

        if (!answer) {
            answer = 'Sorry, I could not process your request. Please try again later or contact info@gritlabafrica.org';
        }

        answer = DOMPurify.sanitize(formatAnswer(answer));
    } catch (error) {
        console.error('Error in handleSendMessage:', error.message);
        answer = DOMPurify.sanitize(formatAnswer(`
            Error retrieving information: ${error.message}.
        `));
    }

    const botMessage = document.createElement('div');
    botMessage.className = 'message bot';
    botMessage.innerHTML = `
        <div class="avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        </div>
        <div class="message-content">
            ${answer}
        </div>
    `;
    messagesContainer.removeChild(loadingSpinner);
    messagesContainer.appendChild(botMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Re-initialize lucide icons for the new SVG elements
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    console.log('Bot message appended');
}

function handleKeyPress(event) {
    console.log('handleKeyPress triggered, key:', event.key);
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage(event);
    }
}

function setInput(text) {
    console.log('Setting input:', text);
    document.getElementById('chatInput').value = text;
}

function copyMessage(content) {
    console.log('Copying message:', content);
    navigator.clipboard.writeText(content.replace(/<[^>]+>/g, '')).then(() => {
        alert('Message copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

function handleReaction(id, reaction) {
    console.log('Handling reaction:', { id, reaction });
    const button = event.target.closest('button');
    if (reaction === 'like') {
        button.style.color = button.style.color === 'rgb(74, 222, 128)' ? '' : '#4ade80';
    } else {
        button.style.color = button.style.color === 'rgb(248, 113, 113)' ? '' : '#f87171';
    }
    alert(reaction === 'like' ? 'Thanks for the feedback!' : 'Feedback received');
}

// Suggestions data
const suggestions = [
    'What is GRIT Lab Africa?',
    'Who founded GRIT Lab Africa?',
    'What programs does GRIT Lab Africa offer?',
    'What skills can I get from GRIT Lab Africa?',
    'How do I apply to GRIT Lab Africa?',
    'What are the benefits of GRIT Lab Africa?',
    'Tell me about GRIT Lab Africa awards',
    'What certificates does GRIT Lab Africa provide?',
    'Who are the team members?',
    'What projects has GRIT Lab Africa completed?',
];

// Show suggestions based on input
function showSuggestions(inputValue) {
    const suggestionsContainer = document.getElementById('suggestionsDropdown');
    
    // If suggestions container doesn't exist, just return
    if (!suggestionsContainer) {
        return;
    }
    
    if (!inputValue || inputValue.trim().length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    if (filtered.length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    suggestionsContainer.innerHTML = filtered
        .slice(0, 5)
        .map(s => `<div class="suggestion-item" data-suggestion="${s}">${s}</div>`)
        .join('');
    
    suggestionsContainer.classList.add('show');
    
    // Add click handlers to suggestion items
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const suggestionText = item.getAttribute('data-suggestion');
            document.getElementById('chatInput').value = suggestionText;
            suggestionsContainer.classList.remove('show');
            document.getElementById('chatInput').focus();
        });
    });
}

// Handle input changes for suggestions
function handleInputChange(event) {
    showSuggestions(event.target.value);
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    const toggleButton = document.getElementById('toggleButton');
    if (toggleButton) {
        console.log('Attaching click listener to toggleButton');
        toggleButton.addEventListener('click', toggleChatbot);
    } else {
        console.error('Toggle button not found!');
    }
    
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        console.log('Attaching submit listener to chatForm');
        chatForm.addEventListener('submit', handleSendMessage);
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        console.log('Attaching input listeners to chatInput');
        chatInput.addEventListener('keypress', handleKeyPress);
        chatInput.addEventListener('input', handleInputChange);
    }
    
    // Only try to handle suggestions if the container exists
    const suggestionsContainer = document.getElementById('suggestionsDropdown');
    if (suggestionsContainer) {
        console.log('Attaching click listener for suggestions');
        document.addEventListener('click', (event) => {
            if (chatInput && !chatInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
                suggestionsContainer.classList.remove('show');
            }
        });
    }

    const copyButtons = document.querySelectorAll('.copy-message');
    if (copyButtons.length > 0) {
        console.log('Attaching listeners to copy buttons');
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const content = button.closest('.message-content').innerHTML;
                copyMessage(content);
            });
        });
    }

    
    
    console.log('Event listeners initialized successfully');
}

// Make functions globally accessible for inline scripts
window.toggleChatbot = toggleChatbot;
window.handleSendMessage = handleSendMessage;
window.handleInputChange = handleInputChange;
window.handleKeyPress = handleKeyPress;
window.copyMessage = copyMessage;
window.handleReaction = handleReaction;

// Initialize event listeners only if not already initialized by inline scripts
function initializeModuleListeners() {
    // Check if toggle button already has listeners (from inline scripts)
    const toggleButton = document.getElementById('toggleButton');
    if (toggleButton && !toggleButton._moduleListenersAdded) {
        console.log('Attaching module listeners...');
        initializeEventListeners();
        toggleButton._moduleListenersAdded = true;
    }
}

// Wait for DOM to be fully loaded before initializing event listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModuleListeners);
} else {
    // DOM is already loaded
    initializeModuleListeners();
}

console.log('Chatbot module loaded');
