import { redirect, useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authClient } from "~/lib/auth-client";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "~/db/schema";

export async function loader({ context }: LoaderFunctionArgs) {
  const { user, env } = context as { user: any; env: any };
  
  if (!user) {
    return redirect("/login");
  }

  const db = drizzle(env.DB, { schema });
  const allCourses = await db.query.courses.findMany({
    where: (courses, { eq }) => eq(courses.published, true),
    with: {
      progresses: user ? {
        where: (progress, { eq }) => eq(progress.userId, user.id),
      } : undefined,
    },
  });

  const allCertificates = await db.query.certificates.findMany({
    where: (c, { eq }) => eq(c.userId, user.id),
  });

  const courses = allCourses.map((course: any) => {
    const progress = course.progresses?.[0];
    const { progresses, ...courseData } = course;
    const certificate = allCertificates.find((c: any) => c.courseId === course.id);
    
    return {
      ...courseData,
      progressPercent: progress?.progressPercent ?? 0,
      completedAt: progress?.completedAt ?? null,
      certificateId: certificate?.id || null,
    };
  });

  return { user, courses };
}

export default function Dashboard() {
  const { user, courses } = useLoaderData<typeof loader>();

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Learner Dashboard</h1>
        <button 
          onClick={signOut}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Sign Out
        </button>
      </div>
      
      <div style={{ marginTop: "2rem", border: "1px solid #eee", padding: "1.5rem", borderRadius: "8px" }}>
        <h2>Welcome back, {user.name}!</h2>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Your Available Courses</h3>
        {courses.length === 0 ? (
          <p>No courses available at the moment.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
            {courses.map((course: any) => (
              <div key={course.id} style={{ border: "1px solid #ddd", padding: "1.5rem", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
                <h4>{course.title}</h4>
                <p style={{ fontSize: "0.9rem", color: "#666", flex: 1 }}>{course.description}</p>
                
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                    <span>Progress</span>
                    <span>{course.progressPercent}%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        width: `${course.progressPercent}%`, 
                        height: "100%", 
                        backgroundColor: course.progressPercent === 100 ? "#10b981" : "#0070f3",
                        transition: "width 0.3s ease"
                      }} 
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                  <Link 
                    to={`/course/${course.slug}`}
                    style={{ 
                      flex: 1,
                      padding: "0.6rem 1rem", 
                      backgroundColor: course.progressPercent === 100 ? "#f3f4f6" : "#0070f3", 
                      color: course.progressPercent === 100 ? "#374151" : "white", 
                      textDecoration: "none", 
                      borderRadius: "6px",
                      textAlign: "center",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      border: course.progressPercent === 100 ? "1px solid #d1d5db" : "none"
                    }}
                  >
                    {course.progressPercent > 0 ? (course.progressPercent === 100 ? "Review" : "Continue") : "Start Course"}
                  </Link>

                  {course.progressPercent === 100 && course.certificateId && (
                    <Link
                      to={`/certificate/${course.certificateId}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        padding: "0.6rem 1rem",
                        backgroundColor: "#10b981",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                        textAlign: "center",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem"
                      }}
                    >
                      🎓 Certificate
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
