import { redirect, useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authClient } from "~/lib/auth-client";
import { getDb } from "~/db/db.server";
import * as schema from "~/db/schema";

export async function loader({ context }: LoaderFunctionArgs) {
  const { user, env } = context as { user: any; env: any };
  
  if (!user) {
    return redirect("/login");
  }

  const db = getDb(env);
  
  // Parallel fetch for dashboard data
  const [allCourses, allCertificates] = await Promise.all([
    db.query.courses.findMany({
      where: (courses, { eq }) => eq(courses.published, true),
      with: {
        progresses: {
          where: (progress, { eq }) => eq(progress.userId, user.id),
        },
      },
    }),
    db.query.certificates.findMany({
      where: (c, { eq }) => eq(c.userId, user.id),
    })
  ]);

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
    <div className="container mt-2">
      <div className="flex justify-between items-center mb-2">
        <h1>Learner Dashboard</h1>
        <div className="flex gap-1">
          <Link to="/profile" className="btn btn-outline">My Profile</Link>
          <button onClick={signOut} className="btn btn-outline">Sign Out</button>
        </div>
      </div>
      
      <div className="card mb-2">
        <h2>Welcome back, {user.name}!</h2>
        <p className="text-muted">Explore your courses and track your progress below.</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Your Available Courses</h3>
        {courses.length === 0 ? (
          <p className="text-muted">No courses available at the moment.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
            {courses.map((course: any) => (
              <div key={course.id} className="card flex" style={{ flexDirection: "column" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>{course.title}</h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", flex: 1, marginBottom: "1.5rem" }}>
                  {course.description}
                </p>
                
                <div style={{ marginTop: "auto" }}>
                  <div className="flex justify-between" style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                    <span className="text-muted">Progress</span>
                    <span style={{ fontWeight: 600 }}>{course.progressPercent}%</span>
                  </div>
                  <div className="progress-container">
                    <div 
                      className={`progress-bar ${course.progressPercent === 100 ? 'complete' : ''}`}
                      style={{ width: `${course.progressPercent}%` }} 
                    />
                  </div>
                </div>

                <div className="flex gap-1" style={{ marginTop: "1.5rem" }}>
                  <Link 
                    to={`/course/${course.slug}`}
                    className={`btn ${course.progressPercent === 100 ? 'btn-outline' : 'btn-primary'}`}
                    style={{ flex: 1 }}
                  >
                    {course.progressPercent > 0 ? (course.progressPercent === 100 ? "Review" : "Continue") : "Start Course"}
                  </Link>

                  {course.progressPercent === 100 && course.certificateId && (
                    <Link
                      to={`/certificate/${course.certificateId}`}
                      target="_blank"
                      className="btn btn-success"
                      style={{ flex: 1 }}
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
