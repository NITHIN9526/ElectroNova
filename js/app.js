// js/app.js

document.addEventListener('DOMContentLoaded', async () => {
    const gallery = document.querySelector('.gallery');
    const loaderContainer = document.getElementById('loader-container');

    // Show loader
    loaderContainer.style.display = 'flex';

    if (!checkConfig()) {
        // Render demo data if Supabase isn't configured yet
        loaderContainer.style.display = 'none';
        renderDemoProjects(gallery);
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

        if (projects.length === 0) {
            gallery.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1; text-align:center;">No projects found. Add some from the admin panel!</p>';
        } else {
            renderProjects(projects, gallery);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        loaderContainer.style.display = 'none';
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

// Demo data for when Supabase is not yet configured
function renderDemoProjects(container) {
    const demoProjects = [
        {
            title: "IoT Smart Home Hub",
            description: "A custom ESP32-based smart home controller with a responsive web interface.",
            media: [
                { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" },
                { url: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" }
            ],
            created_at: new Date().toISOString()
        },
        {
            title: "Automated Drone",
            description: "Quadcopter flight controller programmed from scratch using STM32.",
            media: [
                { url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" }
            ],
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            title: "Arduino Robot Arm",
            description: "A 6-axis robotic arm controlled via a custom desktop application.",
            media: [
                { url: "https://images.unsplash.com/photo-1580584126903-c17d41830450?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", type: "image/jpeg" }
            ],
            created_at: new Date(Date.now() - 172800000).toISOString()
        }
    ];
    renderProjects(demoProjects, container);
}
