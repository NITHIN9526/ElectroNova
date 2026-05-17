// adminpanel/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-project-form');
    const submitBtn = document.getElementById('submit-btn');
    const loaderContainer = document.getElementById('admin-loader');
    
    // Staging Elements
    const addMediaBtn = document.getElementById('add-media-btn');
    const mediaFileHidden = document.getElementById('media-file-hidden');
    const stagingList = document.getElementById('media-staging-list');
    
    let stagedMedia = []; // Array to hold { type: 'existing', url: '...', mediaType: '...' } or { type: 'new', file: FileObject }

    // Edit mode elements
    const editIdInput = document.getElementById('edit-id');
    const formTitle = document.getElementById('form-title');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // List container
    const projectListContainer = document.getElementById('project-list');

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    // Handle Add Media Button
    addMediaBtn.addEventListener('click', () => {
        mediaFileHidden.click();
    });

    mediaFileHidden.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                stagedMedia.push({
                    type: 'new',
                    file: files[i]
                });
            }
            renderStagedMedia();
        }
        // Reset input so the same file can be selected again if needed
        mediaFileHidden.value = '';
    });

    const renderStagedMedia = () => {
        stagingList.innerHTML = '';
        if (stagedMedia.length === 0) {
            stagingList.innerHTML = '<p style="color:var(--text-secondary); font-size: 0.9rem;">No files selected.</p>';
            return;
        }

        stagedMedia.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'staged-media-item';
            
            let displayName = '';
            if (item.type === 'existing') {
                displayName = item.url.split('/').pop() || 'Existing File';
            } else {
                displayName = item.file.name;
            }

            div.innerHTML = `
                <span class="staged-media-name" title="${escapeHTML(displayName)}">${escapeHTML(displayName)}</span>
                <button type="button" class="staged-media-remove" data-index="${index}">&times;</button>
            `;
            stagingList.appendChild(div);
        });

        // Attach remove listeners
        document.querySelectorAll('.staged-media-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                stagedMedia.splice(idx, 1);
                renderStagedMedia();
            });
        });
    };

    // Initial render
    renderStagedMedia();

    // Fetch and render projects
    const loadProjects = async () => {
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            projectListContainer.innerHTML = '<p style="color:var(--text-secondary);">Error loading projects.</p>';
            return;
        }

        if (projects.length === 0) {
            projectListContainer.innerHTML = '<p style="color:var(--text-secondary);">No projects found.</p>';
            return;
        }

        projectListContainer.innerHTML = '';
        projects.forEach(project => {
            const div = document.createElement('div');
            div.className = 'project-item';
            div.innerHTML = `
                <div>
                    <h4>${escapeHTML(project.title)}</h4>
                    <p>${new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                    <button class="btn-small btn-edit" data-id="${project.id}">Edit</button>
                    <button class="btn-small btn-delete" data-id="${project.id}">Delete</button>
                </div>
            `;
            projectListContainer.appendChild(div);
        });

        // Add event listeners for edit and delete
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', handleEditClick);
        });
    };

    const handleDelete = async (e) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        const id = e.target.getAttribute('data-id');
        
        const { error } = await supabaseClient.from('projects').delete().eq('id', id);
        
        if (error) {
            showToast(`Delete failed: ${error.message}`, 'error');
        } else {
            showToast('Project deleted successfully.', 'success');
            loadProjects();
        }
    };

    const handleEditClick = async (e) => {
        const id = e.target.getAttribute('data-id');
        const { data: project, error } = await supabaseClient.from('projects').select('*').eq('id', id).single();
        
        if (error || !project) {
            showToast('Could not load project details.', 'error');
            return;
        }

        // Populate form
        document.getElementById('title').value = project.title;
        document.getElementById('description').value = project.description;
        document.getElementById('components').value = project.components || '';
        document.getElementById('project-date').value = project.created_at ? new Date(project.created_at).toISOString().split('T')[0] : '';
        editIdInput.value = project.id;
        
        // Populate Staged Media
        stagedMedia = [];
        if (project.media && Array.isArray(project.media)) {
            project.media.forEach(m => {
                stagedMedia.push({ type: 'existing', url: m.url, mediaType: m.type });
            });
        } else if (project.media_url) {
            stagedMedia.push({ type: 'existing', url: project.media_url, mediaType: project.media_type });
        }
        renderStagedMedia();

        // Update UI state
        formTitle.textContent = "Edit Project";
        submitBtn.textContent = "Update Project";
        cancelEditBtn.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    cancelEditBtn.addEventListener('click', () => {
        resetFormState();
    });

    const resetFormState = () => {
        form.reset();
        editIdInput.value = '';
        document.getElementById('project-date').value = '';
        stagedMedia = [];
        renderStagedMedia();
        
        formTitle.textContent = "Add New Project";
        submitBtn.textContent = "Upload Project";
        cancelEditBtn.style.display = 'none';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!checkConfig()) {
            showToast("Supabase is not configured! Check js/supabase-config.js", "error");
            return;
        }

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const components = document.getElementById('components').value;
        const projectDate = document.getElementById('project-date').value;
        const isEditing = !!editIdInput.value;

        // Ensure at least one file is staged
        if (stagedMedia.length === 0) {
            showToast("Please add at least one photo or video.", "error");
            return;
        }

        submitBtn.disabled = true;
        loaderContainer.style.display = 'flex';

        try {
            let finalMediaArray = [];

            // Process staged media sequentially
            for (let i = 0; i < stagedMedia.length; i++) {
                const item = stagedMedia[i];
                
                if (item.type === 'existing') {
                    // Keep existing file
                    finalMediaArray.push({
                        url: item.url,
                        type: item.mediaType
                    });
                } else if (item.type === 'new') {
                    // Upload new file
                    const file = item.file;
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `uploads/${fileName}`;

                    let bucketName = 'images';
                    if (file.type.startsWith('video/')) {
                        bucketName = 'videos';
                    }

                    const { data: uploadData, error: uploadError } = await supabaseClient.storage
                        .from(bucketName)
                        .upload(filePath, file);

                    if (uploadError) {
                        throw new Error(`Upload failed for ${file.name}: ${uploadError.message || JSON.stringify(uploadError)}`);
                    }

                    const { data: publicUrlData } = supabaseClient.storage
                        .from(bucketName)
                        .getPublicUrl(filePath);

                    finalMediaArray.push({
                        url: publicUrlData.publicUrl,
                        type: file.type
                    });
                }
            }

            // Insert or Update DB
            if (isEditing) {
                const updateData = {
                    title: title,
                    description: description,
                    components: components,
                    media: finalMediaArray
                };
                if (projectDate) updateData.created_at = projectDate;

                const { error: updateError } = await supabaseClient
                    .from('projects')
                    .update(updateData)
                    .eq('id', editIdInput.value);

                if (updateError) {
                    throw new Error(`Update failed: ${updateError.message || JSON.stringify(updateError)}`);
                }
                showToast("Project successfully updated!", "success");
            } else {
                const insertData = {
                    title: title,
                    description: description,
                    components: components,
                    media: finalMediaArray
                };
                if (projectDate) insertData.created_at = projectDate;

                const { error: insertError } = await supabaseClient
                    .from('projects')
                    .insert([insertData]);

                if (insertError) {
                    throw new Error(`Database save failed: ${insertError.message || JSON.stringify(insertError)}`);
                }
                showToast("Project successfully added!", "success");
            }

            resetFormState();
            loadProjects();

        } catch (error) {
            showToast(error.message, "error");
        } finally {
            submitBtn.disabled = false;
            loaderContainer.style.display = 'none';
        }
    });

    // Initial load
    loadProjects();
});

// Utility
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

// Toast notification helper
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    toast.classList.add(type);
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
