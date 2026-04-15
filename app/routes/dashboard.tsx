import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authClient } from "~/lib/auth-client";

export async function loader({ context }: LoaderFunctionArgs) {
  const { user } = context as { user: any };
  
  if (!user) {
    return redirect("/login");
  }

  return { user };
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

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
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Your Courses</h3>
        <p>You are not enrolled in any courses yet.</p>
      </div>
    </div>
  );
}
