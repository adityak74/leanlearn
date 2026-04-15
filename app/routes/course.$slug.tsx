import { redirect, useLoaderData, useSearchParams, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "~/db/schema";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { user, env } = context as { user: any; env: any };
  const { slug } = params;

  if (!user) {
    return redirect("/login");
  }

  const db = drizzle(env.DB, { schema });
  const course = await db.query.courses.findFirst({
    where: (courses, { eq }) => eq(courses.slug, slug as string),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
        with: {
          activities: {
            orderBy: (activities, { asc }) => [asc(activities.sortOrder)],
          },
        },
      },
    },
  });

  if (!course) {
    throw new Response("Course Not Found", { status: 404 });
  }

  return { user, course };
}

export default function CourseView() {
  const { course } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const currentActivityId = searchParams.get("a") || course.chapters[0]?.activities[0]?.id;

  const allActivities = course.chapters.flatMap((c: any) => c.activities);
  const currentActivity = allActivities.find((a: any) => a.id === currentActivityId);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "300px", borderRight: "1px solid #eee", padding: "1.5rem", overflowY: "auto" }}>
        <Link to="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: "0.9rem" }}>← Back to Dashboard</Link>
        <h2 style={{ marginTop: "1rem" }}>{course.title}</h2>
        
        <div style={{ marginTop: "2rem" }}>
          {course.chapters.map((chapter: any) => (
            <div key={chapter.id} style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>{chapter.title}</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {chapter.activities.map((activity: any) => (
                  <li key={activity.id} style={{ marginBottom: "0.25rem" }}>
                    <Link
                      to={`?a=${activity.id}`}
                      style={{
                        display: "block",
                        padding: "0.5rem",
                        textDecoration: "none",
                        color: currentActivityId === activity.id ? "#0070f3" : "#666",
                        backgroundColor: currentActivityId === activity.id ? "#f0f7ff" : "transparent",
                        borderRadius: "4px",
                        fontSize: "0.9rem"
                      }}
                    >
                      {activity.required ? "• " : "○ "}
                      {activity.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: "3rem", overflowY: "auto" }}>
        {currentActivity ? (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1>{currentActivity.title}</h1>
            <div style={{ marginTop: "2rem", lineHeight: "1.8" }}>
              {currentActivity.type === "video" ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                  <iframe
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                    src={currentActivity.content}
                    title="Video activity"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: currentActivity.content }} />
              )}
            </div>
          </div>
        ) : (
          <p>Select an activity to begin.</p>
        )}
      </div>
    </div>
  );
}
