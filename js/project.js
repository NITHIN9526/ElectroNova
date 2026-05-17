// js/project.js

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const loaderContainer = document.getElementById('loader-container');
    const projectDetailsSection = document.getElementById('project-details');
    
    if (!projectId) {
        loaderContainer.style.display = 'none';
        document.querySelector('.container').innerHTML = '<h2 style="text-align:center; margin-top: 4rem;">Project not found.</h2><p style="text-align:center;"><a href="index.html" style="color:var(--accent-color);">Return Home</a></p>';
        return;
    }

    loaderContainer.style.display = 'flex';

    if (!checkConfig()) {
        // Fallback for demo
        loaderContainer.style.display = 'none';
        document.querySelector('.container').innerHTML = '<h2 style="text-align:center; margin-top: 4rem;">Please configure Supabase to view project details.</h2>';
        return;
    }

    try {
        const { data: project, error } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            throw new Error("Could not load project");
        }

        // Render Data
        document.getElementById('project-title').textContent = project.title;
        document.getElementById('project-description').textContent = project.description;
        
        const dateObj = new Date(project.created_at || Date.now());
        document.getElementById('project-date').textContent = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Render Components
        const componentsList = document.getElementById('project-components');
        componentsList.innerHTML = '';
        if (project.components && project.components.trim() !== '') {
            // Split by comma or newline and render as bullets
            const items = project.components.split(/[,|\n]+/).map(i => i.trim()).filter(i => i !== '');
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                componentsList.appendChild(li);
            });
        } else {
            componentsList.innerHTML = '<li>No components listed.</li>';
        }

        // Render Media Grid
        const mediaGrid = document.getElementById('project-media-grid');
        mediaGrid.innerHTML = '';
        
        let mediaArray = [];
        if (project.media && Array.isArray(project.media) && project.media.length > 0) {
            mediaArray = project.media;
        } else if (project.media_url) {
            mediaArray = [{ url: project.media_url, type: project.media_type }];
        }

        mediaArray.forEach((m, idx) => {
            const mediaWrapper = document.createElement('div');
            mediaWrapper.className = 'media-thumbnail-wrapper';
            
            if (m.type && m.type.startsWith('video')) {
                // For videos, create a video element but don't autoplay. Add a play overlay icon via CSS if desired.
                mediaWrapper.innerHTML = `
                    <video src="${m.url}" class="media-thumbnail"></video>
                    <div class="video-play-indicator">▶</div>
                `;
            } else {
                mediaWrapper.innerHTML = `
                    <img src="${m.url}" class="media-thumbnail" loading="lazy">
                `;
            }
            
            // Click to open lightbox
            mediaWrapper.addEventListener('click', () => openLightbox(m));
            mediaGrid.appendChild(mediaWrapper);
        });

        loaderContainer.style.display = 'none';
        projectDetailsSection.style.display = 'block';

    } catch (err) {
        console.error(err);
        loaderContainer.style.display = 'none';
        document.querySelector('.container').innerHTML = '<h2 style="text-align:center; margin-top: 4rem;">Project not found or an error occurred.</h2><p style="text-align:center;"><a href="index.html" style="color:var(--accent-color);">Return Home</a></p>';
    }
});

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightbox-content');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox(media) {
    lightboxContent.innerHTML = '';
    
    if (media.type && media.type.startsWith('video')) {
        const video = document.createElement('video');
        video.src = media.url;
        video.controls = true;
        video.autoplay = true;
        video.className = 'lightbox-media';
        lightboxContent.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = media.url;
        img.className = 'lightbox-media';
        lightboxContent.appendChild(img);
    }
    
    lightbox.style.display = 'flex';
    // Trigger reflow
    void lightbox.offsetWidth;
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeLightbox() {
    lightbox.classList.remove('show');
    setTimeout(() => {
        lightbox.style.display = 'none';
        lightboxContent.innerHTML = ''; // Clear content to stop video playing
        document.body.style.overflow = '';
    }, 300);
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
        closeLightbox();
    }
});
