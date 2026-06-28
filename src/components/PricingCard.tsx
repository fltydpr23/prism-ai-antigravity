"use client";

import { Check, X, Lock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export interface PricingFeature {
  label: string;
  included: boolean | "locked" | string; // true = included, false = not included, "locked" = visible but locked, string = custom value (e.g. "3")
}

export interface PricingCardProps {
  tier: string;
  tagline: string;
  monthlyPrice: number | null; // null = "Free", 0 = custom
  annualPrice: number | null;
  billingPeriod: "monthly" | "annual";
  currency?: string;
  isPopular?: boolean;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant?: "primary" | "ghost";
  ctaOnClick?: () => void;
  features: PricingFeature[];
  accentColor?: string; // hsl string e.g. "162,85%,48%"
  index?: number;
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Free";
  if (price === 0) return "Custom";
  return `${currency}${price.toLocaleString("en-IN")}`;
}

export default function PricingCard({
  tier,
  tagline,
  monthlyPrice,
  annualPrice,
  billingPeriod,
  currency = "₹",
  isPopular = false,
  ctaLabel,
  ctaHref,
  ctaVariant = "ghost",
  ctaOnClick,
  features,
  accentColor = "162,85%,48%",
  index = 0,
}: PricingCardProps) {
  const displayPrice = billingPeriod === "annual" ? annualPrice : monthlyPrice;
  const isCustom = displayPrice === 0;
  const isFree = monthlyPrice === null;

  const includedFeatures = features.filter(f => f.included === true || typeof f.included === "string" && f.included !== "locked");
  const lockedFeatures = features.filter(f => f.included === "locked" || f.included === false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col rounded-2xl h-full group"
      style={{
        background: isPopular
          ? `radial-gradient(ellipse at top, hsla(${accentColor},0.13) 0%, #0A0A0A 55%)`
          : "#0A0A0A",
        border: isPopular
          ? `1px solid hsla(${accentColor},0.4)`
          : "1px solid rgba(255,255,255,0.07)",
        borderTopColor: isPopular
          ? `hsla(${accentColor},0.6)`
          : "rgba(255,255,255,0.12)",
        boxShadow: isPopular
          ? `0 0 0 1px hsla(${accentColor},0.08), 0 40px 80px rgba(0,0,0,0.6), 0 0 100px hsla(${accentColor},0.07)`
          : "0 16px 48px rgba(0,0,0,0.4)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase"
          style={{
            background: `linear-gradient(135deg, hsl(${accentColor}), hsl(195,90%,58%))`,
            color: "#000",
            boxShadow: `0 0 20px hsla(${accentColor},0.5), 0 0 60px hsla(${accentColor},0.2)`,
            letterSpacing: "0.12em",
          }}
        >
          Most Popular
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-col p-7 flex-1">

        {/* Tier header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: `hsl(${accentColor})`, boxShadow: `0 0 6px hsla(${accentColor},0.8)` }}
            />
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/40">
              {tier}
            </span>
          </div>
          <p className="text-xs text-white/35 leading-relaxed">{tagline}</p>
        </div>

        {/* Price */}
        <div className="mb-7">
          {isCustom ? (
            <div className="flex flex-col gap-1">
              <div className="text-4xl font-semibold tracking-tighter text-white">Custom</div>
              <p className="text-xs text-white/35">Tailored to your usage</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-semibold tracking-tighter text-white">
                  {billingPeriod === "annual" && annualPrice 
                    ? formatPrice(annualPrice * 12, currency)
                    : formatPrice(displayPrice, currency)}
                </span>
                {!isFree && !isCustom && (
                  <span className="text-sm text-white/30 mb-1.5 font-normal">
                    {billingPeriod === "annual" ? "/ yr" : "/ mo"}
                  </span>
                )}
              </div>
              {billingPeriod === "annual" && !isFree && !isCustom && annualPrice && monthlyPrice && (
                <p className="text-xs text-white/30">
                  That's {formatPrice(annualPrice, currency)}/mo ·{" "}
                  <span style={{ color: `hsl(${accentColor})` }} className="font-medium">
                    Save ₹{((monthlyPrice - annualPrice) * 12).toLocaleString("en-IN")}
                  </span>
                </p>
              )}
              {isFree && (
                <p className="text-xs text-white/30">No credit card required</p>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        {ctaOnClick ? (
          <button
            onClick={ctaOnClick}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-full text-sm font-semibold mb-7 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-lg"
            style={
              ctaVariant === "primary"
                ? {
                    background: `linear-gradient(135deg, hsl(${accentColor}), hsl(195,90%,58%))`,
                    color: "#000",
                    boxShadow: `0 0 24px hsla(${accentColor},0.35)`,
                  }
                : {
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.85)",
                  }
            }
          >
            {ctaLabel}
          </button>
        ) : (
          <Link
            href={ctaHref}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-full text-sm font-semibold mb-7 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-lg"
            style={
              ctaVariant === "primary"
                ? {
                    background: `linear-gradient(135deg, hsl(${accentColor}), hsl(195,90%,58%))`,
                    color: "#000",
                    boxShadow: `0 0 24px hsla(${accentColor},0.35)`,
                  }
                : {
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.85)",
                  }
            }
          >
            {ctaLabel}
          </Link>
        )}

        {/* Divider */}
        <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* Included features */}
        {includedFeatures.length > 0 && (
          <ul className="flex flex-col gap-3 mb-5">
            {includedFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs">
                <Check
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: `hsl(${accentColor})` }}
                />
                <span className="text-white/70 leading-relaxed">
                  {f.label}
                  {typeof f.included === "string" && (
                    <span className="text-white font-medium ml-1">: {f.included}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Locked features — shown visibly, greyed + lock icon (Strategy 1 & 5) */}
        {lockedFeatures.length > 0 && (
          <>
            <div className="h-px mb-4" style={{ background: "rgba(255,255,255,0.04)" }} />
            <ul className="flex flex-col gap-2.5">
              {lockedFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs group/lock">
                  <Lock
                    className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/15 group-hover/lock:text-white/30 transition-colors"
                  />
                  <span className="text-white/22 group-hover/lock:text-white/35 transition-colors leading-relaxed">
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </motion.div>
  );
}
