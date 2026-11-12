import { useState } from 'react';
import { api } from '../lib/api';
import { LETTERS, cardStyle } from '../lib/constants';
import { timeOf } from '../lib/dates';
import { Avatar, Icon, thumb } from './ui';
import { Doodle } from './Doodles';

function LetterComments({ comments, letter, members, me, onAdd, onDelete }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mine = comments.filter((c) => c.letter === letter.key);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { setError('Write something first'); return; }
    setBusy(true); setError('');
    try {
      await onAdd(letter.key, text.trim());
      setText('');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="comments">
      {mine.map((c) => {
        const who = members.get(String(c.user));
        const isMe = String(c.user) === String(me.id);
        return (
          <div className="comment" key={c.id}>
            <Avatar name={who ? who.name : '?'} colorPair={who && who.colorPair} me={isMe} />
            <div className="bubble">
              <span className="who">
                <span>{isMe ? 'You' : (who ? who.name : 'Someone who left')}</span>
                <span>{timeOf(c.createdAt)}</span>
                {isMe && <button type="button" className="link-btn danger" style={{ fontSize: 13, padding: 0 }} onClick={() => onDelete(c.id)}>delete</button>}
              </span>
              <span>{c.text}</span>
            </div>
          </div>
        );
      })}
      <form className="comment-form" onSubmit={submit}>
        <input value={text} onChange={(e) => { setText(e.target.value); setError(''); }} maxLength={500}
          placeholder="Write a comment…" aria-label={`Comment on ${letter.label}`} />
        <button type="submit" className="send" disabled={busy} aria-label="Send comment"><Icon name="send" size={16} stroke={2} /></button>
      </form>
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}

export function LetterMedia({ l, onZoom }) {
  return (
    <>
      {l.photo && (
        <button type="button" className="polaroid tilt-r" onClick={() => onZoom(l.photo.url)} aria-label="Open photo">
          <img src={thumb(l.photo.url)} alt="" loading="lazy" />
        </button>
      )}
      {l.voice && <audio className="audio" controls preload="none" src={l.voice.url} aria-label="Voice note" />}
      {l.video && <video className="video" controls preload="metadata" playsInline src={l.video.url} aria-label="Video" />}
    </>
  );
}

// A full report (shown once revealed on Sunday)
export default function ReportCard({ person, members, me, groupId, onChange, onZoom }) {
  const { report, user } = person;
  const isMe = String(user.id) === String(me.id);

  const addComment = async (letter, text) => {
    const res = await api(`/groups/${groupId}/reports/${report.id}/comments`, { method: 'POST', body: { letter, text } });
    onChange(res.report);
  };
  const deleteComment = async (id) => {
    const res = await api(`/groups/${groupId}/reports/${report.id}/comments/${id}`, { method: 'DELETE' });
    onChange(res.report);
  };

  return (
    <article className="report-card" style={cardStyle(user.colorPair)}>
      <span className="tape" />
      <Doodle shape="sparkle" color="pink" size={22} style={{ top: 16, right: 18 }} />
      <Doodle shape="star" color="yellow" size={14} style={{ top: 44, right: 46 }} />
      <div className="person" style={{ marginBottom: 2 }}>
        <Avatar name={user.name} colorPair={user.colorPair} me={isMe} />
        <h2 style={{ fontSize: 28 }}>{isMe ? 'My report' : `${user.name}'s report`}</h2>
      </div>
      {LETTERS.map((letter) => {
        const l = (report.letters && report.letters[letter.key]) || {};
        return (
          <section className="letter-row" key={letter.key} aria-label={letter.label}>
            <span className="big-letter" aria-hidden="true">{letter.letter}</span>
            <div className="letter-body">
              <span className="letter-label">{letter.label}</span>
              {l.text && <span style={{ whiteSpace: 'pre-wrap' }}>{l.text}</span>}
              <LetterMedia l={l} onZoom={onZoom} />
              <LetterComments comments={report.comments || []} letter={letter} members={members}
                me={me} onAdd={addComment} onDelete={deleteComment} />
            </div>
          </section>
        );
      })}
    </article>
  );
}
