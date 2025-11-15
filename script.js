document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dateWidget = document.getElementById('dateWidget');
    const shareButton = document.getElementById('shareButton');
    const diaryEntry = document.getElementById('diaryEntry');
    const historyButton = document.getElementById('historyButton');
    const historyPanel = document.getElementById('historyPanel');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('closeHistory');
    const ideasList = document.getElementById('ideasList');
    const noteModal = document.getElementById('noteModal');
    const modalMood = document.getElementById('modalMood');
    const modalDate = document.getElementById('modalDate');
    const modalText = document.getElementById('modalText');
    const modalEdit = document.getElementById('modalEdit');
    const modalDelete = document.getElementById('modalDelete');

    // State
    let selectedMood = '';
    let ideas = JSON.parse(localStorage.getItem('ideas') || '[]');

    // Initialize date
    dateWidget.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Modal Functions
    function openNoteModal(idea) {
        modalMood.className = 'mood-badge';
        modalMood.dataset.mood = idea.mood;
        modalMood.innerHTML = `
            <i class="fas fa-${getMoodIcon(idea.mood)}"></i>
            ${idea.mood.charAt(0).toUpperCase() + idea.mood.slice(1)}
        `;
        
        modalDate.innerHTML = `
            <i class="far fa-calendar"></i>
            ${new Date(idea.date).toLocaleDateString()}
        `;
        
        modalText.textContent = idea.text;
        
        modalEdit.onclick = () => editIdea(idea.id);
        modalDelete.onclick = () => deleteIdea(idea.id);
        
        noteModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeNoteModal() {
        noteModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Sidebar Functions
    function openSidebar() {
        historyPanel.classList.add('open');
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        renderIdeas();
    }

    function closeSidebar() {
        historyPanel.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    // Notification System
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Mood Icons
    const getMoodIcon = (mood) => {
        const icons = {
            happy: 'smile',
            sad: 'frown',
            neutral: 'meh',
            excited: 'grin-stars'
        };
        return icons[mood] || 'smile';
    };

    // Render Ideas List
    // Update renderIdeas function
const renderIdeas = () => {
    ideasList.innerHTML = ideas.map(idea => {
        const text = idea.text;
        const isLong = text.length > 150;
        const truncatedText = isLong ? text.slice(0, 150) + '...' : text;
        
        return `
            <div class="idea-card" data-id="${idea.id}">
                <div class="mood-badge" data-mood="${idea.mood}">
                    <i class="fas fa-${getMoodIcon(idea.mood)}"></i>
                    ${idea.mood.charAt(0).toUpperCase() + idea.mood.slice(1)}
                </div>
                <div class="idea-date">
                    <i class="far fa-calendar"></i>
                    ${new Date(idea.date).toLocaleDateString()}
                </div>
                <div class="idea-text">${truncatedText}</div>
                ${isLong ? '<div class="read-more">Read more</div>' : ''}
                <div class="idea-actions">
                    <button class="edit-btn" onclick="editIdea(${idea.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteIdea(${idea.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.idea-card').forEach(card => {
        const textDiv = card.querySelector('.idea-text');
        const readMoreBtn = card.querySelector('.read-more');
        
        if (readMoreBtn) {
            readMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = card.dataset.id;
                const idea = ideas.find(i => i.id.toString() === id);
                
                if (card.classList.contains('expanded')) {
                    card.classList.remove('expanded');
                    textDiv.textContent = idea.text.slice(0, 150) + '...';
                    readMoreBtn.textContent = 'Read more';
                } else {
                    card.classList.add('expanded');
                    textDiv.textContent = idea.text;
                    readMoreBtn.textContent = 'Show less';
                }
            });
        }

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.idea-actions') && !e.target.closest('.read-more')) {
                const id = card.dataset.id;
                const idea = ideas.find(i => i.id.toString() === id);
                openNoteModal(idea);
            }
        });
    });
};

    // Save Idea
    const saveIdea = async (text) => {
        if (!text.trim()) {
            showNotification('Please write something first!', 'error');
            return;
        }
        
        if (!selectedMood) {
            showNotification('Please select your mood first!', 'error');
            return;
        }

        const idea = {
            id: Date.now(),
            text: text.trim(),
            mood: selectedMood,
            date: new Date().toISOString()
        };

        // Save to localStorage
        ideas.unshift(idea);
        localStorage.setItem('ideas', JSON.stringify(ideas));

        // Send to Discord webhook
        const webhook = "https://discord.com/api/webhooks/1409163939396325463/zycl8I4LSmEH6i11qXjTk4E7xIKJ5EAbaaLikjzV9ZwJ7zshj9NFQaWoB-aFI7FC3kaT";
        try {
            await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: `New idea (${selectedMood}): ${text}`
                })
            });
            showNotification('Idea saved successfully!');
        } catch (error) {
            console.error('Failed to send idea:', error);
            showNotification('Saved locally but failed to sync', 'error');
        }

        diaryEntry.value = '';
        selectedMood = '';
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        renderIdeas();
    };

    // Global functions for HTML onclick
    window.editIdea = (id) => {
        const idea = ideas.find(i => i.id === id);
        if (idea) {
            const newText = prompt('Edit your idea:', idea.text);
            if (newText && newText.trim()) {
                idea.text = newText.trim();
                localStorage.setItem('ideas', JSON.stringify(ideas));
                renderIdeas();
                showNotification('Idea updated successfully!');
                closeNoteModal();
            }
        }
    };

    window.deleteIdea = (id) => {
        if (confirm('Are you sure you want to delete this idea?')) {
            ideas = ideas.filter(i => i.id !== id);
            localStorage.setItem('ideas', JSON.stringify(ideas));
            renderIdeas();
            showNotification('Idea deleted successfully!');
            closeNoteModal();
        }
    };

    // Event Listeners
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMood = btn.dataset.mood;
            showNotification(`Mood selected: ${selectedMood}`);
        });
    });

    historyButton.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    shareButton.addEventListener('click', () => saveIdea(diaryEntry.value));

    // Modal close handlers
    document.querySelector('.close-modal-btn').addEventListener('click', closeNoteModal);
    noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) closeNoteModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeNoteModal();
    });

    // Initial render
    renderIdeas();
});