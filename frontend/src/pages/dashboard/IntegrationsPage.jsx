import { useState, useEffect } from "react";
import { integrations } from "../../api/client";
import { useToast, ToastContainer } from "../../components/Toast";
import { useIsSmallScreen } from "../../utils/useIsSmallScreen";

const TEAL = "#007A64";
const NAVY = "#1a2332";

// --- Brand Icons (Custom SVGs) ---
const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);
const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
);
const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z"/></svg>
);

export default function IntegrationsPage() {
  const { toasts, toast } = useToast();
  const isMobile = useIsSmallScreen();
  const [platforms, setPlatforms] = useState([
    {
      id: "instagram",
      name: "Instagram",
      displayName: "Instagram Business",
      icon: <InstagramIcon />,
      connected: false,
      account: null,
      tokenDays: null,
    },
    {
      id: "facebook",
      name: "Facebook",
      displayName: "Facebook Page",
      icon: <FacebookIcon />,
      connected: false,
      account: null,
      tokenDays: null,
    },
    {
      id: "google",
      name: "Google Business",
      displayName: "Google Business Profile",
      icon: <GoogleIcon />,
      connected: false,
      account: null,
      tokenDays: null,
      disabled: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      displayName: "WhatsApp Business API",
      icon: <WhatsAppIcon />,
      connected: false,
      account: null,
      tokenDays: null,
      disabled: true,
    },
    {
      id: "twitter",
      name: "X / Twitter",
      displayName: "X / Twitter Account",
      icon: <XIcon />,
      connected: false,
      account: null,
      tokenDays: null,
      disabled: true,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [oauthPages, setOauthPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("FACEBOOK");
  const [connectingOAuth, setConnectingOAuth] = useState(false);

  useEffect(() => {
    checkIntegrations();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success") === "true") {
      loadOAuthPages();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const calculateTokenDays = (expiryDate) => {
    if (!expiryDate) return null;
    try {
      const now = new Date();
      const expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) return null;
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return null;
    }
  };

  const checkIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusRes = await integrations.getAll();
      const statuses = statusRes.data?.data || [];
      
      setPlatforms((prev) =>
        prev.map((p) => {
          // Robust platform matching (handles both 'google' vs 'GOOGLE_BUSINESS')
          const status = statuses.find((s) => {
            const sid = (s.platform || '').toUpperCase();
            const pid = (p.id || '').toUpperCase();
            return sid === pid || (pid === 'GOOGLE' && sid === 'GOOGLE_BUSINESS');
          });

          if (status) {
            const isConnected = !!status.connected;
            return {
              ...p,
              connected: isConnected,
              account: isConnected
                ? status.accountHandle?.pageName || status.accountHandle?.instagramUsername || status.accountHandle?.name || "Connected"
                : null,
              tokenDays: calculateTokenDays(status.tokenExpiresAt),
            };
          }
          return p;
        }),
      );
    } catch (err) {
      console.error("Integration check failed:", err);
      setError("Unable to sync account statuses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const loadOAuthPages = async () => {
    try {
      const { data } = await integrations.getMetaOAuthPages();
      const pages = data?.data?.pages || [];
      setOauthPages(pages);
      if (pages.length > 0) {
        setSelectedPageId(pages[0].pageId);
      }
    } catch {
      toast.error("OAuth session expired. Please reconnect.");
      setOauthPages([]);
      setSelectedPageId("");
    }
  };

  const completeOAuthConnection = async () => {
    if (!selectedPageId) {
      toast.error("Please select a Facebook page first.");
      return;
    }
    try {
      setConnectingOAuth(true);
      await integrations.completeMetaOAuth({
        selectedPageId,
        platform: selectedPlatform,
      });
      toast.success(`${selectedPlatform} connected successfully.`);
      setOauthPages([]);
      setSelectedPageId("");
      await checkIntegrations();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to complete OAuth connection.");
    } finally {
      setConnectingOAuth(false);
    }
  };

  const toggleConnect = async (id) => {
    const platform = platforms.find(p => p.id === id);
    if (platform?.disabled) return;

    if (id === "facebook" || id === "instagram") {
      try {
        const { data } = await integrations.getMetaOAuthUrl();
        if (data?.success && data?.data?.url) {
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          window.open(
            data.data.url,
            "MetaOAuth",
            `width=${width},height=${height},left=${left},top=${top}`,
          );
        }
      } catch (err) {
        toast.error("Failed to start OAuth flow.");
      }
    } else {
      toast.info(`Integration for ${id} is coming soon!`);
    }
  };

  return (
    <>
      <div style={{ padding: isMobile ? "20px 16px" : "28px 32px", maxWidth: 1100 }}>
        {/* Header content... same as before */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(12,12,12,0.4)",
            marginBottom: 8,
          }}>
            System Connectivity
          </p>
          <h1 style={{
            fontFamily: "Unbounded, sans-serif",
            fontWeight: 900,
            fontSize: "1.8rem",
            letterSpacing: "-0.03em",
            color: NAVY,
            lineHeight: 1,
          }}>
            Integrations
          </h1>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.9rem",
            color: "rgba(12,12,12,0.5)",
            marginTop: 8,
          }}>
            Manage your social accounts and monitor connection health.
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: 24,
            padding: "16px",
            background: "#ffeeee",
            border: "1px solid #ffcccc",
            borderRadius: 12,
            color: "#cc0000",
            fontSize: "0.85rem",
          }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Section 1: Social Accounts List */}
          <div style={{
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(12,12,12,0.1)",
            borderRadius: 20,
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}>
              <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "1.1rem", color: NAVY }}>
                Social Accounts
              </h3>
              <button onClick={checkIntegrations} disabled={loading} style={{
                background: "transparent", border: "none", color: TEAL, cursor: "pointer",
                fontFamily: "Space Mono, monospace", fontSize: "0.65rem", textTransform: "uppercase",
                letterSpacing: "0.1em", fontWeight: 600
              }}>
                {loading ? "Refreshing..." : "Refresh Status"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {platforms.map((p) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", background: p.disabled ? "rgba(12,12,12,0.01)" : "rgba(12,12,12,0.03)",
                  border: "1px solid rgba(12,12,12,0.06)", borderRadius: 14,
                  opacity: p.disabled ? 0.7 : 1, transition: "all 0.2s ease"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.3rem", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    }}>
                      {p.icon}
                    </div>
                    <div>
                      <h4 style={{
                        fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.95rem",
                        color: NAVY, marginBottom: 4, display: "flex", alignItems: "center", gap: 8
                      }}>
                        {p.name}
                        {p.disabled && (
                          <span style={{ fontSize: "0.55rem", background: "#E2E8F0", color: "#475569", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                            SOON
                          </span>
                        )}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                          background: p.connected ? TEAL : (p.disabled ? "rgba(12,12,12,0.1)" : "#CBD5E1"),
                          boxShadow: p.connected ? `0 0 8px ${TEAL}` : "none"
                        }} />
                        <span style={{
                          fontSize: "0.75rem", color: p.connected ? TEAL : "rgba(12,12,12,0.5)",
                          fontFamily: "Space Mono, monospace",
                        }}>
                          {p.connected ? "Connected" : (p.disabled ? "Unavailable" : "Not Connected")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleConnect(p.id)}
                    disabled={p.disabled}
                    style={{
                      padding: "10px 18px", borderRadius: 10, cursor: p.disabled ? "not-allowed" : "pointer",
                      border: p.connected ? "1px solid rgba(12,12,12,0.15)" : "none",
                      background: p.connected ? "transparent" : (p.disabled ? "#F1F5F9" : TEAL),
                      color: p.connected ? NAVY : (p.disabled ? "#94A3B8" : "white"),
                      fontFamily: "Space Mono, monospace", fontSize: "0.65rem", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >
                    {p.connected ? "Manage" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Connection Health (Now Synchronized) */}
          <div style={{
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(12,12,12,0.1)",
            borderRadius: 20,
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "1.1rem", color: NAVY, marginBottom: 24 }}>
              Connection Health
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {platforms.filter(p => !p.disabled).map(p => (
                <div key={`${p.id}-health`} style={{ 
                  display: "flex", alignItems: "center", gap: 12, padding: "16px", 
                  background: p.connected ? "rgba(0,122,100,0.04)" : "rgba(12,12,12,0.02)", 
                  borderRadius: 16, border: `1px solid ${p.connected ? "rgba(0,122,100,0.12)" : "rgba(12,12,12,0.08)"}` 
                }}>
                  <div style={{ 
                    width: 10, height: 10, borderRadius: "50%", 
                    background: p.connected ? TEAL : "#CBD5E1", 
                    boxShadow: p.connected ? `0 0 10px ${TEAL}` : "none" 
                  }} />
                  <div>
                    <p style={{ fontSize: "0.85rem", color: NAVY, fontWeight: 600, marginBottom: 2 }}>
                      {p.displayName}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: p.connected ? TEAL : "rgba(12,12,12,0.5)", opacity: 0.8, fontFamily: "Space Mono, monospace" }}>
                      {p.connected 
                        ? `Connected — Token valid for ${p.tokenDays || '??'} days` 
                        : "Not Connected — Action Required"}
                    </p>
                  </div>
                </div>
              ))}

              {/* Info Box */}
              <div style={{ marginTop: "auto", padding: "20px", borderRadius: 16, background: "rgba(12,12,12,0.03)", border: "1px dashed rgba(12,12,12,0.15)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1rem" }}>💡</span>
                  <p style={{ fontSize: "0.78rem", color: "rgba(12,12,12,0.6)", lineHeight: 1.6 }}>
                    <strong>Proactive Monitoring:</strong> Our background workers verify your account tokens daily. If a connection requires re-authentication, you'll receive an email notification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {oauthPages.length > 0 && (
            <div style={{
              marginTop: 16,
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(12,12,12,0.1)",
              borderRadius: 16,
              padding: "16px",
            }}>
              <h4 style={{ marginBottom: 10, color: NAVY, fontWeight: 700 }}>Complete OAuth Connection</h4>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={selectedPageId}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  style={{ padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 240 }}
                >
                  {oauthPages.map((p) => (
                    <option key={p.pageId} value={p.pageId}>
                      {p.pageName} ({p.pageId})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  style={{ padding: "10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                >
                  <option value="FACEBOOK">FACEBOOK</option>
                  <option value="INSTAGRAM">INSTAGRAM</option>
                </select>

                <button
                  onClick={completeOAuthConnection}
                  disabled={connectingOAuth}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: TEAL,
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {connectingOAuth ? "Connecting..." : "Complete Connection"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}
