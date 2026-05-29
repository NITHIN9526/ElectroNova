// js/app.js

document.addEventListener('DOMContentLoaded', async () => {
    const gallery = document.querySelector('.gallery');
    const loaderContainer = document.getElementById('loader-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    let allProjects = [];

    // Show loader
    loaderContainer.style.display = 'flex';

    if (!checkConfig()) {
        // Render demo data if Supabase isn't configured yet
        loaderContainer.style.display = 'none';
        allProjects = getDemoProjects();
        renderProjects(allProjects, gallery);
        setupSearch();
        return;
    }

    try {
        // Fetch projects from Supabase Database
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
            gallery.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1; text-align:center;">Failed to load projects. Please try again later.</p>';
            return;
        }

        allProjects = projects;

        if (projects.length === 0) {
            gallery.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1; text-align:center;">No projects found. Add some from the admin panel!</p>';
        } else {
            renderProjects(allProjects, gallery);
            setupSearch();
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        loaderContainer.style.display = 'none';
    }

    function setupSearch() {
        if (!searchInput) return;

        const performSearch = () => {
            const query = searchInput.value.toLowerCase().trim();
            const filtered = allProjects.filter(p => {
                const titleMatch = p.title?.toLowerCase().includes(query);
                const descMatch = p.description?.toLowerCase().includes(query);
                const compMatch = p.components?.toLowerCase().includes(query);
                return titleMatch || descMatch || compMatch;
            });

            if (filtered.length === 0) {
                gallery.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1; text-align:center;">No matching projects found.</p>';
            } else {
                renderProjects(filtered, gallery);
            }
        };

        searchInput.addEventListener('input', performSearch);
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
    }
});

function renderProjects(projects, container) {
    container.innerHTML = ''; // Clear container

    projects.forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';

        // Extract media array or fallback to old schema
        let mediaArray = [];
        if (project.media && Array.isArray(project.media) && project.media.length > 0) {
            mediaArray = project.media;
        } else if (project.media_url) {
            mediaArray = [{ url: project.media_url, type: project.media_type }];
        } else {
            mediaArray = [{ url: 'https://via.placeholder.com/400x300?text=No+Media', type: 'image/jpeg' }];
        }

        // Build HTML for the scrolling gallery
        let mediaGalleryHTML = '<div class="media-gallery">';
        mediaArray.forEach(m => {
            if (m.type && m.type.startsWith('video')) {
                mediaGalleryHTML += `<video class="project-media" src="${m.url}" controls muted></video>`;
            } else {
                mediaGalleryHTML += `<img class="project-media" src="${m.url}" alt="${escapeHTML(project.title)}" loading="lazy">`;
            }
        });
        mediaGalleryHTML += '</div>';

        // Format Date
        const dateObj = new Date(project.created_at || Date.now());
        const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        card.innerHTML = `
            ${mediaGalleryHTML}
            <div class="project-info">
                <a href="project.html?id=${project.id}" style="text-decoration:none; color:inherit;">
                    <h3 class="project-title">${escapeHTML(project.title)}</h3>
                </a>
                <p class="project-desc">${escapeHTML(project.description).substring(0, 100)}...</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                    <span class="project-date">${formattedDate}</span>
                    <a href="project.html?id=${project.id}" style="color:var(--accent-color); text-decoration:none; font-weight:600; font-size:0.9rem;">View Details &rarr;</a>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// Utility to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

// Get demo projects
function getDemoProjects() {
    return [
        {
            title: "IoT Smart Home Hub",
            description: "A custom ESP32-based smart home controller with a responsive web interface.",
            media: [
                { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" },
                { url: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" }
            ],
            components: "ESP32, Relay Module, DHT11 Temp Sensor",
            created_at: new Date().toISOString()
        },
        {
            title: "Automated Drone",
            description: "Quadcopter flight controller programmed from scratch using STM32.",
            media: [
                { url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" }
            ],
            components: "STM32, MPU6050 Gyro, Brushless Motors",
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            title: "Arduino Robot Arm",
            description: "A 6-axis robotic arm controlled via a custom desktop application.",
            media: [
                { url: "https://images.unsplash.com/photo-1580584126903-c17d41830450?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" }
            ],
            components: "Arduino Uno, MG996R Servos, Acrylic chassis",
            created_at: new Date(Date.now() - 172800000).toISOString()
        }
    ];
}

// Contact Form - Telegram Bot / Terminal Console Integration
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const consoleResponse = document.getElementById('console-response');
    const submitBtn = document.getElementById('comms-submit-btn');

    if (contactForm && consoleResponse) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            // Prevent double submission
            submitBtn.disabled = true;
            
            // Set initial connection progress state
            consoleResponse.className = 'console-status progress';
            consoleResponse.innerHTML = `
                <span class="status-marker purple">●</span>
                <span class="status-text">TRANSMIT_PROGRESS: Establishing secure handshake...</span>
            `;

            // CONFIGURATION: Enter your Telegram credentials here
            const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';
            const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';

            // Check if user has configured credentials, otherwise run simulation fallback
            if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN' || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
                runSimulationFallback(name, email, message);
                return;
            }

            try {
                // Update console status to sending packet
                setTimeout(() => {
                    consoleResponse.innerHTML = `
                        <span class="status-marker purple">●</span>
                        <span class="status-text">TRANSMIT_PROGRESS: Packaging & routing telemetry payloads...</span>
                    `;
                }, 800);

                // Format Markdown message text for Telegram bot
                const textMessage = `🔌 *New Comms Telemetry Received!*\n\n` +
                                    `👤 *Sender Name:* \`${name}\`\n` +
                                    `✉️ *Routing Addr:* \`${email}\`\n\n` +
                                    `📝 *Payload Message:*\n"${message}"`;

                const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
                
                const response = await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: textMessage,
                        parse_mode: 'Markdown'
                    })
                });

                const result = await response.json();

                if (response.ok && result.ok) {
                    setTimeout(() => {
                        consoleResponse.className = 'console-status success';
                        consoleResponse.innerHTML = `
                            <span class="status-marker green">●</span>
                            <span class="status-text">TRANSMISSION SUCCESSFUL: Package routed to Nithin's pager. Thank you, ${escapeHTML(name)}!</span>
                        `;
                        contactForm.reset();
                        submitBtn.disabled = false;
                    }, 1800);
                } else {
                    throw new Error(result.description || 'API Error');
                }
            } catch (err) {
                console.error('Telegram Transmission Failed:', err);
                setTimeout(() => {
                    consoleResponse.className = 'console-status error';
                    consoleResponse.innerHTML = `
                        <span class="status-marker purple">●</span>
                        <span class="status-text">TRANSMISSION FAILED: Network error. Falling back to local terminal...</span>
                    `;
                    // Run visual fallback on failure so user is not blocked
                    setTimeout(() => {
                        runSimulationFallback(name, email, message);
                    }, 1500);
                }, 800);
            }
        });
    }

    // Elegant simulated terminal bootloader fallback for local/demo runs
    function runSimulationFallback(name, email, message) {
        setTimeout(() => {
            consoleResponse.innerHTML = `
                <span class="status-marker purple">●</span>
                <span class="status-text">TRANSMIT_PROGRESS: Direct link offline. Simulating local packet route...</span>
            `;
        }, 1000);

        setTimeout(() => {
            consoleResponse.className = 'console-status success';
            consoleResponse.innerHTML = `
                <span class="status-marker green">●</span>
                <span class="status-text">TRANSMISSION SIMULATED: Data packet logged locally. Thank you, ${escapeHTML(name)}!</span>
            `;
            contactForm.reset();
            submitBtn.disabled = false;
        }, 2800);
    }
});


