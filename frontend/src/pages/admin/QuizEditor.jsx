import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';

const emptyQuestion = {
  text: '',
  type: 'SINGLE_CHOICE',
  difficulty: 'MEDIUM',
  marks: '',
  imageUrl: '',
  codeSnippet: '',
  codeLanguage: 'javascript',
  explanation: '',
  options: [
    { text: '', correct: true },
    { text: '', correct: false },
    { text: '', correct: false },
    { text: '', correct: false },
  ],
};

export default function QuizEditor() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function load() {
    api.get(`/admin/quizzes/${quizId}`).then(setQuiz).catch((e) => setError(e.message));
    api.get(`/admin/quizzes/${quizId}/questions`).then(setQuestions).catch((e) => setError(e.message));
  }

  useEffect(load, [quizId]);

  function notify(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  async function setQuizStatus(newStatus) {
    setError('');
    try {
      const updated = await api.patch(`/admin/quizzes/${quizId}/status`, { status: newStatus });
      setQuiz(updated);
      notify(`Quiz status updated to ${newStatus}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  function updateOptionText(i, text) {
    const options = [...form.options];
    options[i] = { ...options[i], text };
    setForm({ ...form, options });
  }

  function setCorrect(i) {
    const isMulti = form.type === 'MULTIPLE_CHOICE' || form.type === 'MATCH_FOLLOWING';
    const options = form.options.map((o, idx) => ({
      ...o,
      correct: isMulti ? (idx === i ? !o.correct : o.correct) : idx === i,
    }));
    setForm({ ...form, options });
  }

  function addOption() {
    setForm({ ...form, options: [...form.options, { text: '', correct: false }] });
  }

  function removeOption(i) {
    setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) });
  }

  function switchType(type) {
    if (type === 'TRUE_FALSE') {
      setForm({
        ...form,
        type,
        options: [
          { text: 'True', correct: true },
          { text: 'False', correct: false },
        ],
      });
    } else if (type === 'FILL_BLANKS') {
      setForm({
        ...form,
        type,
        options: form.options.length ? form.options : [
          { text: '', correct: true },
          { text: '', correct: false },
        ],
      });
    } else {
      setForm({ ...form, type });
    }
  }

  async function saveQuestion(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        marks: form.marks !== '' && form.marks !== null ? Number(form.marks) : null,
      };

      if (editingId) {
        await api.put(`/admin/quizzes/${quizId}/questions/${editingId}`, payload);
      } else {
        await api.post(`/admin/quizzes/${quizId}/questions`, payload);
      }
      setForm(emptyQuestion);
      setEditingId(null);
      setShowForm(false);
      notify('Question saved successfully.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function editQuestion(q) {
    setForm({
      text: q.text,
      type: q.type,
      difficulty: q.difficulty || 'MEDIUM',
      marks: q.marks !== null && q.marks !== undefined ? q.marks : '',
      imageUrl: q.imageUrl || '',
      codeSnippet: q.codeSnippet || '',
      codeLanguage: q.codeLanguage || 'javascript',
      explanation: q.explanation || '',
      options: q.options.map((o) => ({ id: o.id, text: o.text, correct: o.correct })),
    });
    setEditingId(q.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try {
      await api.del(`/admin/quizzes/${quizId}/questions/${id}`);
      notify('Question deleted.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!quiz || !questions) return <div className="loading">Loading quiz editor…</div>;

  const currentStatus = quiz.status || (quiz.published ? 'PUBLISHED' : 'DRAFT');

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="eyebrow">
              <Link to="/admin/quizzes" style={{ color: 'var(--accent)' }}>← All Quizzes</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <h1 className="page-title">{quiz.title}</h1>
              {currentStatus === 'PUBLISHED' && <span className="badge badge-success">Published</span>}
              {currentStatus === 'DRAFT' && <span className="badge badge-muted">Draft</span>}
              {currentStatus === 'UNPUBLISHED' && <span className="badge badge-danger">Unpublished</span>}
            </div>
            <p className="page-subtitle" style={{ marginTop: 6 }}>
              {questions.length} question(s) · {quiz.durationMinutes} min · Category: {quiz.categoryName || 'Uncategorized'} · Base Marks: {quiz.marksPerQuestion}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {currentStatus === 'PUBLISHED' ? (
              <button
                className="btn btn-secondary"
                onClick={() => setQuizStatus('UNPUBLISHED')}
              >
                Unpublish Quiz
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setQuizStatus('PUBLISHED')}
              >
                Publish Quiz
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowForm((s) => !s);
                setEditingId(null);
                setForm(emptyQuestion);
              }}
            >
              {showForm ? 'Cancel' : '+ Add Question'}
            </button>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {successMsg && <div className="success-box">{successMsg}</div>}

        {/* Add / Edit Question Form */}
        {showForm && (
          <form className="card" onSubmit={saveQuestion} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>
              {editingId ? 'Edit Question' : 'Create New Question'}
            </h3>

            {/* Question Text */}
            <div className="field">
              <label>Question Text *</label>
              <textarea
                required
                rows={3}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="e.g. Which method converts a JSON string into a JavaScript object?"
              />
            </div>

            {/* Question Configuration: Type, Difficulty, Custom Marks */}
            <div className="grid grid-3">
              <div className="field">
                <label>Question Type *</label>
                <select value={form.type} onChange={(e) => switchType(e.target.value)}>
                  <option value="SINGLE_CHOICE">Multiple Choice (Single Answer)</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice (Multiple Correct Answers)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="FILL_BLANKS">Fill in the Blanks</option>
                  <option value="MATCH_FOLLOWING">Match the Following</option>
                  <option value="IMAGE_BASED">Image-based Question</option>
                  <option value="CODE_BASED">Code-based Question</option>
                </select>
              </div>

              <div className="field">
                <label>Difficulty</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div className="field">
                <label>Custom Marks (optional)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder={`Default: ${quiz.marksPerQuestion}`}
                  value={form.marks}
                  onChange={(e) => setForm({ ...form, marks: e.target.value })}
                />
              </div>
            </div>

            {/* Extra Fields for IMAGE_BASED */}
            {form.type === 'IMAGE_BASED' && (
              <div className="card" style={{ background: 'var(--surface-raised)', marginBottom: 16 }}>
                <div className="field">
                  <label>Image URL *</label>
                  <input
                    type="url"
                    placeholder="https://example.com/diagram.png"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  />
                </div>
                {form.imageUrl && (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <img
                      src={form.imageUrl}
                      alt="Question preview"
                      style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Extra Fields for CODE_BASED */}
            {form.type === 'CODE_BASED' && (
              <div className="card" style={{ background: 'var(--surface-raised)', marginBottom: 16 }}>
                <div className="grid grid-2">
                  <div className="field">
                    <label>Programming Language</label>
                    <select
                      value={form.codeLanguage}
                      onChange={(e) => setForm({ ...form, codeLanguage: e.target.value })}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="sql">SQL</option>
                      <option value="html">HTML / CSS</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Code Snippet *</label>
                  <textarea
                    rows={5}
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                    placeholder="console.log(typeof null);"
                    value={form.codeSnippet}
                    onChange={(e) => setForm({ ...form, codeSnippet: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Options Manager */}
            <div style={{ marginTop: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                  Options & Correct Answer (click marker to mark correct answer)
                </label>
                {form.type !== 'TRUE_FALSE' && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>
                    + Add Option
                  </button>
                )}
              </div>

              {form.type === 'FILL_BLANKS' && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                  💡 Use <code>___</code> in the question prompt. Enter acceptable answers below and check the primary correct answer.
                </div>
              )}

              {form.type === 'MATCH_FOLLOWING' && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                  💡 Enter pairs in format <code>Left Item → Right Match</code> (e.g. <code>JSON.parse() → String to Object</code>).
                </div>
              )}

              {form.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '10px 0' }}>
                  <div
                    className="option-marker"
                    title={opt.correct ? 'Correct Answer' : 'Click to mark as correct answer'}
                    style={{
                      cursor: 'pointer',
                      marginTop: 6,
                      background: opt.correct ? 'var(--success)' : 'transparent',
                      borderColor: opt.correct ? 'var(--success)' : undefined,
                      color: opt.correct ? '#0a0f0c' : undefined,
                    }}
                    onClick={() => setCorrect(i)}
                  >
                    {opt.correct ? '✓' : String.fromCharCode(65 + i)}
                  </div>
                  <textarea
                    style={{
                      flex: 1,
                      minHeight: 44,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: 13.5,
                      padding: '8px 12px',
                    }}
                    rows={2}
                    required
                    value={opt.text}
                    placeholder={`Option ${String.fromCharCode(65 + i)} (press Enter for new line)`}
                    disabled={form.type === 'TRUE_FALSE'}
                    onChange={(e) => updateOptionText(i, e.target.value)}
                  />
                  {form.type !== 'TRUE_FALSE' && form.options.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 6 }}
                      title="Remove option"
                      onClick={() => removeOption(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Explanation Field */}
            <div className="field" style={{ marginTop: 16 }}>
              <label>Explanation (shown to student during answer review, optional)</label>
              <textarea
                rows={2}
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                placeholder="e.g. JSON.parse() parses a JSON string, constructing the JavaScript value or object described by the string."
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Add Question'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowForm(false); setEditingId(null); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Question List */}
        {questions.length === 0 ? (
          <div className="card empty-state">
            No questions added yet — click "+ Add Question" above to start building this quiz.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="card" style={{ marginBottom: 16 }}>
              {/* Question Header & Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  <span style={{ color: 'var(--accent)', marginRight: 6 }}>Q{idx + 1}.</span>
                  {q.text}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="badge badge-accent">
                    {q.type.replace(/_/g, ' ')}
                  </span>
                  <span className="badge badge-muted">
                    {q.difficulty}
                  </span>
                  <span className="badge badge-muted">
                    {q.marks !== null && q.marks !== undefined ? `${q.marks} marks` : `${quiz.marksPerQuestion} marks`}
                  </span>
                </div>
              </div>

              {/* Image Preview if IMAGE_BASED */}
              {q.imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={q.imageUrl}
                    alt="Question visual"
                    style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                </div>
              )}

              {/* Code Snippet Preview if CODE_BASED */}
              {q.codeSnippet && (
                <pre
                  style={{
                    background: 'var(--surface-raised)',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    border: '1px solid var(--border)',
                    marginBottom: 12,
                  }}
                >
                  <code>{q.codeSnippet}</code>
                </pre>
              )}

              {/* Options List */}
              <div style={{ display: 'grid', gap: 6, margin: '12px 0' }}>
                {q.options.map((o, optIdx) => (
                  <div
                    key={o.id || optIdx}
                    className={'option-row' + (o.correct ? ' correct' : '')}
                    style={{ cursor: 'default', padding: '8px 12px' }}
                  >
                    <div
                      className="option-marker"
                      style={{
                        background: o.correct ? 'var(--success)' : 'transparent',
                        borderColor: o.correct ? 'var(--success)' : undefined,
                        color: o.correct ? '#0a0f0c' : undefined,
                      }}
                    >
                      {o.correct ? '✓' : String.fromCharCode(65 + optIdx)}
                    </div>
                    <span style={{ fontWeight: o.correct ? 600 : 400, whiteSpace: 'pre-wrap', flex: 1, wordBreak: 'break-word' }}>
                      {o.text}
                    </span>
                    {o.correct && (
                      <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--success)', fontWeight: 600, flexShrink: 0 }}>
                        Correct Answer
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation Box */}
              {q.explanation && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    borderLeft: '3px solid var(--accent)',
                    fontSize: 13,
                    marginTop: 8,
                    marginBottom: 12,
                  }}
                >
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => editQuestion(q)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteQuestion(q.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
