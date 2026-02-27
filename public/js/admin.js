// Require authentication and admin role
if (!requireAuth() || !requireRole('admin')) {
    // Redirect handled by requireRole
}

// Load current user
const currentUser = getCurrentUser();
document.getElementById('userName').textContent = currentUser.name;

// State
let complaints = [];
let currentComplaintId = null;

// Load data on page load
loadComplaints();
loadStats();

// Event Listeners
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('closeManageModalBtn').addEventListener('click', closeManageModal);
document.getElementById('statusFilter').addEventListener('change', loadComplaints);
document.getElementById('categoryFilter').addEventListener('change', loadComplaints);
document.getElementById('priorityFilter').addEventListener('change', loadComplaints);
document.getElementById('searchInput').addEventListener('input', debounce(loadComplaints, 500));
document.getElementById('updateComplaintBtn').addEventListener('click', updateComplaint);
document.getElementById('addCommentForm').addEventListener('submit', addComment);
document.getElementById('deleteComplaintBtn').addEventListener('click', deleteComplaint);

// Close modal when clicking outside
document.getElementById('manageComplaintModal').addEventListener('click', (e) => {
    if (e.target.id === 'manageComplaintModal') closeManageModal();
});

// Load Statistics
async function loadStats() {
    try {
        const response = await complaintsAPI.getStats();
        const stats = response.stats;

        document.getElementById('totalComplaints').textContent = stats.total;
        document.getElementById('pendingComplaints').textContent = stats.pending;
        document.getElementById('progressComplaints').textContent = stats.inProgress;
        document.getElementById('resolvedComplaints').textContent = stats.resolved;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Complaints
async function loadComplaints() {
    try {
        const filters = {};
        const status = document.getElementById('statusFilter').value;
        const category = document.getElementById('categoryFilter').value;
        const priority = document.getElementById('priorityFilter').value;
        const search = document.getElementById('searchInput').value.trim();

        if (status) filters.status = status;
        if (category) filters.category = category;
        if (priority) filters.priority = priority;
        if (search) filters.search = search;

        const response = await complaintsAPI.getAll(filters);
        complaints = response.complaints;

        renderComplaints();
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
        <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
        <h3>No Complaints Found</h3>
        <p style="color: var(--text-secondary);">All clear! No complaints match your filters.</p>
      </div>
    `;
        return;
    }

    container.innerHTML = complaints.map(complaint => `
    <div class="complaint-item" onclick="manageComplaint('${complaint._id}')">
      <div class="complaint-header">
        <div>
          <h3 class="complaint-title">${escapeHtml(complaint.title)}</h3>
          <div class="complaint-meta">
            <span>👤 ${escapeHtml(complaint.userId.name)}</span>
            ${complaint.userId.flatNumber ? `<span>🏠 Flat ${escapeHtml(complaint.userId.flatNumber)}</span>` : ''}
            <span>📅 ${formatDate(complaint.createdAt)}</span>
            <span>📁 ${complaint.category}</span>
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
          ${complaint.assignedTo ? `<span style="margin-left: 1rem;">🎯 ${escapeHtml(complaint.assignedTo)}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// Manage Complaint (View and Edit)
async function manageComplaint(id) {
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
        
        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.9rem;">
            <div>
              <strong style="color: var(--text-muted);">Submitted By:</strong><br>
              <span>${escapeHtml(complaint.userId.name)}</span>
            </div>
            ${complaint.userId.flatNumber ? `
            <div>
              <strong style="color: var(--text-muted);">Flat Number:</strong><br>
              <span>${escapeHtml(complaint.userId.flatNumber)}</span>
            </div>
            ` : ''}
            ${complaint.userId.email ? `
            <div>
              <strong style="color: var(--text-muted);">Email:</strong><br>
              <span>${escapeHtml(complaint.userId.email)}</span>
            </div>
            ` : ''}
            ${complaint.userId.phoneNumber ? `
            <div>
              <strong style="color: var(--text-muted);">Phone:</strong><br>
              <span>${escapeHtml(complaint.userId.phoneNumber)}</span>
            </div>
            ` : ''}
            <div>
              <strong style="color: var(--text-muted);">Category:</strong><br>
              <span>${complaint.category}</span>
            </div>
            <div>
              <strong style="color: var(--text-muted);">Created:</strong><br>
              <span>${formatDate(complaint.createdAt)}</span>
            </div>
            ${complaint.assignedTo ? `
            <div>
              <strong style="color: var(--text-muted);">Assigned To:</strong><br>
              <span>${escapeHtml(complaint.assignedTo)}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <strong style="color: var(--text-secondary);">Description:</strong>
          <p style="color: var(--text-secondary); line-height: 1.8; margin-top: 0.5rem;">${escapeHtml(complaint.description)}</p>
        </div>

        ${complaint.attachments.length > 0 ? `
          <div style="margin-top: 1rem;">
            <strong style="color: var(--text-secondary);">Attachments:</strong>
            <div class="attachments" style="margin-top: 0.5rem;">
              ${complaint.attachments.map(att => {
            if (att.mimetype.startsWith('image/')) {
                return `<div class="attachment-item" onclick="window.open('http://localhost:3000/${att.path}', '_blank')">
                    <img src="http://localhost:3000/${att.path}" alt="${escapeHtml(att.originalName)}">
                  </div>`;
            } else {
                return `<div class="attachment-item attachment-pdf" onclick="window.open('http://localhost:3000/${att.path}', '_blank')">
                    <div>📄<br>${escapeHtml(att.originalName.substring(0, 15))}</div>
                  </div>`;
            }
        }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

        document.getElementById('complaintDetails').innerHTML = detailsHTML;

        // Populate form fields
        document.getElementById('updateStatus').value = complaint.status;
        document.getElementById('updatePriority').value = complaint.priority;
        document.getElementById('assignTo').value = complaint.assignedTo || '';

        renderComments(complaint.comments);
        document.getElementById('manageComplaintModal').classList.add('active');
    } catch (error) {
        console.error('Error loading complaint:', error);
        showAlert('Error loading complaint details', 'error');
    }
}

// Update Complaint
async function updateComplaint() {
    if (!currentComplaintId) return;

    const status = document.getElementById('updateStatus').value;
    const priority = document.getElementById('updatePriority').value;
    const assignedTo = document.getElementById('assignTo').value.trim();

    try {
        const updates = { status, priority, assignedTo };
        await complaintsAPI.update(currentComplaintId, updates);

        showAlert('Complaint updated successfully!', 'success');
        loadComplaints();
        loadStats();

        // Reload complaint details
        manageComplaint(currentComplaintId);
    } catch (error) {
        console.error('Error updating complaint:', error);
        showAlert(error.message || 'Error updating complaint', 'error');
    }
}

// Delete Complaint
async function deleteComplaint() {
    if (!currentComplaintId) return;

    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
        return;
    }

    try {
        await complaintsAPI.delete(currentComplaintId);
        showAlert('Complaint deleted successfully', 'success');
        closeManageModal();
        loadComplaints();
        loadStats();
    } catch (error) {
        console.error('Error deleting complaint:', error);
        showAlert(error.message || 'Error deleting complaint', 'error');
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
        loadComplaints();
    } catch (error) {
        console.error('Error adding comment:', error);
        showAlert('Error adding comment', 'error');
    }
}

// Modal Functions
function closeManageModal() {
    document.getElementById('manageComplaintModal').classList.remove('active');
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
