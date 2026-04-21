import { redirect, useLoaderData, useSearchParams, Link, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getDb } from "~/db/db.server";
import { eq, and } from "drizzle-orm";
import * as schema from "~/db/schema";

export async function action({ request, context }: ActionFunctionArgs) {
  const { user, env } = context as { user: any; env: any };
  if (!user) return redirect("/login");

  const formData = await request.formData();
  const activityId = formData.get("activityId") as string;
  
  if (!activityId) return { error: "Missing activityId" };

  const db = getDb(env);

  // 1. Find the activity and its course
  const activity = await db.query.activities.findFirst({
    where: (activities, { eq }) => eq(activities.id, activityId),
    with: {
      chapter: true,
    },
  });

  if (!activity) return { error: "Activity not found" };
  const courseId = activity.chapter.courseId;

  // 2. Mark activity as complete
  const existingCompletion = await db.query.activityCompletion.findFirst({
    where: (ac, { and, eq }) =>
      and(eq(ac.userId, user.id), eq(ac.activityId, activityId)),
  });

  if (!existingCompletion) {
    await db.insert(schema.activityCompletion).values({
      id: crypto.randomUUID(),
      userId: user.id,
      activityId: activityId,
      completedAt: new Date(),
    });
  }

  // 3. Calculate progress
  const allRequiredActivities = await db
    .select({ id: schema.activities.id })
    .from(schema.activities)
    .innerJoin(
      schema.chapters,
      eq(schema.activities.chapterId, schema.chapters.id)
    )
    .where(
      and(
        eq(schema.chapters.courseId, courseId),
        eq(schema.activities.required, true)
      )
    );

  const totalRequired = allRequiredActivities.length;

  const completedRequiredActivities = await db
    .select({ id: schema.activities.id })
    .from(schema.activityCompletion)
    .innerJoin(
      schema.activities,
      eq(schema.activityCompletion.activityId, schema.activities.id)
    )
    .innerJoin(
      schema.chapters,
      eq(schema.activities.chapterId, schema.chapters.id)
    )
    .where(
      and(
        eq(schema.activityCompletion.userId, user.id),
        eq(schema.chapters.courseId, courseId),
        eq(schema.activities.required, true)
      )
    );

  const completedRequired = completedRequiredActivities.length;
  const progressPercent = totalRequired > 0 
    ? Math.round((completedRequired / totalRequired) * 100) 
    : 100;

  // 4. Update course progress
  const existingProgress = await db.query.courseProgress.findFirst({
    where: (cp, { and, eq }) =>
      and(eq(cp.userId, user.id), eq(cp.courseId, courseId)),
  });

  if (existingProgress) {
    await db
      .update(schema.courseProgress)
      .set({
        progressPercent,
        updatedAt: new Date(),
        completedAt: progressPercent === 100 ? new Date() : null,
      })
      .where(eq(schema.courseProgress.id, existingProgress.id));
  } else {
    await db.insert(schema.courseProgress).values({
      id: crypto.randomUUID(),
      userId: user.id,
      courseId: courseId,
      progressPercent,
      updatedAt: new Date(),
      completedAt: progressPercent === 100 ? new Date() : null,
    });
  }

  // 5. Issue certificate if progress is 100%
  if (progressPercent === 100) {
    const existingCertificate = await db.query.certificates.findFirst({
      where: (c, { and, eq }) =>
        and(eq(c.userId, user.id), eq(c.courseId, courseId)),
    });

    if (!existingCertificate) {
      await db.insert(schema.certificates).values({
        id: crypto.randomUUID(),
        userId: user.id,
        courseId: courseId,
        issuedAt: new Date(),
      });
    }
  }

  return { success: true, progressPercent };
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { user, env } = context as { user: any; env: any };
  const { slug } = params;

  if (!user) {
    return redirect("/login");
  }

  const db = getDb(env);
  const course = await db.query.courses.findFirst({
    where: (courses, { eq }) => eq(courses.slug, slug as string),
    with: {
      progresses: {
        where: (progress, { eq }) => eq(progress.userId, user.id),
      },
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.sortOrder)],
        with: {
          activities: {
            orderBy: (activities, { asc }) => [asc(activities.sortOrder)],
            with: {
              completions: {
                where: (completion, { eq }) => eq(completion.userId, user.id),
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Response("Course Not Found", { status: 404 });
  }

  const certificate = await db.query.certificates.findFirst({
    where: (c, { and, eq }) =>
      and(eq(c.userId, user.id), eq(c.courseId, course.id)),
  });

  const progressPercent = (course as any).progresses?.[0]?.progressPercent ?? 0;
  
  const processedChapters = course.chapters.map((chapter: any) => ({
    ...chapter,
    activities: chapter.activities.map((activity: any) => {
      const isCompleted = activity.completions && activity.completions.length > 0;
      return {
        ...activity,
        isCompleted
      };
    })
  }));

  return { 
    user, 
    course: { 
      ...course, 
      chapters: processedChapters,
      progressPercent 
    },
    certificate
  };
}

export default function CourseView() {
  const { course, certificate } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher();
  
  const currentActivityId = searchParams.get("a") || course.chapters[0]?.activities[0]?.id;

  const allActivities = course.chapters.flatMap((c: any) => c.activities);
  const currentActivity = allActivities.find((a: any) => a.id === currentActivityId);

  // Optimistic completion status if the fetcher is active
  const isCompleting = fetcher.state !== "idle" && fetcher.formData?.get("activityId") === currentActivityId;
  const isCurrentlyCompleted = currentActivity?.isCompleted || isCompleting;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "300px", borderRight: "1px solid #eee", padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <Link to="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: "0.9rem" }}>← Back to Dashboard</Link>
        <h2 style={{ marginTop: "1rem" }}>{course.title}</h2>

        <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
            <span>Your Progress</span>
            <span>{course.progressPercent}%</span>
          </div>
          <div style={{ width: "100%", height: "6px", backgroundColor: "#eee", borderRadius: "3px", overflow: "hidden" }}>
            <div 
              style={{ 
                width: `${course.progressPercent}%`, 
                height: "100%", 
                backgroundColor: course.progressPercent === 100 ? "#10b981" : "#0070f3",
                transition: "width 0.3s ease"
              }} 
            />
          </div>
          
          {course.progressPercent === 100 && certificate && (
            <div style={{ marginTop: "1.5rem" }}>
              <Link
                to={`/certificate/${certificate.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  padding: "0.75rem",
                  backgroundColor: "#10b981",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
                }}
              >
                🎓 View Certificate
              </Link>
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          {course.chapters.map((chapter: any) => (
            <div key={chapter.id} style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>{chapter.title}</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {chapter.activities.map((activity: any) => (
                  <li key={activity.id} style={{ marginBottom: "0.25rem" }}>
                    <Link
                      to={`?a=${activity.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.5rem",
                        textDecoration: "none",
                        color: currentActivityId === activity.id ? "#0070f3" : "#666",
                        backgroundColor: currentActivityId === activity.id ? "#f0f7ff" : "transparent",
                        borderRadius: "4px",
                        fontSize: "0.9rem"
                      }}
                    >
                      <span style={{ marginRight: "0.5rem", color: activity.isCompleted ? "#10b981" : "#ccc" }}>
                        {activity.isCompleted ? "✅" : (activity.required ? "○" : "•")}
                      </span>
                      <span style={{ flex: 1 }}>{activity.title}</span>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h1>{currentActivity.title}</h1>
              
              {!isCurrentlyCompleted ? (
                <fetcher.Form method="post">
                  <input type="hidden" name="activityId" value={currentActivity.id} />
                  <button
                    type="submit"
                    disabled={isCompleting}
                    style={{
                      padding: "0.6rem 1.2rem",
                      backgroundColor: "#0070f3",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isCompleting ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}
                  >
                    {isCompleting ? "Saving..." : "Mark as Complete"}
                  </button>
                </fetcher.Form>
              ) : (
                <div style={{ 
                  padding: "0.6rem 1.2rem", 
                  backgroundColor: "#ecfdf5", 
                  color: "#047857", 
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span>✅</span> Completed
                </div>
              )}
            </div>

            <div style={{ marginTop: "2rem", lineHeight: "1.8" }}>
              {currentActivity.type === "video" ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px", backgroundColor: "#000" }}>
                  <iframe
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                    src={currentActivity.content}
                    title="Video activity"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div 
                  className="prose"
                  style={{ fontSize: "1.1rem" }}
                  dangerouslySetInnerHTML={{ __html: currentActivity.content }} 
                />
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
