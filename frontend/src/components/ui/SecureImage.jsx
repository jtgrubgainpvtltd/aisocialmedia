import React, { useState, useEffect } from "react";
import { resolveMediaUrl } from "../../utils/mediaUrl";

/**
 * A secure image component that bypasses Ngrok's anti-abuse warning page hook for free accounts.
 * It uses fetch to grab the image blob safely, appending the required bypass headers.
 */
export default function SecureImage({ src, alt, fallback, className, style, ...props }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Resolve the raw path into the absolute API URL
    const absoluteUrl = resolveMediaUrl(src);

    if (!absoluteUrl) {
      setLoading(false);
      return;
    }

    if (absoluteUrl.startsWith("blob:") || absoluteUrl.startsWith("data:")) {
      setBlobUrl(absoluteUrl);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    // Fetch the image with the Ngrok bypass headers
    fetch(absoluteUrl, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Network response blocked or failed");
        return r.blob();
      })
      .then((blob) => {
        if (isMounted) {
          setBlobUrl(URL.createObjectURL(blob));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("SecureImage Fetch Error:", err);
        if (isMounted) {
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (error || !src) {
    return fallback || (
      <div 
        className={`bg-gray-200 flex items-center justify-center text-gray-400 text-xs ${className || ''}`} 
        style={{ width: "100%", height: "100%", minHeight: 100, borderRadius: 8, ...style }}
      >
        Image Unavailable
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      style={{ ...style, opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}
      {...props}
    />
  );
}
