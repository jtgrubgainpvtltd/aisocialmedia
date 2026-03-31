import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { replies as repliesApi } from '../../api/client';

const TEAL = '#007A64';
const NAVY = '#1a2332';

function ReplyCard({ reply }) {
  const queryClient = useQueryClient();
  const [editedText, setEditedText] = useState(reply.ai_draft_reply);
  const [isEditing, setIsEditing] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => repliesApi.approve(reply.id, { editedReplyText: editedText }),
    onSuccess: () => {
      queryClient.invalidateQueries(['replies']);
      alert('Reply approved and posted successfully!');
    },
    onError: (err) => {
      alert(`Failed to approve: ${err.response?.data?.error || err.message}`);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => repliesApi.reject(reply.id),
    onSuccess: () => {
        queryClient.invalidateQueries(['replies']);
    },
    onError: (err) => {
        alert('Failed to reject reply');
    }
  });

  const getBadgeStyle = (type) => {
    switch(type) {
      case 'POSITIVE': return { color: '#007A64', bg: 'rgba(0,122,100,0.1)' };
      case 'COMPLAINT': return { color: '#CC0000', bg: 'rgba(204,0,0,0.1)' };
      case 'QUESTION': return { color: '#0055CC', bg: 'rgba(0,85,204,0.1)' };
      default: return { color: NAVY, bg: 'rgba(26,35,50,0.1)' };
    }
  };

  const badgeStyle = getBadgeStyle(reply.comment_type);

  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 24,
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      border: '1px solid rgba(12,12,12,0.08)',
      display: 'flex', flexDirection: 'column', gap: 16
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: NAVY }}>
            {reply.commenter_name.charAt(0)}
          </div>
          <div>
            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: NAVY }}>{reply.commenter_name}</span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(12,12,12,0.5)', fontFamily: 'Space Mono, monospace' }}>
              {new Date(reply.created_on).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <span style={{ 
          padding: '4px 10px', borderRadius: 8, fontSize: '0.6rem', 
          fontWeight: 700, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase',
          color: badgeStyle.color, background: badgeStyle.bg
        }}>
          {reply.comment_type}
        </span>
      </div>

      <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12 }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(12,12,12,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>Original Comment</span>
        <p style={{ color: NAVY, fontSize: '0.85rem', margin: 0 }}>"{reply.comment_text}"</p>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(12,12,12,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✨ AI Drafted Reply</span>
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: TEAL, fontSize: '0.7rem', cursor: 'pointer' }}>Edit</button>
            )}
        </div>
        
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            style={{ 
              width: '100%', minHeight: 80, padding: 12, borderRadius: 8, 
              border: `1px solid ${TEAL}`, outline: 'none', fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif'
            }}
          />
        ) : (
          <p style={{ color: NAVY, fontSize: '0.85rem', margin: 0, padding: 12, background: 'rgba(0,122,100,0.05)', borderRadius: 8, border: '1px solid rgba(0,122,100,0.1)' }}>
            {editedText}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
        <button 
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isLoading || rejectMutation.isLoading}
          style={{ flex: 1, padding: 12, background: TEAL, color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: approveMutation.isLoading ? 0.7 : 1 }}
        >
          {approveMutation.isLoading ? 'Posting...' : 'Approve & Post'}
        </button>
        <button 
          onClick={() => rejectMutation.mutate()}
          disabled={approveMutation.isLoading || rejectMutation.isLoading}
          style={{ padding: '12px 24px', background: 'transparent', color: '#CC0000', border: '1px solid #CC0000', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function ReplyQueuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['replies', { status: 'PENDING' }],
    queryFn: () => repliesApi.getAll({ status: 'PENDING' }).then((r) => r.data.data),
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.4)', marginBottom: 4 }}>06 — Engagement</p>
        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em', color: NAVY, lineHeight: 1 }}>AI Reply Queue</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: 'rgba(12,12,12,0.5)', marginTop: 6 }}>Review and approve AI-drafted responses to customer comments.</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(12,12,12,0.5)' }}>Loading drafted replies...</div>
      ) : data?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.7)', borderRadius: 16, border: '1px solid rgba(12,12,12,0.08)' }}>
           <span style={{ fontSize: '2rem', display: 'block', marginBottom: 16 }}>✨</span>
           <h3 style={{ color: NAVY, marginBottom: 8 }}>You're all caught up!</h3>
           <p style={{ color: 'rgba(12,12,12,0.5)', fontSize: '0.85rem' }}>No pending comments require a reply.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {data?.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} />
          ))}
        </div>
      )}
    </div>
  );
}
