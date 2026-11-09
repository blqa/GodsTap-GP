"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Microsite from "@/components/Microsite";
import { getDemo } from "@/lib/demoSites";

function Demo() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const demo = getDemo(slug);

  if (!demo) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
        <p className="text-slate-300">No encontramos ese ejemplo.</p>
        <Link href="/demo" className="text-sm text-brand-400 hover:underline">
          Ver todos los ejemplos
        </Link>
      </main>
    );
  }

  return (
    <Microsite
      name={demo.name}
      tagline={demo.tagline}
      mainUrl={demo.mainUrl}
      links={demo.links}
      menu={demo.menu}
      theme={demo.theme}
      logo={demo.logo}
      cover={demo.cover}
      hours={demo.hours}
    />
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-slate-950" />}>
      <Demo />
    </Suspense>
  );
}
