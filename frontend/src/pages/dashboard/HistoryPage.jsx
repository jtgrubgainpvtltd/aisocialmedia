import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { content, posts } from "../../api/client";
import { useToast, ToastContainer } from "../../components/Toast";
import QueryState from "../../components/ui/QueryState";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { useIsSmallScreen } from "../../utils/useIsSmallScreen";
import SecureImage from "../../components/ui/SecureImage";

const TEAL = "#007A64";
const NAVY = "#1a2332";
const ORANGE = "#E8640A";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toasts, toast } = useToast();
  const isMobile = useIsSmallScreen();

  // ── Fetch content history via React Query ──
  const { data: contentData, isLoading: contentLoading, error: contentError, refetch: refetchContent } = useQuery({
    queryKey: ["content-history"],
    queryFn: () =>
      content.getHistory({ limit: 50, offset: 0 }).then((r) => r.data),
  });

  // ── Fetch published posts via React Query ──
  const { data: publishedData, isLoading: publishedLoading, error: publishedError, refetch: refetchPublished } = useQuery({
    queryKey: ["published-posts"],
    queryFn: () =>
      posts.getPublished({ limit: 50, offset: 0 }).then((r) => r.data),
  });

  const loading = contentLoading || publishedLoading;

  // Derive posts list from React Query data (no manual state needed)
  const generatedItems = (contentData?.data?.content || []).map((c) => ({
    id: c.id,
    title:
      (c.caption_english || "").substring(0, 60) +
      ((c.caption_english || "").length > 60 ? "..." : ""),
    fullCaption: c.caption_english || "",
    imageUrl: c.image_url ? resolveMediaUrl(c.image_url) : null,
    publishedDate: new Date(c.created_on).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    publishedTime: new Date(c.created_on).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    model: c.image_url ? "GPT-Image-1.5 + GPT-4o-mini" : "GPT-4o-mini",
    promptUsed: c.prompt
      ? (() => {
          try {
            return JSON.parse(c.prompt);
          } catch {
            return { text: c.prompt };
          }
        })()
      : {},
    status: "generated",
    platform: c.platform || null,
    platformPostId: null,
  }));

  const publishedItems = (publishedData?.data?.posts || []).map((p) => ({
    id: `published-${p.id}`,
    title:
      p.title ||
      (p.caption
        ? `${p.caption.substring(0, 60)}${p.caption.length > 60 ? "..." : ""}`
        : "Published post"),
    fullCaption: p.caption || "",
    imageUrl: p.image_url ? resolveMediaUrl(p.image_url) : null,
    publishedDate: p.published_date
      ? new Date(p.published_date).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-",
    publishedTime: p.published_time || "-",
    model: "Published",
    promptUsed: {},
    status: "published",
    platform: p.platform,
    platformPostId: p.platform_post_id || null,
  }));

  const allPosts = [...publishedItems, ...generatedItems];
  const modelSummary = "GPT-4o-mini";

  const handleViewPost = (post) => {
    navigate("/dashboard/studio", {
      state: {
        historyEditPayload: {
          caption: post.fullCaption || "",
          imageUrl: post.imageUrl || "",
          platform: post.platform || "INSTAGRAM",
          postId: String(post.id),
        },
      },
    });
  };

  const handleDelete = async (id) => {
    // Published posts use prefixed IDs like "published-42" — they cannot be deleted this way
    if (String(id).startsWith("published-")) {
      toast.error("Published posts cannot be deleted from this view.");
      return;
    }
    if (!confirm("Delete this content?")) return;
    try {
      await content.delete(id);
      queryClient.invalidateQueries({ queryKey: ["content-history"] });
      toast.success("Content deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete content.");
    }
  };

  const filtered = allPosts.filter((p) => {
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fullCaption.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <QueryState
        loading={loading}
        error={contentError || publishedError}
        onRetry={() => {
          refetchContent();
          refetchPublished();
        }}
        loadingTitle="Loading content history"
        loadingSubtitle="Gathering generated and published posts…"
      >
      <div style={{ padding: isMobile ? '16px 14px' : '28px 32px', maxWidth: 1200 }}>
        {/* Header */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(12,12,12,0.4)",
                marginBottom: 4,
              }}
            >
              Archive
            </p>
            <h1
              style={{
                fontFamily: "Unbounded, sans-serif",
                fontWeight: 900,
                fontSize: "1.6rem",
                letterSpacing: "-0.03em",
                color: NAVY,
                lineHeight: 1,
              }}
            >
              Content History
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.82rem",
                color: "rgba(12,12,12,0.5)",
                marginTop: 8,
              }}
            >
              View all your previously generated AI content
            </p>
          </div>

          {/* Search */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid rgba(12,12,12,0.12)",
                background: "white",
                color: NAVY,
                fontFamily: "Inter, sans-serif",
                fontSize: "0.8rem",
                outline: "none",
                minWidth: 200,
              }}
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(12,12,12,0.1)",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
            }}
          >
            <p
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(12,12,12,0.4)",
                marginBottom: 8,
              }}
            >
              Total Generated
            </p>
            <h3
              style={{
                fontFamily: "Unbounded, sans-serif",
                fontSize: "1.8rem",
                fontWeight: 900,
                color: NAVY,
                lineHeight: 1,
              }}
            >
              {allPosts.length}
            </h3>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(12,12,12,0.1)",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
            }}
          >
            <p
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(12,12,12,0.4)",
                marginBottom: 8,
              }}
            >
              AI Model
            </p>
            <h3
              style={{
                fontFamily: "Unbounded, sans-serif",
                fontSize: "1rem",
                fontWeight: 900,
                color: TEAL,
                lineHeight: 1,
              }}
            >
              {modelSummary}
            </h3>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(12,12,12,0.1)",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
            }}
          >
            <p
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(12,12,12,0.4)",
                marginBottom: 8,
              }}
            >
              Image Engine
            </p>
            <h3
              style={{
                fontFamily: "Unbounded, sans-serif",
                fontSize: "1rem",
                fontWeight: 900,
                color: ORANGE,
                lineHeight: 1,
              }}
            >
              GPT-Image-1.5
            </h3>
          </div>
        </div>

        {/* Content History Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "60px 40px",
                textAlign: "center",
                background: "rgba(12,12,12,0.02)",
                borderRadius: 16,
                border: "1px dashed rgba(12,12,12,0.1)",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(12,12,12,0.2)"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ margin: "0 auto 16px", display: "block" }}
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              <p
                style={{
                  color: "rgba(12,12,12,0.5)",
                  fontFamily: "Inter, sans-serif",
                  marginBottom: 8,
                }}
              >
                {searchTerm
                  ? "No content matches your search."
                  : "No content generated yet."}
              </p>
              <p
                style={{
                  color: "rgba(12,12,12,0.35)",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "0.72rem",
                }}
              >
                {searchTerm
                  ? "Try adjusting your search query."
                  : "Head to Content Studio to create your first AI post!"}
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <div
                key={post.id}
                style={{
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(12,12,12,0.1)",
                  borderRadius: 16,
                  padding: "24px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                {/* Image or placeholder */}
                <div
                  style={{
                    width: isMobile ? '100%' : 120,
                    height: isMobile ? 180 : 120,
                    borderRadius: 12,
                    flexShrink: 0,
                    overflow: "hidden",
                    border: "1px solid rgba(12,12,12,0.08)",
                  }}
                >
                  {post.imageUrl ? (
                    <SecureImage
                      src={post.imageUrl}
                      alt="AI Generated"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      fallback={
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(135deg, rgba(0,122,100,0.15) 0%, rgba(232,100,10,0.08) 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(12,12,12,0.3)" strokeWidth="1.5" strokeLinecap="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        </div>
                      }
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `linear-gradient(135deg, rgba(0,122,100,0.15) 0%, rgba(232,100,10,0.08) 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(12,12,12,0.3)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                          fontSize: "1.05rem",
                          color: NAVY,
                          marginBottom: 6,
                        }}
                      >
                        {post.title}
                      </h3>
                      <div
                        style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
                      >
                        {post.promptUsed?.dishName && (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "rgba(12,12,12,0.6)",
                            }}
                          >
                            <strong style={{ color: NAVY }}>Dish:</strong>{" "}
                            {post.promptUsed.dishName}
                          </p>
                        )}
                        {post.promptUsed?.tone && (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "rgba(12,12,12,0.6)",
                            }}
                          >
                            <strong style={{ color: NAVY }}>Tone:</strong>{" "}
                            {post.promptUsed.tone}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        fontFamily: "Space Mono, monospace",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "4px 10px",
                        borderRadius: 6,
                        color: post.status === "published" ? "#1a2332" : TEAL,
                        background:
                          post.status === "published"
                            ? "rgba(26,35,50,0.1)"
                            : "rgba(0,122,100,0.1)",
                      }}
                    >
                      {post.status === "published"
                        ? "Published"
                        : "AI Generated"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      marginBottom: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(12,12,12,0.6)",
                      }}
                    >
                      <strong style={{ color: NAVY }}>Model:</strong>{" "}
                      {post.model}
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(12,12,12,0.6)",
                      }}
                    >
                      <strong style={{ color: NAVY }}>Created:</strong>{" "}
                      {post.publishedDate} at {post.publishedTime}
                    </p>
                    {post.platform && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "rgba(12,12,12,0.6)",
                        }}
                      >
                        <strong style={{ color: NAVY }}>Platform:</strong>{" "}
                        {post.platform}
                      </p>
                    )}
                    {post.platformPostId && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "rgba(12,12,12,0.6)",
                        }}
                      >
                        <strong style={{ color: NAVY }}>Meta Post ID:</strong>{" "}
                        {post.platformPostId}
                      </p>
                    )}
                  </div>

                  {/* Caption preview */}
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(12,12,12,0.02)",
                      borderRadius: 8,
                      border: "1px solid rgba(12,12,12,0.06)",
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.8rem",
                        color: "rgba(12,12,12,0.7)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        maxHeight: 80,
                        overflow: "hidden",
                      }}
                    >
                      {post.fullCaption}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleViewPost(post)}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        border: "none",
                        background: TEAL,
                        color: "white",
                        fontFamily: "Space Mono, monospace",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        boxShadow: "0 2px 10px rgba(0,122,100,0.2)",
                      }}
                    >
                      ✏️ View & Edit
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard
                          .writeText(post.fullCaption)
                          .then(() => toast.success("Caption copied!"))
                          .catch(() => toast.error("Failed to copy"));
                      }}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        border: `1px solid ${TEAL}`,
                        background: "white",
                        color: TEAL,
                        fontFamily: "Space Mono, monospace",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                      }}
                    >
                      📋 Copy
                    </button>
                    {post.status !== "published" && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        style={{
                          padding: "8px 20px",
                          borderRadius: 8,
                          border: "1px solid rgba(220,38,38,0.3)",
                          background: "transparent",
                          color: "#dc2626",
                          fontFamily: "Space Mono, monospace",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </QueryState>
      <ToastContainer toasts={toasts} />
    </>
  );
}
