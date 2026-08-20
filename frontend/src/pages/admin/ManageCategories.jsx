import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function ManageCategories() {
  const [categories, setCategories] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit modal state
  const [editCat, setEditCat] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');

  // View quizzes drawer state
  const [viewCat, setViewCat] = useState(null);
  const [catQuizzes, setCatQuizzes] = useState(null);
  const [catQuizzesLoading, setCatQuizzesLoading] = useState(false);

  function load() {
    api.get('/categories').then(setCategories).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function notify(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories/admin', { name, description });
      setName(''); setDescription('');
      notify(`Category "${name}" created successfully.`);
      load();
    } catch (err) { setError(err.message); }
  }

  function openEdit(cat) {
    setEditCat(cat);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setEditError('');
  }

  async function saveEdit(e) {
    e.preventDefault();
    setEditError('');
    setEditBusy(true);
    try {
      await api.put(`/categories/admin/${editCat.id}`, { name: editName, description: editDesc });
      setEditCat(null);
      notify(`Category updated to "${editName}".`);
      load();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditBusy(false);
    }
  }

  async function remove(cat) {
    if (!confirm(`Delete category "${cat.name}"? Quizzes under this category will become uncategorized.`)) return;
    try {
      await api.del(`/categories/admin/${cat.id}`);
      notify(`Category "${cat.name}" deleted.`);
      if (viewCat?.id === cat.id) { setViewCat(null); setCatQuizzes(null); }
      load();
    } catch (err) { setError(err.message); }
  }

  function openQuizzes(cat) {
    setViewCat(cat);
    setCatQuizzes(null);
    setCatQuizzesLoading(true);
    api.get(`/categories/${cat.id}/quizzes`)
      .then(setCatQuizzes)
      .catch((e) => setError(e.message))
      .finally(() => setCatQuizzesLoading(false));
  }

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="eyebrow">Content Organization</div>
            <h1 className="page-title">Manage Categories</h1>
            <p className="page-subtitle">
              Create, edit, and organize quiz categories. View all quizzes filed under each category.
            </p>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {successMsg && <div className="success-box">{successMsg}</div>}

        {/* Create Category Form */}
        <form className="card" onSubmit={create} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Add New Category</h3>
          <div className="grid grid-2">
            <div className="field">
              <label>Category Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JavaScript, Python, Cyber Security" />
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this category" />
            </div>
          </div>
          <button className="btn btn-primary">+ Add Category</button>
        </form>

        {/* Categories Table */}
        {!categories ? <div className="loading">Loading categories…</div> : categories.length === 0 ? (
          <div className="card empty-state">
            No categories created yet. Add your first one above to start organizing quizzes.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: 'var(--accent)', color: '#0a0f0c' }}>
                          {c.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.description || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openQuizzes(c)}
                          title="View quizzes in this category"
                        >
                          View Quizzes
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(c)}
                          title="Edit category name and description"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(c)}
                          title="Delete this category"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Suggested Categories Helper */}
        {categories && categories.length < 5 && (
          <div className="card" style={{ marginTop: 20, padding: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
              💡 <strong>Suggested categories</strong> — click to quick-add:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'Database', 'Computer Networks', 'Cyber Security']
                .filter((s) => !categories.some((c) => c.name.toLowerCase() === s.toLowerCase()))
                .map((s) => (
                  <button
                    key={s}
                    className="btn btn-secondary btn-sm"
                    onClick={async () => {
                      try {
                        await api.post('/categories/admin', { name: s, description: '' });
                        notify(`Category "${s}" added.`);
                        load();
                      } catch (err) { setError(err.message); }
                    }}
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Edit Category */}
      {editCat && (
        <div className="modal-backdrop" onClick={() => setEditCat(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Category</div>
              <button className="modal-close" onClick={() => setEditCat(null)}>×</button>
            </div>

            {editError && <div className="error-box">{editError}</div>}

            <form onSubmit={saveEdit}>
              <div className="field">
                <label>Category Name</label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Description</label>
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditCat(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editBusy}>
                  {editBusy ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Quizzes Under Category */}
      {viewCat && (
        <div className="modal-backdrop" onClick={() => setViewCat(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 720, maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Quizzes in "{viewCat.name}"</div>
              <button className="modal-close" onClick={() => setViewCat(null)}>×</button>
            </div>

            {catQuizzesLoading || !catQuizzes ? (
              <div className="loading" style={{ padding: '40px 0' }}>Loading quizzes…</div>
            ) : catQuizzes.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                No quizzes have been assigned to the "{viewCat.name}" category yet.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {catQuizzes.length} quiz{catQuizzes.length !== 1 ? 'zes' : ''} found in this category.
                </p>
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Quiz Title</th>
                        <th>Status</th>
                        <th>Questions</th>
                        <th>Duration</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {catQuizzes.map((q) => {
                        const status = q.status || (q.published ? 'PUBLISHED' : 'DRAFT');
                        return (
                          <tr key={q.id}>
                            <td style={{ padding: '12px 10px', fontWeight: 600 }}>{q.title}</td>
                            <td>
                              {status === 'PUBLISHED' && <span className="badge badge-success">Published</span>}
                              {status === 'DRAFT' && <span className="badge badge-muted">Draft</span>}
                              {status === 'UNPUBLISHED' && <span className="badge badge-danger">Unpublished</span>}
                            </td>
                            <td>{q.questionCount}</td>
                            <td>{q.durationMinutes} min</td>
                            <td>
                              <Link
                                to={`/admin/quizzes/${q.id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 10px', fontSize: 11.5 }}
                                onClick={() => setViewCat(null)}
                              >
                                Edit Quiz
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setViewCat(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
