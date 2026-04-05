"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();

    const form = new FormData(e.target);

    await fetch("/api/lead", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone"),
        zip: form.get("zip"),
      }),
      headers: { "Content-Type": "application/json" },
    });

    setSubmitted(true);
  }

  if (submitted) {
    return <p style={{ padding: 40 }}>Checking availability... we’ll text you shortly.</p>;
  }

  return (
    <main style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1>Get HVAC Help Now</h1>
      <p>Available technicians are ready</p>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" required />
        <br /><br />

        <input name="phone" placeholder="Phone Number" required />
        <br /><br />

        <input name="zip" placeholder="Zip Code" />
        <br /><br />

        <p style={{ fontSize: 12 }}>
          By submitting this form, you agree to receive SMS messages regarding your service request.
          Message and data rates may apply. Reply STOP to opt out.
        </p>

        <button type="submit">Check Availability</button>
      </form>
    </main>
  );
}
