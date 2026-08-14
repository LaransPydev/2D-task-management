"use client";

import { useActionState } from "react";
import { signInAction, visitorSignInAction } from "@/app/actions/auth";

const initialState = { error: null };

export default function SignInGate() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [visitorState, visitorFormAction, visitorPending] = useActionState(visitorSignInAction, initialState);

  return (
    <main className="signin-gate">
      <div className="signin-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Sportstech"
          className="signin-logo"
          src="https://www.sportstech.de/cdn/shop/files/logo__4_59d2ab76-f9f0-4f4f-804d-618913cd4325.svg?v=1775131600&width=212"
        />
        <h2>Sign in</h2>
        <form action={formAction} className="signin-form">
          <label>
            Username or email
            <input
              autoCapitalize="none"
              autoComplete="username"
              name="identifier"
              required
              spellCheck={false}
            />
          </label>
          <label>
            Password
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          {state.error && <p className="signin-error" role="alert">{state.error}</p>}
          <button disabled={pending || visitorPending} type="submit">
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="signin-divider"><span>or</span></div>
        <form action={visitorFormAction}>
          <button className="visitor-button" disabled={pending || visitorPending} type="submit">
            {visitorPending ? "Opening..." : "View as Visitor"}
          </button>
        </form>
        {visitorState.error && <p className="signin-error" role="alert">{visitorState.error}</p>}
      </div>
    </main>
  );
}
