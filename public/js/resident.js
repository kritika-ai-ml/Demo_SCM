// Require authentication
if (!requireAuth() || !requireRole('resident')) {
    // Redirect handled by requireRole
}

// Load current user
const currentUser = getCurrentUser();
document.getElementById('userName').textContent = currentUser.name;

// State
let complaints = [];
let selectedFiles = [];
let currentComplaintId = null;

// Load complaints on page load
loadComplaints();

// Event Listeners
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('newComplaintBtn').addEventListener('click', openNewComplaintModal);
document.getElementById('closeModalBtn').addEventListener('click', closeNewComplaintModal);
document.getElementById('closeViewModalBtn').addEventListener('click', closeViewComplaintModal);
document.getElementById('newComplaintForm').addEventListener('submit', submitComplaint);
document.getElementById('addCommentForm').addEventListener('submit', addComment);
document.getElementById('statusFilter').addEventListener('change', loadComplaints);
document.getElementById('categoryFilter').addEventListener('change', loadComplaints);
document.getElementById('searchInput').addEventListener('input', debounce(loadComplaints, 500));
document.getElementById('complaintFiles').addEventListener('change', handleFileSelect);

// Close modal when clicking outside
document.getElementById('newComplaintModal').addEventListener('click', (e) => {
    if (e.target.id === 'newComplaintModal') closeNewComplaintModal();
});
document.getElementById('viewComplaintModal').addEventListener('click', (e) => {
    if (e.target.id === 'viewComplaintModal') closeViewComplaintModal();
});

// Load Complaints
async function loadComplaints() {
    try {
        const filters = {};
        const status = document.getElementById('statusFilter').value;
        const category = document.getElementById('categoryFilter').value;
        const search = document.getElementById('searchInput').value.trim();

        if (status) filters.status = status;
        if (category) filters.category = category;
        if (search) filters.search = search;

        const response = await complaintsAPI.getAll(filters);
        complaints = response.complaints;

        renderComplaints();
        updateStats();
    } catch (error) {
        console.error('Error loading complaints:', error);
        document.getElementById('complaintsList').innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--status-rejected);">
        <p>Error loading complaints. Please try again.</p>
        <button onclick="loadComplaints()" class="btn btn-secondary">Retry</button>
      </div>
    `;
    }
}

// Render Complaints
function renderComplaints() {
    const container = document.getElementById('complaintsList');

    if (complaints.length === 0) {
        container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📝</div>
        <h3>No Complaints Found</h3>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Start by creating your first complaint</p>
        <button onclick="openNewComplaintModal()" class="btn btn-primary">+ New Complaint</button>
      </div>
    `;
        return;
    }

    container.innerHTML = complaints.map(complaint => `
    <div class="complaint-item" onclick="viewComplaint('${complaint._id}')">
      <div class="complaint-header">
        <div>
          <h3 class="complaint-title">${escapeHtml(complaint.title)}</h3>
          <div class="complaint-meta">
            <span>📅 ${formatDate(complaint.createdAt)}</span>
            <span>📁 ${complaint.category}</span>
            ${complaint.assignedTo ? `<span>👤 Assigned to: ${escapeHtml(complaint.assignedTo)}</span>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-direction: column; align-items: flex-end;">
          <span class="badge badge-${complaint.status.toLowerCase().replace(' ', '')}">${complaint.status}</span>
          <span class="badge badge-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
        </div>
      </div>
      <p class="complaint-description">${escapeHtml(complaint.description.substring(0, 150))}${complaint.description.length > 150 ? '...' : ''}</p>
      <div class="complaint-footer">
        <div>
          ${complaint.attachments.length > 0 ? `<span>📎 ${complaint.attachments.length} attachment${complaint.attachments.length > 1 ? 's' : ''}</span>` : ''}
          ${complaint.comments.length > 0 ? `<span style="margin-left: 1rem;">💬 ${complaint.comments.length} comment${complaint.comments.length > 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// Update Stats
function updateStats() {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('pendingComplaints').textContent = pending;
    document.getElementById('progressComplaints').textContent = progress;
    document.getElementById('resolvedComplaints').textContent = resolved;
}

// View Complaint Details
async function viewComplaint(id) {
    try {
        currentComplaintId = id;
        const response = await complaintsAPI.getById(id);
        const complaint = response.complaint;

        const detailsHTML = `
      <div class="card" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
          <h2>${escapeHtml(complaint.title)}</h2>
          <div style="display: flex; gap: 0.5rem; flex-direction: column; align-items: flex-end;">
            <span class="badge badge-${complaint.status.toLowerCase().replace(' ', '')}">${complaint.status}</span>
            <span class="badge badge-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
          </div>
        </div>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted);">
          <span>📁 ${complaint.category}</span>
          <span>📅 ${formatDate(complaint.createdAt)}</span>
          ${complaint.assignedTo ? `<span>👤 ${escapeHtml(complaint.assignedTo)}</span>` : ''}
        </div>
        <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 1rem;">${escapeHtml(complaint.description)}</p>
        ${complaint.attachments.length > 0 ? `
          <div style="margin-top: 1rem;">
            <h4>Attachments:</h4>
            <div class="attachments">
              ${complaint.attachments.map(att => {
            if (att.mimetype.startsWith('image/')) {
                return `<div class="attachment-item" onclick="window.open('http://localhost:3000/${att.path}', '_blank')">
                    <img src="http://localhost:3000/${att.path}" alt="${escapeHtml(att.originalName)}">
                  </div>`;
            } else {
                return `<div class="attachment-item attachment-pdf" onclick="window.open('http://localhost:3000/${att.path}', '_blank')">
                    <div>📄<br>${escapeHtml(att.originalName)}</div>
                  </div>`;
            }
        }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

        document.getElementById('complaintDetails').innerHTML = detailsHTML;
        renderComments(complaint.comments);
        document.getElementById('viewComplaintModal').classList.add('active');
    } catch (error) {
        console.error('Error viewing complaint:', error);
        showAlert('Error loading complaint details', 'error');
    }
}

// Render Comments
function renderComments(comments) {
    const container = document.getElementById('commentsList');

    if (comments.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No comments yet</p>';
        return;
    }

    container.innerHTML = comments.map(comment => `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(comment.userName)} ${comment.userRole === 'admin' ? '(Admin)' : ''}</span>
        <span class="comment-date">${formatDate(comment.createdAt)}</span>
      </div>
      <div class="comment-text">${escapeHtml(comment.text)}</div>
    </div>
  `).join('');
}

// Add Comment
async function addComment(e) {
    e.preventDefault();

    const text = document.getElementById('commentText').value.trim();
    if (!text) return;

    try {
        const response = await complaintsAPI.addComment(currentComplaintId, text);
        document.getElementById('commentText').value = '';
        renderComments(response.complaint.comments);
        showAlert('Comment added successfully', 'success');

        // Refresh complaints list
        loadComplaints();
    } catch (error) {
        console.error('Error adding comment:', error);
        showAlert('Error adding comment', 'error');
    }
}

// Submit New Complaint
async function submitComplaint(e) {
    e.preventDefault();

    const title = document.getElementById('complaintTitle').value.trim();
    const description = document.getElementById('complaintDescription').value.trim();
    const category = document.getElementById('complaintCategory').value;
    const priority = document.getElementById('complaintPriority').value;

    if (!title || !description || !category) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    // Show loading
    const submitBtn = document.getElementById('submitBtnText');
    const spinner = document.getElementById('submitSpinner');
    submitBtn.textContent = 'Submitting...';
    spinner.classList.remove('hidden');
    document.querySelector('#newComplaintForm button[type="submit"]').disabled = true;

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('priority', priority);

        // Append files
        selectedFiles.forEach(file => {
            formData.append('attachments', file);
        });

        await complaintsAPI.create(formData);

        showAlert('Complaint submitted successfully!', 'success');
        closeNewComplaintModal();
        loadComplaints();

        // Reset form
        document.getElementById('newComplaintForm').reset();
        selectedFiles = [];
        document.getElementById('filePreview').innerHTML = '';
    } catch (error) {
        console.error('Error submitting complaint:', error);
        showAlert(error.message || 'Error submitting complaint', 'error');
    } finally {
        submitBtn.textContent = 'Submit Complaint';
        spinner.classList.add('hidden');
        document.querySelector('#newComplaintForm button[type="submit"]').disabled = false;
    }
}

// Handle File Selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFiles = files;

    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';

    files.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            item.appendChild(img);
        } else {
            item.innerHTML = `<div class="attachment-pdf" style="width: 100%; height: 100%;">📄<br>${file.name}</div>`;
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-preview-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => removeFile(index);
        item.appendChild(removeBtn);

        preview.appendChild(item);
    });
}

// Remove File
function removeFile(index) {
    selectedFiles.splice(index, 1);
    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    document.getElementById('complaintFiles').files = dt.files;
    handleFileSelect({ target: { files: dt.files } });
}

// Modal Functions
function openNewComplaintModal() {
    document.getElementById('newComplaintModal').classList.add('active');
}

function closeNewComplaintModal() {
    document.getElementById('newComplaintModal').classList.remove('active');
}

function closeViewComplaintModal() {
    document.getElementById('viewComplaintModal').classList.remove('active');
    currentComplaintId = null;
}

// Logout
function logout() {
    clearAuthData();
    window.location.href = '/';
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
