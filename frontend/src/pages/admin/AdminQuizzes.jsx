import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

const emptyForm = {
  title: '', description: '', categoryId: '', difficulty: 'MEDIUM', durationMinutes: 15,
  marksPerQuestion: 1, negativeMarksPerQuestion: 0, passPercentage: 40, maxAttempts: 1,
  shuffleQuestions: true, shuffleOptions: true, status: 'DRAFT',
};

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  function load() {
    api.get('/admin/quizzes').then(setQuizzes).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    api.get('/categories').then(setCategories).catch(() => {});
  }, []);

  function notify(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  async function createQuiz(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        difficulty: form.difficulty || 'MEDIUM',
        durationMinutes: Math.max(1, Number(form.durationMinutes) || 15),
        marksPerQuestion: form.marksPerQuestion !== '' && !isNaN(form.marksPerQuestion) ? Number(form.marksPerQuestion) : 1.0,
        negativeMarksPerQuestion: form.negativeMarksPerQuestion !== '' && !isNaN(form.negativeMarksPerQuestion) ? Number(form.negativeMarksPerQuestion) : 0.0,
        passPercentage: form.passPercentage !== '' && !isNaN(form.passPercentage) ? Number(form.passPercentage) : 40.0,
        maxAttempts: form.maxAttempts !== '' && !isNaN(form.maxAttempts) ? Number(form.maxAttempts) : 1,
        shuffleQuestions: form.shuffleQuestions !== undefined ? Boolean(form.shuffleQuestions) : true,
        shuffleOptions: form.shuffleOptions !== undefined ? Boolean(form.shuffleOptions) : true,
        status: 'DRAFT',
      };
      await api.post('/admin/quizzes', payload);
      setShowForm(false);
      setForm(emptyForm);
      notify('Quiz draft created successfully. Add questions before publishing.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function setQuizStatus(quizId, newStatus) {
    setError('');
    try {
      await api.patch(`/admin/quizzes/${quizId}/status`, { status: newStatus });
      notify(`Quiz status updated to ${newStatus}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this quiz and all its questions/attempts? This cannot be undone.')) return;
    try {
      await api.del(`/admin/quizzes/${id}`);
      notify('Quiz deleted successfully.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredQuizzes = quizzes?.filter((q) => {
    const s = q.status || (q.published ? 'PUBLISHED' : 'DRAFT');
    if (statusFilter === 'PUBLISHED') return s === 'PUBLISHED';
    if (statusFilter === 'DRAFT') return s === 'DRAFT';
    if (statusFilter === 'UNPUBLISHED') return s === 'UNPUBLISHED';
    return true;
  });

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Assessment Management</div>
            <h1 className="page-title">Manage Quizzes</h1>
            <p className="page-subtitle">
              Create, configure, and manage quiz publication lifecycles (Draft, Published, Unpublished).
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ New Quiz'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
        {successMsg && <div className="success-box">{successMsg}</div>}

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'ALL', label: 'All Quizzes' },
            { key: 'PUBLISHED', label: 'Published' },
            { key: 'DRAFT', label: 'Drafts' },
            { key: 'UNPUBLISHED', label: 'Unpublished' },
          ].map((f) => {
            const count = quizzes?.filter((q) => {
              const s = q.status || (q.published ? 'PUBLISHED' : 'DRAFT');
              return f.key === 'ALL' ? true : s === f.key;
            }).length;
            return (
              <button
                key={f.key}
                className={`btn btn-sm ${statusFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label} {quizzes && `(${count})`}
              </button>
            );
          })}
        </div>

        {showForm && (
          <form className="card" onSubmit={createQuiz} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Create New Quiz</h3>
            <div className="grid grid-2">
              <div className="field"><label>Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Data Structures & Algorithms Mastery" />
              </div>
              <div className="field"><label>Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief summary of what this quiz covers…" />
            </div>
            <div className="grid grid-4">
              <div className="field"><label>Difficulty</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                </select>
              </div>
              <div className="field"><label>Duration (min)</label>
                <input type="number" min="1" required value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
              </div>
              <div className="field"><label>Marks / question</label>
                <input type="number" step="0.5" value={form.marksPerQuestion} onChange={(e) => setForm({ ...form, marksPerQuestion: Number(e.target.value) })} />
              </div>
              <div className="field"><label>Negative marks</label>
                <input type="number" step="0.25" value={form.negativeMarksPerQuestion} onChange={(e) => setForm({ ...form, negativeMarksPerQuestion: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-3">
              <div className="field"><label>Pass %</label>
                <input type="number" value={form.passPercentage} onChange={(e) => setForm({ ...form, passPercentage: Number(e.target.value) })} />
              </div>
              <div className="field"><label>Max attempts (0 = unlimited)</label>
                <input type="number" min="0" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 22 }}>
                <label className="checkbox-row">
                  <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })} /> Shuffle questions
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setForm({ ...form, shuffleOptions: e.target.checked })} /> Shuffle options
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn btn-primary">Save as Draft</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {!quizzes ? (
          <div className="loading">Loading quizzes…</div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="card empty-state">No quizzes found under this filter.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map((q) => {
                  const status = q.status || (q.published ? 'PUBLISHED' : 'DRAFT');
                  return (
                    <tr key={q.id}>
                      <td style={{ padding: '14px 10px', fontWeight: 600 }}>{q.title}</td>
                      <td>{q.categoryName || '—'}</td>
                      <td>{q.questionCount}</td>
                      <td>{q.durationMinutes} min</td>
                      <td>
                        {status === 'PUBLISHED' && (
                          <span className="badge badge-success">Published</span>
                        )}
                        {status === 'DRAFT' && (
                          <span className="badge badge-muted">Draft</span>
                        )}
                        {status === 'UNPUBLISHED' && (
                          <span className="badge badge-danger">Unpublished</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Link to={`/admin/quizzes/${q.id}`} className="btn btn-secondary btn-sm">
                            Edit & Questions
                          </Link>

                          {status === 'PUBLISHED' ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setQuizStatus(q.id, 'UNPUBLISHED')}
                              title="Unpublish this quiz so it is no longer available to students"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setQuizStatus(q.id, 'PUBLISHED')}
                              title="Publish this quiz to make it available to students"
                            >
                              Publish
                            </button>
                          )}

                          {status === 'UNPUBLISHED' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setQuizStatus(q.id, 'DRAFT')}
                              title="Revert back to draft"
                            >
                              Make Draft
                            </button>
                          )}

                          <button className="btn btn-danger btn-sm" onClick={() => remove(q.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
