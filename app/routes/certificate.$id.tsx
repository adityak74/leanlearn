import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getDb } from "~/db/db.server";
import { eq } from "drizzle-orm";
import * as schema from "~/db/schema";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { user, env } = context as { user: any; env: any };
  const { id } = params;

  if (!user) {
    return redirect("/login");
  }

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const db = getDb(env);
  
  const certificate = await db.query.certificates.findFirst({
    where: eq(schema.certificates.id, id),
    with: {
      user: true,
      course: true,
    },
  });

  if (!certificate) {
    throw new Response("Certificate Not Found", { status: 404 });
  }

  // Security: Ownership check
  if (certificate.userId !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return { certificate };
}

export default function CertificatePage() {
  const { certificate } = useLoaderData<typeof loader>();
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="certificate-container" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      backgroundColor: "#f9fafb"
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
            background-color: white !important;
          }
          .certificate-container {
            padding: 0 !important;
            background-color: white !important;
            min-height: auto !important;
            justify-content: center !important;
          }
          .certificate-card {
            box-shadow: none !important;
            border: 10px solid #1e293b !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}} />
      
      <div className="certificate-card" style={{
        width: "100%",
        maxWidth: "800px",
        backgroundColor: "white",
        border: "10px solid #1e293b",
        padding: "4rem",
        textAlign: "center",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        position: "relative"
      }}>
        {/* Decorative corner */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          width: "100px",
          height: "100px",
          borderTop: "2px solid #94a3b8",
          borderLeft: "2px solid #94a3b8"
        }} />
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          width: "100px",
          height: "100px",
          borderBottom: "2px solid #94a3b8",
          borderRight: "2px solid #94a3b8"
        }} />

        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1e293b", fontFamily: "serif" }}>
          Certificate of Completion
        </h1>
        
        <p style={{ fontSize: "1.25rem", color: "#64748b", marginBottom: "2rem" }}>
          This is to certify that
        </p>
        
        <h2 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", color: "#0f172a", textDecoration: "underline" }}>
          {certificate.user.name}
        </h2>
        
        <p style={{ fontSize: "1.25rem", color: "#64748b", marginBottom: "2rem" }}>
          has successfully completed the course
        </p>
        
        <h3 style={{ fontSize: "2rem", marginBottom: "3rem", color: "#0f172a" }}>
          {certificate.course.title}
        </h3>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "4rem", marginTop: "2rem" }}>
          <div>
            <div style={{ borderBottom: "1px solid #cbd5e1", width: "200px", marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>Date: {issuedDate}</p>
          </div>
          <div>
            <div style={{ borderBottom: "1px solid #cbd5e1", width: "200px", marginBottom: "0.5rem", fontStyle: "italic", fontFamily: "cursive" }}>
              LeanLearn Team
            </div>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>Authorized Signature</p>
          </div>
        </div>
      </div>
      
      <div className="no-print" style={{ marginTop: "2rem" }}>
        <button 
          onClick={() => window.print()}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600"
          }}
        >
          Print Certificate
        </button>
      </div>
    </div>
  );
}
