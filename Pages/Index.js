import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setData(null); setLoading(true);
    const url = e.target.url.value.trim();
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur inconnue");
      setData(json);
    } catch (err) { setError(err.message || "Erreur réseau"); }
    finally { setLoading(false); }
  }

  function downloadJSON() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `siteok1_${new URL(data.summary.url).hostname}.json`;
    a.click();
  }

  return (
    <>
      <Head>
        <title>SiteOK1 — Audit accessibilité</title>
        <meta name="description" content="Scannez une URL et obtenez les erreurs WCAG." />
        <link rel="icon" href="/IMG_6863.jpeg" />
      </Head>

      <main style={{maxWidth:980,margin:"32px auto",padding:"0 16px",fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, sans-serif"}}>
        <header style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <img src="/IMG_6863.jpeg" alt="SiteOK1" width={44} height={44} style={{borderRadius:8,display:"block"}} />
          <div>
            <h1 style={{margin:0,fontSize:32,lineHeight:1.1}}>SiteOK1 — Audit accessibilité</h1>
            <p style={{margin:"6px 0 0",opacity:0.8}}>Collez une URL et obtenez les erreurs WCAG.</p>
          </div>
        </header>

        <form onSubmit={onSubmit} style={{display:"flex",gap:10,margin:"12px 0 20px"}}>
          <input name="url" type="url" required placeholder="https://exemple.com"
                 style={{flex:1,padding:14,border:"1px solid #e5e7eb",borderRadius:10,fontSize:16}} />
          <button type="submit" disabled={loading}
                  style={{padding:"14px 18px",borderRadius:10,border:"none",background:"#1E6ACB",color:"#fff",fontWeight:700,opacity:loading?0.7:1}}>
            {loading ? "Analyse…" : "Scanner"}
          </button>
        </form>

        {error && (
          <div style={{background:"#FEF2F2",border:"1px solid #FEE2E2",color:"#991B1B",padding:12,borderRadius:10,marginBottom:16}}>
            Erreur : {error}
          </div>
        )}

        {data && (
          <>
            <section style={{background:"#F2F7FF",border:"1px solid #E3ECFF",padding:14,borderRadius:10,marginBottom:16}}>
              <div><strong>URL:</strong> {data.summary.url}</div>
              <div><strong>Violations:</strong> {data.summary.violations}</div>
              <div><strong>À vérifier:</strong> {data.summary.incomplete}</div>
              <div><strong>Par impact:</strong> {Object.entries(data.summary.byImpact).map(([k,v])=>`${k}: ${v}`).join(" · ")}</div>
            </section>

            <div style={{display:"flex",gap:10,marginBottom:12}}>
              <button onClick={downloadJSON} style={{padding:"10px 14px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff"}}>
                Télécharger le rapport (JSON)
              </button>
            </div>

            <section>
              <h2 style={{fontSize:20,margin:"10px 0"}}>Détails des violations</h2>
              {data.results.violations.length === 0 ? (
                <div style={{opacity:0.8}}>Aucune violation détectée.</div>
              ) : (
                <div style={{display:"grid",gap:12}}>
                  {data.results.violations.slice(0,50).map((v,i)=>(
                    <div key={i} style={{border:"1px solid #e5e7eb",borderRadius:10,padding:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <strong>{v.id}</strong>
                        <span style={{padding:"2px 8px",borderRadius:999,background:"#EEF2FF",border:"1px solid #E0E7FF"}}>
                          {v.impact || "unknown"}
                        </span>
                      </div>
                      <div style={{marginBottom:6}}>{v.description}</div>
                      <a href={v.helpUrl} target="_blank" rel="noreferrer" style={{color:"#1E6ACB"}}>En savoir plus</a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <footer style={{marginTop:32,opacity:0.7,fontSize:13}}>© {new Date().getFullYear()} SiteOK1 — Prototype MVP</footer>
      </main>
    </>
  );
}
