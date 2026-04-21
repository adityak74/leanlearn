import { redirect, useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getDb } from "~/db/db.server";
import * as schema from "~/db/schema";
import { eq, count, and } from "drizzle-orm";

export async function loader({ context }: LoaderFunctionArgs) {
  const { user, env } = context as { user: any; env: any };
  
  if (!user) {
    return redirect("/login");
  }

  const db = getDb(env);

  // Parallel data fetching as per 05-RESEARCH.md
  const [progress, certificates, courseCountResult] = await Promise.all([
    db.query.courseProgress.findMany({
      where: (cp, { eq }) => eq(cp.userId, user.id),
    }),
    db.query.certificates.findMany({
      where: (c, { eq }) => eq(c.userId, user.id),
      with: {
        course: true
      }
    }),
    db.select({ value: count() }).from(schema.courses).where(eq(schema.courses.published, true))
  ]);

  const totalCourses = progress.length;
  const avgProgress = totalCourses > 0 
    ? Math.round(progress.reduce((acc: number, curr: any) => acc + curr.progressPercent, 0) / totalCourses)
    : 0;
  const certsEarned = certificates.length;

  return { 
    user, 
    stats: {
      totalCourses,
      avgProgress,
      certsEarned
    },
    certificates
  };
}

export default function Profile() {
  const { user, stats, certificates } = useLoaderData<typeof loader>();

  return (
    <div className="container mt-2">
      <div className="flex justify-between items-center mb-2">
        <h1>Learner Profile</h1>
        <Link to="/dashboard" className="btn btn-outline">← Dashboard</Link>
      </div>

      <div className="card mb-2">
        <h2>{user.name}</h2>
        <p className="text-muted">{user.email}</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-value">{stats.totalCourses}</span>
          <span className="stat-label">Courses Started</span>
        </div>
        <div className="card stat-card">
          <span className="stat-value">{stats.avgProgress}%</span>
          <span className="stat-label">Average Progress</span>
        </div>
        <div className="card stat-card">
          <span className="stat-value">{stats.certsEarned}</span>
          <span className="stat-label">Certificates Earned</span>
        </div>
      </div>

      <div className="card">
        <h3>Your Certificates</h3>
        {certificates.length === 0 ? (
          <p className="text-muted">You haven't earned any certificates yet. Keep learning!</p>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            {certificates.map((cert: any) => (
              <div key={cert.id} className="flex justify-between items-center mb-1 pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h4 style={{ margin: 0 }}>{cert.course.title}</h4>
                  <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                    Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link 
                  to={`/certificate/${cert.id}`} 
                  target="_blank" 
                  className="btn btn-success"
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                >
                  View Certificate
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
