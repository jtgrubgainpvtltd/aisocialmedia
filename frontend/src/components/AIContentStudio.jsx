import { useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { content, posts, analytics } from "../api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LANGUAGES, PLATFORMS, TONES } from "../constants/platforms";
import { useAuth } from "../context/AuthContext";
import ImageCropperModal from "./ImageCropperModal";
import { useToast, ToastContainer } from "./Toast";
import { PreviewInstagramPost, PreviewInstagramStory, PreviewTwitter, PreviewFacebook, PreviewWhatsApp } from "./SocialPreviews";
import SelectField from "./ui/SelectField";
import { resolveMediaUrl } from "../utils/mediaUrl";


const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
).replace("/api/v1", "");

const platforms = PLATFORMS.map((p) => p.label);
const languages = LANGUAGES.map((l) => l.label);
const tones = TONES.map((t) => t.label);

const CAMPAIGN_TYPES = [
  "General Branding",
  "Festival Greeting",
  "Discount Offer",
  "Menu Highlight",
];
const FORMAT_OPTIONS = {
  'Instagram': ['Post', 'Story'],
  'Facebook': ['Post', 'Story'],
  'Twitter / X': ['Post'],
  'WhatsApp Status': ['Status'],
  'Google Business': ['Post']
};

const ASPECT_RATIOS = [
  "Square (1:1)",
  "Portrait (4:5)",
  "Landscape (16:9)",
  "Full Vertical (9:16)"
];

const sizeMap = {
  'Square (1:1)': '1024x1024',
  'Portrait (4:5)': '1024x1024',
  'Landscape (16:9)': '1792x1024',
  'Full Vertical (9:16)': '1024x1792',
  'Story': '1024x1792',
  'Status': '1024x1792',
};

export default function AIContentStudio() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toasts, toast } = useToast();
  const queryClient = useQueryClient();
  const historyToastShownRef = useRef(false);
  const prefillAppliedRef = useRef(false);

  const [platform, setPlatform] = useState(platforms[0]);
  const [language, setLanguage] = useState(languages[0]);
  const [tone, setTone] = useState(tones[0]);

  // New configuration options
  const [campaignType, setCampaignType] = useState(CAMPAIGN_TYPES[0]);
  const [format, setFormat] = useState(FORMAT_OPTIONS[platforms[0]][0]);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);

  useEffect(() => {
    const availableFormats = FORMAT_OPTIONS[platform] || ['Post'];
    if (!availableFormats.includes(format)) {
      setFormat(availableFormats[0]);
    }
  }, [platform, format]);

  // Sync aspect ratio when format changes
  useEffect(() => {
    if (format === 'Story' || format === 'Status') {
      setAspectRatio("Full Vertical (9:16)");
    } else if (format === 'Post' && aspectRatio === "Full Vertical (9:16)") {
      setAspectRatio("Square (1:1)");
    }
  }, [format]);

  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [includeCTA, setIncludeCTA] = useState(true);
  const [addEmojis, setAddEmojis] = useState(true);
  const [autoHashtags, setAutoHashtags] = useState(true);

  // Generated content state
  const [captionEn, setCaptionEn] = useState("");
  const [captionHi, setCaptionHi] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [imageUrl, setImageUrl] = useState("");

  // Cropper state
  const [showCropModal, setShowCropModal] = useState(false);

  // Pre-fill from URL params (e.g. from City Feed or History)
  useEffect(() => {
    if (prefillAppliedRef.current) return;

    const urlPrompt = searchParams.get("prompt");
    const urlCaption = searchParams.get("caption");
    const urlImageUrl = searchParams.get("imageUrl");
    const urlPlatform = searchParams.get("platform");
    const historyPayload = location.state?.historyEditPayload || null;
    const cityFeedPayload = location.state?.cityFeedPayload || null;

    if (urlPrompt) {
      setPrompt(decodeURIComponent(urlPrompt));
    }

    if (cityFeedPayload?.prompt) {
      setPrompt(cityFeedPayload.prompt);
      if (cityFeedPayload.trendType) {
        if (String(cityFeedPayload.trendType).toLowerCase().includes("event")) {
          setCampaignType("Festival Greeting");
        } else if (String(cityFeedPayload.trendType).toLowerCase().includes("sports")) {
          setCampaignType("General Branding");
        }
      }
    }

    // If coming from History page, pre-fill everything
    if (historyPayload) {
      const resolvedCaption = historyPayload?.caption || (urlCaption ? decodeURIComponent(urlCaption) : "");
      const resolvedImageUrl = historyPayload?.imageUrl || (urlImageUrl ? decodeURIComponent(urlImageUrl) : "");
      const resolvedPlatform = historyPayload?.platform || (urlPlatform ? decodeURIComponent(urlPlatform) : "");

      if (resolvedCaption) {
        const caption = resolvedCaption;
        // Try to split bilingual caption
        const parts = caption.split(/\n{2,}/);
        if (parts.length >= 2) {
          setCaptionEn(parts[0].trim());
          setCaptionHi(parts[1].trim());
        } else {
          setCaptionEn(caption);
        }
        
        // Extract hashtags
        const hashtagRegex = /#\w+/g;
        const foundHashtags = caption.match(hashtagRegex) || [];
        setHashtags(foundHashtags);
      }
      
      if (resolvedImageUrl) {
        // Rewrite any localhost:5000 URLs to the live backend origin
        setImageUrl(resolveMediaUrl(resolvedImageUrl));
      }
      
      if (resolvedPlatform) {
        // Normalize platform casing: DB has uppercase, UI expects title case
        const normalizedPlatform = resolvedPlatform.toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setPlatform(normalizedPlatform);
      }
      
      setGenerated(true); // Mark as generated so buttons appear
      
      // Show toast only once (avoid double-render in dev mode)
      if (!historyToastShownRef.current) {
        toast.success('Post loaded from history! You can edit, crop, or schedule.');
        historyToastShownRef.current = true;
      }
    }
    prefillAppliedRef.current = true;
  }, [searchParams, location.state, toast]);

  // Scheduler state
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Fetch best times
  const { data: bestTimesData } = useQuery({
    queryKey: ["bestTimes"],
    queryFn: () => analytics.getBestTimes().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
  const bestTimes = bestTimesData || [];

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      setError("Please select both date and time to schedule.");
      return;
    }
    setScheduling(true);
    setError("");
    try {
      const fullCaption =
        `${captionEn}\n\n${captionHi}\n\n${hashtags.join(" ")}`.trim();
      const res = await posts.schedule({
        platform: platform.toUpperCase(),
        scheduled_date: scheduleDate,
        scheduled_time: scheduleTime,
        caption: fullCaption,
        image_url: imageUrl,
      });
      if (res.data.success) {
        toast.success("Post scheduled! View it in the Scheduler tab.");
        setShowScheduler(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to schedule post.");
    } finally {
      setScheduling(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    setError("");

    try {
      const { data } = await content.generate({
        // Restaurant data is pulled server-side from the user's DB profile.
        // These are passed as optional overrides only.
        tone: tone.toLowerCase(),
        language: language,
        platform: platform.toUpperCase(),
        campaignType: campaignType,
        occasion: prompt || undefined,
        hashtags: autoHashtags
          ? ["GrubGain", "FoodLovers", "RestaurantLife"]
          : [],
        imageSize: format === 'Post' ? (sizeMap[aspectRatio] || "1024x1024") : (sizeMap[format] || "1024x1792"),
        imageQuality: "high",
        includeCTA: includeCTA,
        addEmojis: addEmojis,
        autoHashtags: autoHashtags,
        generateImage: true,
        contentStudioContext: {
          campaignType,
          format,
          aspectRatio,
          platformLabel: platform,
          languageLabel: language,
          toneLabel: tone,
          customPrompt: prompt || "",
          includeCTA,
          addEmojis,
          autoHashtags,
        },
        cityFeedContext: location.state?.cityFeedPayload || null,
      });

      if (data.success) {
        const captionText = data.data.caption || "";

        // Try to split bilingual caption
        const parts = captionText.split(/\n{2,}/);
        if (parts.length >= 2) {
          setCaptionEn(parts[0].trim());
          setCaptionHi(parts[1].trim());
        } else {
          setCaptionEn(captionText);
          setCaptionHi("");
        }

        // Extract hashtags from caption
        const hashtagRegex = /#\w+/g;
        const foundHashtags = (data.data.caption || "").match(hashtagRegex) || [];
        setHashtags(foundHashtags.length > 0 ? foundHashtags : []);

        const rawUrl = data.data.imageUrl || "";
        
        // resolveMediaUrl handles relative paths, absolute paths,
        // and rewrites any leftover localhost origins to the live backend.
        setImageUrl(resolveMediaUrl(rawUrl));
        setGenerated(true);

        // Ensure History page fetches the newly generated content when visited next
        queryClient.invalidateQueries({ queryKey: ["content-history"] });
      } else {
        setError("Content generation failed. Please try again.");
      }
    } catch (err) {
      console.error("Generation error:", err);
      
      let errorMsg = "Failed to generate content. Check your API connection.";
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        errorMsg = err.response.data.errors[0].msg;
      } else if (err.response?.data?.error?.message) {
        errorMsg = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishNow = async () => {
    if (!generated) {
      setError("Generate content first before publishing.");
      return;
    }
    if (
      platform.toUpperCase() !== "FACEBOOK" &&
      platform.toUpperCase() !== "INSTAGRAM"
    ) {
      setError("Publish Now currently supports Facebook and Instagram only.");
      return;
    }
    if (platform.toUpperCase() === "INSTAGRAM" && !imageUrl) {
      setError(
        "Instagram publishing requires an image. Please generate with image.",
      );
      return;
    }

    setPublishing(true);
    setError("");
    try {
      const fullCaption =
        `${captionEn}\n\n${captionHi}\n\n${hashtags.join(" ")}`.trim();
      const res = await posts.publishNow({
        platform: platform.toUpperCase(),
        caption: fullCaption,
        image_url: imageUrl || null,
      });
      if (res.data.success) {
        toast.success(
          `Published! Meta Post ID: ${res.data.data?.platform_post_id || "N/A"}`,
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to publish now.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = () => {
    const fullCaption =
      `${captionEn}\n\n${captionHi}\n\n${hashtags.join(" ")}`.trim();
    navigator.clipboard
      .writeText(fullCaption)
      .then(() => toast.success("Caption copied to clipboard!"))
      .catch(() => toast.error("Failed to copy — check clipboard permissions"));
  };
  // Calculate aspect ratio for preview container
  const getPreviewAspectRatio = () => {
    if (format === 'Story' || format === 'Status') return "9 / 16";
    if (aspectRatio.includes('1:1')) return "1 / 1";
    if (aspectRatio.includes('4:5')) return "4 / 5";
    if (aspectRatio.includes('16:9')) return "16 / 9";
    return "1 / 1";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start p-8">
      {/* ─── Left: Data Inputs ─── */}
      <div
        className="glass-card"
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2 font-unbounded" style={{ color: "var(--fg)" }}>
            Content Studio
          </h3>
          <p className="text-sm opacity-60" style={{ fontFamily: "Inter, sans-serif" }}>
            Design professional marketing posters and captions in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <SelectField label="Campaign Type" options={CAMPAIGN_TYPES} value={campaignType} onChange={setCampaignType} />
          <SelectField label="Format" options={FORMAT_OPTIONS[platform] || ['Post']} value={format} onChange={setFormat} />
          <SelectField label="Target Platform" options={platforms} value={platform} onChange={setPlatform} />
          <SelectField label="Caption Language" options={languages} value={language} onChange={setLanguage} />
          <SelectField label="Brand Voice" options={tones} value={tone} onChange={setTone} />
          {format === 'Post' && (
            <SelectField label="Aspect Ratio" options={ASPECT_RATIOS.filter(r => r !== "Full Vertical (9:16)")} value={aspectRatio} onChange={setAspectRatio} />
          )}
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <label className="text-[0.6rem] tracking-[0.2em] uppercase opacity-40 font-bold font-mono-custom">
            Custom Context / Offer Details
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 'Flat 20% OFF' or 'Diwali greetings with a focus on festive sweets'"
            rows={3}
            className="w-full resize-none px-5 py-4 rounded-2xl text-sm transition-all outline-none"
            style={{
              background: "rgba(255,255,255,0.4)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.6,
            }}
          />
        </div>

        <div className="flex flex-wrap gap-6 p-5 rounded-2xl mb-8" style={{ background: "var(--teal-muted)", border: "1px solid var(--teal-light)" }}>
          {[
            { label: "Add CTA", checked: includeCTA, onChange: setIncludeCTA },
            { label: "Emojis", checked: addEmojis, onChange: setAddEmojis },
            { label: "Hashtags", checked: autoHashtags, onChange: setAutoHashtags },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={opt.checked}
                onChange={() => opt.onChange((v) => !v)}
                className="accent-teal-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: "var(--fg)", fontFamily: "Inter, sans-serif" }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl mb-8" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)" }}>
            <span className="text-red-600 text-xs font-medium">{error}</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-5 rounded-2xl font-bold text-white tracking-widest uppercase transition-all flex items-center justify-center gap-3 active:scale-[0.98] font-unbounded"
          style={{
            fontSize: "0.75rem",
            background: generating ? "rgba(0,122,100,0.4)" : "linear-gradient(135deg, var(--teal) 0%, #00a486 100%)",
            boxShadow: generating ? "none" : "0 10px 30px rgba(0,122,100,0.2)",
            border: "none",
            cursor: generating ? "wait" : "pointer"
          }}
        >
          {generating ? (
            <>
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
              Thinking...
            </>
          ) : "Generate Content"}
        </button>
      </div>

      {/* ─── Right: Dynamic Preview ─── */}
      <div
        className="glass-card"
        style={{
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Preview Container */}
        <div style={{ padding: 40, background: "rgba(0,0,0,0.03)", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
          {platform === 'Instagram' && format === 'Post' && (
            <PreviewInstagramPost 
              imageUrl={generated ? imageUrl : ''} 
              captionEn={captionEn} 
              captionHi={captionHi} 
              restaurantName={user?.restaurantName || user?.name} 
              avatarUrl={user?.logoUrl ? (user.logoUrl.startsWith('http') ? user.logoUrl : `${BACKEND_ORIGIN}${user.logoUrl}`) : ''} 
              generating={generating} 
              language={language}
              aspectRatio={getPreviewAspectRatio()}
            />
          )}
          {platform === 'Instagram' && format === 'Story' && (
            <PreviewInstagramStory 
              imageUrl={generated ? imageUrl : ''} 
              restaurantName={user?.restaurantName || user?.name} 
              avatarUrl={user?.logoUrl ? (user.logoUrl.startsWith('http') ? user.logoUrl : `${BACKEND_ORIGIN}${user.logoUrl}`) : ''} 
              generating={generating} 
            />
          )}
          {platform === 'Twitter / X' && (
            <PreviewTwitter 
              imageUrl={generated ? imageUrl : ''} 
              captionEn={captionEn} 
              captionHi={captionHi} 
              restaurantName={user?.restaurantName || user?.name} 
              avatarUrl={user?.logoUrl ? (user.logoUrl.startsWith('http') ? user.logoUrl : `${BACKEND_ORIGIN}${user.logoUrl}`) : ''} 
              generating={generating} 
              language={language}
              aspectRatio={getPreviewAspectRatio()}
            />
          )}
          {(platform === 'Facebook' || platform === 'Google Business') && (
            <PreviewFacebook 
              imageUrl={generated ? imageUrl : ''} 
              captionEn={captionEn} 
              captionHi={captionHi} 
              restaurantName={user?.restaurantName || user?.name} 
              avatarUrl={user?.logoUrl ? (user.logoUrl.startsWith('http') ? user.logoUrl : `${BACKEND_ORIGIN}${user.logoUrl}`) : ''} 
              generating={generating} 
              language={language}
              aspectRatio={getPreviewAspectRatio()}
            />
          )}
          {platform === 'WhatsApp Status' && (
            <PreviewWhatsApp 
              imageUrl={generated ? imageUrl : ''} 
              captionEn={captionEn} 
              captionHi={captionHi} 
              generating={generating} 
            />
          )}
        </div>

        {/* Actions Row */}
        {generated && imageUrl && (
          <div style={{ padding: "16px 24px", background: "rgba(255,255,255,0.4)", borderTop: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setShowCropModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-[0.6rem] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors shadow-sm font-unbounded">
              ✂️ Crop
            </button>
            <button onClick={() => setShowScheduler(!showScheduler)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--teal)] text-white text-[0.6rem] font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-sm font-unbounded">
              📅 {showScheduler ? 'Cancel' : 'Schedule'}
            </button>
            <button onClick={handlePublishNow} disabled={publishing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8640A] text-white text-[0.6rem] font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-sm font-unbounded">
              🚀 {publishing ? 'Publishing...' : 'Publish Now'}
            </button>
            <a href={imageUrl} download className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-black text-[0.6rem] font-bold uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm font-unbounded">
              ⬇️ Download
            </a>
          </div>
        )}

        {/* Inline Scheduler */}
        {showScheduler && (
          <div style={{ padding: 24, background: "rgba(0,0,0,0.02)", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 16 }}>
            <h4 style={{ color: "var(--fg)", fontSize: "0.9rem", margin: 0, fontWeight: 700 }}>Choose Time</h4>
            <div className="flex gap-4">
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm outline-none focus:border-[var(--teal)]" />
              <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm outline-none focus:border-[var(--teal)]" />
            </div>
            {bestTimes.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[0.6rem] uppercase opacity-40 font-bold mr-2 font-mono-custom">✨ AI Suggests:</span>
                {bestTimes.map(t => (
                  <button key={t} onClick={() => setScheduleTime(t)} className={`px-3 py-1.5 rounded-lg text-[0.65rem] font-mono border transition-all ${scheduleTime === t ? 'bg-[var(--teal)] border-transparent text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-[var(--teal)]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            <button
               onClick={handleSchedule}
               disabled={scheduling}
               className="w-full py-3.5 rounded-xl bg-[var(--teal)] text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all shadow-md font-unbounded"
            >
              {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        )}

        {/* Text Area */}
        <div style={{ padding: 24, borderTop: "1px solid var(--border)", flex: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.6rem] uppercase opacity-40 font-bold tracking-[0.2em] font-mono-custom">Generated Copy</span>
            <button onClick={handleCopy} disabled={!generated} className="text-[0.6rem] font-bold text-[var(--teal)] uppercase tracking-wider disabled:opacity-20 font-unbounded">Copy Text</button>
          </div>
          <div style={{ color: "var(--fg)", fontSize: "0.85rem", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>
            {(!captionEn && !captionHi) ? (
              <p className="opacity-40 italic">No {language} caption generated...</p>
            ) : (
              <>
                {captionEn && <p className="mb-4">{captionEn}</p>}
                {captionHi && <p className="mb-4 opacity-80">{captionHi}</p>}
              </>
            )}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {hashtags.map((h, i) => (
                  <span key={i} className="text-[var(--teal)] font-medium">#{h.replace(/^#/, '')}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageCropperModal open={showCropModal} imageSrc={imageUrl} onClose={() => setShowCropModal(false)} onCropCompleteCallback={setImageUrl} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
