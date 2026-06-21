"use client";

import { useRouter } from "next/navigation";
import PrismLanding from "@/components/PrismLanding";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <div className="aurora-bg opacity-50" />
      <PrismLanding onStart={() => router.push("/analyse")} />
    </>
  );
}
