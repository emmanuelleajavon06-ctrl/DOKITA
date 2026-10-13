"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { slideUp, staggerContainer } from "@/lib/motion";
import type { SiteData } from "@/lib/types";

const FEATURES: Array<[string, string]> = [
  ["Dossier médical unique", "Allergies, groupe sanguin, maladies chroniques et historique réunis, accessibles aux soignants autorisés."],
  ["Rendez-vous et téléconsultation", "Prenez rendez-vous en cabinet ou en visio avec votre médecin."],
  ["Ordonnances avec QR code", "La pharmacie scanne le QR code : plus de papier perdu, plus de doute sur l'authenticité."],
  ["Analyses de laboratoire", "Vos résultats arrivent directement dans votre dossier."],
  ["Vaccination et grossesse", "Carnet de vaccination avec rappels et suivi de grossesse jour après jour."],
  ["Urgences SOS", "Partagez votre position avec les structures de santé proches en un geste."],
];
const SOCIAL: Record<string, string> = { TIKTOK: "TikTok", FACEBOOK: "Facebook", INSTAGRAM: "Instagram", YOUTUBE: "YouTube", X: "X", LINKEDIN: "LinkedIn", WHATSAPP: "WhatsApp" };

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 1), 40);
    return () => clearTimeout(t);
  }, [n, text]);
  return <span>{text.slice(0, n)}<i className="caret" /></span>;
}

const view = { once: true, margin: "-80px" } as const;

export default function Landing({ data }: { data: SiteData }) {
  const [boot, setBoot] = useState(true);
  useEffect(() => { const t = setTimeout(() => setBoot(false), 1600); return () => clearTimeout(t); }, []);
  const hero = data.media.find((m) => m.kind === "HERO");
  const gallery = data.media.filter((m) => m.kind === "GALLERY");

  return (
    <>
      <AnimatePresence>
        {boot && (
          <motion.div className="splash" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <img src="/logo.png" alt="SamaDokita" />
          </motion.div>
        )}
      </AnimatePresence>

      <header className="nav"><div className="wrap">
        <Link href="/"><img src="/logo.png" alt="SamaDokita" /></Link>
        <nav style={{ display: "flex", gap: 10 }}>
          <Link className="btn btn-o" href="/login">Se connecter</Link>
          <Link className="btn btn-p" href="/login?mode=register">Créer mon dossier</Link>
        </nav>
      </div></header>

      <section className="hero">
        <div className="blob a" /><div className="blob b" />
        <div className="wrap">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}>
            <h1>Votre santé, partout avec vous</h1>
            <p className="lead"><Typewriter text="Un seul dossier médical numérique, pour les patients comme pour les soignants." /></p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn btn-p" href="/login?mode=register">Commencer</Link>
              <a className="btn btn-o" href="#fonctions">Découvrir</a>
            </div>
          </motion.div>
          {hero ? <img className="hero-img" src={hero.url} alt={hero.alt ?? "SamaDokita"} /> : <div className="art"><img src="/icon-512.png" alt="" /></div>}
        </div>
      </section>

      <section className="s" id="fonctions"><div className="wrap">
        <h2>Tout votre parcours de soins, au même endroit</h2>
        <p className="sub">Une plateforme pensée pour les patients, médecins, pharmaciens, laboratoires et assurances.</p>
        <motion.div className="grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={view}>
          {FEATURES.map(([t, d], i) => (
            <motion.div className="card" key={t} variants={slideUp} whileHover={{ y: -4 }}>
              <div className="ico">{i + 1}</div><h3>{t}</h3><p>{d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div></section>

      {data.partners.length > 0 && (
        <section className="s" style={{ background: "#fff" }}><div className="wrap">
          <h2>Nos partenaires</h2><p className="sub">Ils nous font confiance pour une santé plus connectée.</p>
          <motion.div className="partners" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={view}>
            {data.partners.map((p) => (
              <motion.div key={p.id} variants={slideUp}>
                {p.websiteUrl ? <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer">{p.logoUrl && <img src={p.logoUrl} alt="" />}{p.name}</a>
                  : <span>{p.logoUrl && <img src={p.logoUrl} alt="" />}{p.name}</span>}
              </motion.div>
            ))}
          </motion.div>
        </div></section>
      )}

      {gallery.length > 0 && (
        <section className="s"><div className="wrap"><h2>En images</h2>
          <div className="gal">{gallery.map((m) => <img key={m.id} src={m.url} alt={m.alt ?? ""} loading="lazy" />)}</div>
        </div></section>
      )}

      {data.faqs.length > 0 && (
        <section className="s" id="faq"><div className="wrap" style={{ maxWidth: 820 }}>
          <h2>Questions fréquentes</h2><p className="sub">Vous ne trouvez pas votre réponse ? Contactez-nous via nos réseaux.</p>
          {data.faqs.map((f) => <details key={f.id}><summary>{f.question}</summary><p>{f.answer}</p></details>)}
        </div></section>
      )}

      <footer className="foot"><div className="wrap">
        <strong style={{ color: "#fff", fontSize: 20 }}>SamaDokita</strong>
        <div>Votre santé, partout avec vous</div>
        {data.socials.length > 0 && <div className="row">{data.socials.map((s) => <a className="pill" key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{SOCIAL[s.platform] ?? s.platform}</a>)}</div>}
        {data.pages.length > 0 && <div className="row">{data.pages.map((p) => <Link key={p.slug} href={`/pages/${p.slug}`}>{p.title}</Link>)}</div>}
        <div style={{ fontSize: 13, opacity: 0.7 }}>© {new Date().getFullYear()} SamaDokita</div>
      </div></footer>
    </>
  );
}
