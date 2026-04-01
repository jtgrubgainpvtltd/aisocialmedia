import { useState, useEffect } from "react";
import { google, integrations } from "../../api/client";
import { useToast, ToastContainer } from "../../components/Toast";

const TEAL = "#007A64";
const NAVY = "#1a2332";

export default function IntegrationsPage() {
  const { toasts, toast } = useToast();
  const [platforms, setPlatforms] = useState([
    {
      id: "instagram",
      name: "Instagram",
      icon: "📸",
      connected: false,
      account: null,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      connected: false,
      account: null,
    },
    {
      id: "google",
      name: "Google Business",
      icon: "📍",
      connected: false,
      account: null,
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      icon: "💬",
      connected: false,
      account: null,
      disabled: true,
    },
    {
      id: "twitter",
      name: "X / Twitter",
      icon: "🐦",
      connected: false,
      account: null,
      disabled: true,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [googlePropertyId, setGooglePropertyId] = useState("");
  const [ga4Summary, setGa4Summary] = useState(null);
  const [metaToken, setMetaToken] = useState("");
  const [metaPages, setMetaPages] = useState([]);
  const [selectedFacebookPageId, setSelectedFacebookPageId] = useState("");
  const [selectedInstagramPageId, setSelectedInstagramPageId] = useState("");
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaConnectLoading, setMetaConnectLoading] = useState(false);

  const [rules, setRules] = useState({
    useHashtagsIG: true,
    shortenX: true,
    removeHindiGoogle: false,
  });

  useEffect(() => {
    checkIntegrations();
    checkForOAuthCallback();

    // Listen for OAuth results from popup window
    const channel = new BroadcastChannel("meta_oauth");
    channel.onmessage = (event) => {
      if (event.data.type === "success") {
        setMetaToken(event.data.token);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        setTimeout(() => loadMetaPagesFromOAuth(event.data.token), 300);
      } else if (event.data.type === "error") {
        toast.error(`OAuth Error: ${event.data.error}`);
      }
      channel.close();
    };
    return () => channel.close();
  }, []);

  const checkForOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    const tempToken = params.get("temp_token");
    const oauthSuccess = params.get("oauth_success");
    const error = params.get("error");

    if (!oauthSuccess && !error) return; // Not a callback redirect

    // If this IS the popup window, broadcast the result to the parent and close
    if (window.opener) {
      const channel = new BroadcastChannel("meta_oauth");
      if (error) {
        channel.postMessage({
          type: "error",
          error: decodeURIComponent(error),
        });
      } else if (oauthSuccess && tempToken) {
        channel.postMessage({ type: "success", token: tempToken });
      }
      channel.close();
      window.close();
      return;
    }

    // If somehow we're on the main window (not a popup)
    if (error) {
      toast.error(`OAuth Error: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const loadMetaPagesFromOAuth = async (token) => {
    try {
      setMetaLoading(true);
      const { data } = await integrations.testPages(token);
      const pages = data?.data?.pages || [];
      setMetaPages(pages);
      const fbPage = pages[0]?.id || "";
      const igPage = pages.find((p) => p.hasInstagram)?.id || "";
      setSelectedFacebookPageId(fbPage);
      setSelectedInstagramPageId(igPage);

      // Show modal or scroll to selection
      const section = document.getElementById("meta-oauth-select");
      if (section)
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || "Failed to load Meta pages.",
      );
    } finally {
      setMetaLoading(false);
    }
  };

  const checkIntegrations = async () => {
    try {
      setLoading(true);
      const statusRes = await integrations.getAll();
      const statuses = statusRes.data?.data || [];
      const facebookStatus = statuses.find((s) => s.platform === "FACEBOOK");
      const instagramStatus = statuses.find((s) => s.platform === "INSTAGRAM");

      setPlatforms((prev) =>
        prev.map((p) => {
          if (p.id === "facebook") {
            const isConnected = !!facebookStatus?.connected;
            return {
              ...p,
              connected: isConnected,
              account: isConnected
                ? facebookStatus?.accountHandle?.pageName ||
                  facebookStatus?.accountHandle?.pageId ||
                  "Connected"
                : null,
              error: null,
            };
          }
          if (p.id === "instagram") {
            const isConnected = !!instagramStatus?.connected;
            return {
              ...p,
              connected: isConnected,
              account: isConnected
                ? instagramStatus?.accountHandle?.instagramAccountId ||
                  "Connected via FB Page"
                : null,
              error: null,
            };
          }
          if (p.id === "google") {
            return {
              ...p,
              connected: !!googleAccessToken,
              account: googleAccessToken ? "Google token connected" : null,
            };
          }
          return p;
        }),
      );
    } catch (err) {
      console.error("Integration test failed", err);
      setError("Failed to fetch integration status.");
    } finally {
      setLoading(false);
    }
  };

  const toggleConnect = async (id) => {
    if (id === "facebook" || id === "instagram") {
      // Start OAuth flow
      try {
        const { data } = await integrations.getMetaOAuthUrl();
        if (data?.success && data?.data?.url) {
          // Open popup or redirect
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          window.open(
            data.data.url,
            "MetaOAuth",
            `width=${width},height=${height},left=${left},top=${top}`,
          );
        } else {
          throw new Error("Invalid OAuth URL response");
        }
      } catch (err) {
        console.error("OAuth URL generation failed:", err);
        toast.error(
          "Failed to start OAuth flow. " +
            (err.response?.data?.error?.message || err.message),
        );
      }
    } else if (id === "google") {
      toast.info(
        'To connect Google Business Profile, click "Open Google OAuth" below to authorise your Google account.',
      );
    } else {
      toast.info(`Integration for ${id} is coming soon!`);
    }
  };

  const loadMetaPages = async () => {
    if (!metaToken.trim()) {
      toast.warn("Paste a Meta user token first");
      return;
    }
    try {
      setMetaLoading(true);
      const { data } = await integrations.testPages(metaToken.trim());
      const pages = data?.data?.pages || [];
      setMetaPages(pages);
      const fbPage = pages[0]?.id || "";
      const igPage = pages.find((p) => p.hasInstagram)?.id || "";
      setSelectedFacebookPageId(fbPage);
      setSelectedInstagramPageId(igPage);
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          "Failed to load Meta pages. Check token permissions.",
      );
    } finally {
      setMetaLoading(false);
    }
  };

  const connectMetaPlatform = async (targetPlatform) => {
    if (!metaToken) {
      toast.warn("No OAuth token available. Please complete OAuth flow first.");
      return;
    }

    const pageId =
      targetPlatform === "INSTAGRAM"
        ? selectedInstagramPageId
        : selectedFacebookPageId;
    if (!pageId) {
      toast.warn(`Select a page for ${targetPlatform}`);
      return;
    }

    try {
      setMetaConnectLoading(true);
      await integrations.completeMetaOAuth({
        userAccessToken: metaToken,
        selectedPageId: pageId,
        platform: targetPlatform,
      });
      await checkIntegrations();
      toast.success(`${targetPlatform} connected successfully!`);
      // Clear the temp token
      setMetaToken("");
      setMetaPages([]);
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message ||
          `Failed to connect ${targetPlatform}`,
      );
    } finally {
      setMetaConnectLoading(false);
    }
  };

  const connectGoogleOAuth = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/google/business/oauth-url`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      const data = await res.json();
      if (data?.success && data?.data?.url) {
        window.open(data.data.url, "_blank");
      }
    } catch (err) {
      toast.error("Unable to generate Google OAuth URL");
    }
  };

  const fetchGa4Report = async () => {
    if (!googleAccessToken || !googlePropertyId) {
      toast.warn("Enter Google access token and GA4 property ID first");
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/google/analytics/ga4-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "x-google-access-token": googleAccessToken,
          },
          body: JSON.stringify({ propertyId: googlePropertyId }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setGa4Summary({
          rows: data.data?.rows?.length || 0,
          metricHeaders: (data.data?.metricHeaders || [])
            .map((h) => h.name)
            .join(", "),
        });
      } else {
        toast.error(data?.error?.message || "Failed to fetch GA4 report");
      }
    } catch (err) {
      toast.error("Failed to fetch GA4 report");
    }
  };

  return (
    <>
      <div style={{ padding: "28px 32px", maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
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
            07 — Connections
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
            Integrations
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.85rem",
              color: "rgba(12,12,12,0.5)",
              marginTop: 6,
            }}
          >
            View and manage your connected social accounts.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 24,
              padding: "12px 16px",
              background: "#ffeeee",
              border: "1px solid #ffcccc",
              borderRadius: 8,
              color: "#cc0000",
              fontSize: "0.85rem",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px, 2fr) minmax(280px, 1fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Connections List */}
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(12,12,12,0.1)",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: NAVY,
                }}
              >
                Social Accounts
              </h3>
              <button
                onClick={checkIntegrations}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: TEAL,
                  cursor: "pointer",
                  fontFamily: "Space Mono, monospace",
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {loading ? "Testing..." : "Refresh Status"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {platforms.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    background: "rgba(12,12,12,0.02)",
                    border: "1px solid rgba(12,12,12,0.06)",
                    borderRadius: 12,
                    opacity: p.disabled ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <h4
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: NAVY,
                          marginBottom: 4,
                        }}
                      >
                        {p.name}{" "}
                        {p.disabled && (
                          <span
                            style={{
                              fontSize: "0.6rem",
                              background: "#eee",
                              padding: "2px 6px",
                              borderRadius: 4,
                              marginLeft: 6,
                            }}
                          >
                            SOON
                          </span>
                        )}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: p.connected
                              ? TEAL
                              : "rgba(12,12,12,0.2)",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: p.connected ? TEAL : "rgba(12,12,12,0.5)",
                            fontFamily: "Space Mono, monospace",
                          }}
                        >
                          {p.connected ? "Connected" : "Not Connected"}
                        </span>
                        {p.connected && p.account && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "rgba(12,12,12,0.6)",
                            }}
                          >
                            • {p.account}
                          </span>
                        )}
                      </div>
                      {!p.connected && p.error && (
                        <p
                          style={{
                            fontSize: "0.65rem",
                            color: "#cc0000",
                            marginTop: 4,
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Error: {p.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleConnect(p.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: p.connected
                        ? "1px solid rgba(12,12,12,0.15)"
                        : "none",
                      background: p.connected ? "transparent" : TEAL,
                      color: p.connected ? NAVY : "white",
                      fontFamily: "Space Mono, monospace",
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      transition: "all 0.15s",
                    }}
                  >
                    {p.connected ? "Manage" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Universal Rules */}
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(12,12,12,0.1)",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
            }}
          >
            <h3
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: "1rem",
                color: NAVY,
                marginBottom: 20,
              }}
            >
              Default Posting Rules
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={rules.useHashtagsIG}
                  onChange={(e) =>
                    setRules((r) => ({ ...r, useHashtagsIG: e.target.checked }))
                  }
                  style={{ marginTop: 2, accentColor: TEAL }}
                />
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: NAVY,
                      marginBottom: 2,
                    }}
                  >
                    Auto-add hashtags on Instagram
                  </span>
                  <span
                    style={{ fontSize: "0.75rem", color: "rgba(12,12,12,0.5)" }}
                  >
                    Appends predefined brand hashtags.
                  </span>
                </div>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                  opacity: 0.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={rules.shortenX}
                  disabled
                  style={{ marginTop: 2, accentColor: TEAL }}
                />
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: NAVY,
                      marginBottom: 2,
                    }}
                  >
                    Auto-shorten captions for X
                  </span>
                  <span
                    style={{ fontSize: "0.75rem", color: "rgba(12,12,12,0.5)" }}
                  >
                    Summarizes long captions to fit character limit.
                  </span>
                </div>
              </label>
            </div>

            <button
              style={{
                width: "100%",
                padding: "12px",
                marginTop: 24,
                borderRadius: 8,
                border: "none",
                background: "rgba(0,122,100,0.1)",
                color: TEAL,
                cursor: "pointer",
                fontFamily: "Space Mono, monospace",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              Save Rules
            </button>

            <div
              style={{
                marginTop: 20,
                borderTop: "1px solid rgba(12,12,12,0.08)",
                paddingTop: 16,
              }}
            >
              <h4
                id="meta-oauth-select"
                style={{
                  margin: 0,
                  marginBottom: 10,
                  fontSize: "0.85rem",
                  color: NAVY,
                }}
              >
                {metaPages.length > 0
                  ? "Complete Facebook/Instagram Connection"
                  : "Facebook & Instagram Integration"}
              </h4>

              {metaPages.length === 0 ? (
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: 12,
                    fontSize: "0.72rem",
                    color: "rgba(12,12,12,0.58)",
                  }}
                >
                  Click "Connect" on Facebook or Instagram above to start OAuth
                  flow. You'll be redirected to Meta to authorize GrubGain.
                </p>
              ) : (
                <>
                  <p
                    style={{
                      marginTop: 0,
                      marginBottom: 12,
                      fontSize: "0.72rem",
                      color: "rgba(12,12,12,0.58)",
                    }}
                  >
                    Select which Facebook page to connect. If the page has an
                    Instagram business account, you can connect that too.
                  </p>
                  <select
                    value={selectedFacebookPageId}
                    onChange={(e) => setSelectedFacebookPageId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginBottom: 8,
                      borderRadius: 8,
                      border: "1px solid rgba(12,12,12,0.15)",
                    }}
                  >
                    {metaPages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => connectMetaPlatform("FACEBOOK")}
                    disabled={metaConnectLoading}
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      padding: "10px",
                      borderRadius: 8,
                      border: "none",
                      background: TEAL,
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {metaConnectLoading ? "Connecting..." : "Connect Facebook"}
                  </button>

                  {metaPages.some((p) => p.hasInstagram) && (
                    <>
                      <select
                        value={selectedInstagramPageId}
                        onChange={(e) =>
                          setSelectedInstagramPageId(e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginBottom: 8,
                          borderRadius: 8,
                          border: "1px solid rgba(12,12,12,0.15)",
                        }}
                      >
                        <option value="">Select Page with Instagram</option>
                        {metaPages
                          .filter((p) => p.hasInstagram)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (IG: {p.instagramAccountId})
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => connectMetaPlatform("INSTAGRAM")}
                        disabled={metaConnectLoading}
                        style={{
                          width: "100%",
                          marginBottom: 12,
                          padding: "10px",
                          borderRadius: 8,
                          border: "none",
                          background: "#1a2332",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {metaConnectLoading
                          ? "Connecting..."
                          : "Connect Instagram"}
                      </button>
                    </>
                  )}
                </>
              )}

              <h4
                style={{
                  margin: 0,
                  marginBottom: 10,
                  fontSize: "0.85rem",
                  color: NAVY,
                }}
              >
                Google Business / GA4
              </h4>
              <button
                onClick={connectGoogleOAuth}
                style={{
                  width: "100%",
                  marginBottom: 10,
                  padding: "10px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,122,100,0.3)",
                  background: "white",
                  color: TEAL,
                  cursor: "pointer",
                }}
              >
                Open Google OAuth
              </button>
              <input
                value={googleAccessToken}
                onChange={(e) => setGoogleAccessToken(e.target.value)}
                placeholder="Paste Google access token"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: 8,
                  borderRadius: 8,
                  border: "1px solid rgba(12,12,12,0.15)",
                }}
              />
              <input
                value={googlePropertyId}
                onChange={(e) => setGooglePropertyId(e.target.value)}
                placeholder="GA4 property ID (e.g. 123456789)"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: 8,
                  borderRadius: 8,
                  border: "1px solid rgba(12,12,12,0.15)",
                }}
              />
              <button
                onClick={fetchGa4Report}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: TEAL,
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Fetch GA4 Report
              </button>
              {ga4Summary && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: "0.75rem",
                    color: "rgba(12,12,12,0.7)",
                  }}
                >
                  GA4 report rows: {ga4Summary.rows}. Metrics:{" "}
                  {ga4Summary.metricHeaders || "N/A"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}
