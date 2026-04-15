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
  const courses = await db.query.courses.findMany({
    where: (courses, { eq }) => eq(courses.published, true),
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
              <div key={course.id} style={{ border: "1px solid #ddd", padding: "1.5rem", borderRadius: "8px" }}>
                <h4>{course.title}</h4>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>{course.description}</p>
                <Link 
                  to={`/course/${course.slug}`}
                  style={{ 
                    display: "inline-block", 
                    marginTop: "1rem", 
                    padding: "0.5rem 1rem", 
                    backgroundColor: "#0070f3", 
                    color: "white", 
                    textDecoration: "none", 
                    borderRadius: "5px" 
                  }}
                >
                  Start Course
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
