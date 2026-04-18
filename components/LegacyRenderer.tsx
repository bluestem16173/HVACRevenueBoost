import React from "react";

export function LegacyRenderer({ title, data }: { title: string, data?: any }) {
  const html = `
    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin-bottom:20px;border-left:4px solid #f59e0b;">
      <h2 style="margin-top:0;font-size:1.25rem;">⏱️ 30-Second Diagnosis</h2>
      <p style="margin-bottom:8px;">If your AC is experiencing this issue, the most common causes are:</p>
      <ul style="margin:0;padding-left:20px;">
        <li><strong>Dirty air filter (40%)</strong></li>
        <li><strong>Low refrigerant (25%)</strong></li>
        <li><strong>Thermostat issue (15%)</strong></li>
      </ul>
    </div>

    <div style="background:#fee2e2;padding:14px;border-radius:8px;margin:16px 0;">
      <strong>⚠️ Don’t Ignore This:</strong>
      AC issues like this often turn into $1,500–$3,000 repairs if delayed.
    </div>

    <!-- 🔥 IMMEDIATE CTA -->
    <div style="margin:20px 0;padding:16px;background:#dc2626;color:white;border-radius:8px;text-align:center;">
      <strong style="font-size:18px;">Need a Technician Fast?</strong><br/>
      <span style="font-size:15px;display:inline-block;margin:8px 0;">Most HVAC issues in Florida heat get worse quickly.</span><br/>
      <button onclick="openLeadCard()" style="
        margin-top:8px;
        padding:12px 24px;
        background:white;
        color:#dc2626;
        border:none;
        border-radius:6px;
        font-weight:bold;
        font-size:16px;
        cursor:pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">Get Help Now</button>
    </div>

    <h2>🛠️ Quick Checks (Do This First)</h2>
    <ul>
      <li><strong>Replace filter:</strong> A clogged filter restricts airflow and causes freezing.</li>
      <li><strong>Check thermostat:</strong> Ensure it's set to "Cool" and the fan is on "Auto".</li>
      <li><strong>Look for ice on coils:</strong> If you see ice on the refrigerant lines, turn it off immediately.</li>
    </ul>

    <div style="display:flex;align-items:flex-start;gap:12px;margin:20px 0;padding:16px 18px;border-radius:12px;border:2px solid #f59e0b;background:#fffbeb;box-shadow:0 1px 2px rgba(0,0,0,0.06);">
      <span style="flex-shrink:0;font-size:28px;line-height:1;" aria-hidden="true">⚡</span>
      <p style="margin:0;font-size:15px;font-weight:600;line-height:1.45;color:#451a03;">
        Working with live electricity carries significant risk for injury and possibly death. If you are not experienced, do NOT attempt any DIY. Call a professional today.
      </p>
    </div>

    <h2>How This Issue Affects Your Home</h2>
    <p>
      If your AC is not working properly, your home can quickly become uncomfortable, especially in Florida heat. 
      High indoor temperatures and humidity can lead to poor air quality, higher energy bills, and increased wear on your HVAC system.
    </p>

    <h2>💰 Repair Cost Range</h2>
    <p>
      Based on typical service calls, addressing ${title} usually involves a <strong>typical repair cost of $150–$1,200</strong> depending on whether it's a simple cleaning or a complex component replacement.
    </p>
    
    <h3>When to call a pro</h3>
    <p>If the system runs 20–30 minutes without cooling, or you see leaks/short cycling, call a technician.</p>
    <button onclick="openLeadCard()">Get HVAC Help</button>

    <h2>Frequently Asked Questions</h2>
    <ul>
      <li><strong>Can I fix this myself?</strong><br/>Some issues like filters can be DIY, but deeper problems require a technician.</li>
      <li><strong>Will this get worse?</strong><br/>Yes — most HVAC issues escalate quickly. Ignoring this can double repair cost.</li>
    </ul>

    <!-- 🔥 STRONG CTA -->
    <div style="margin:20px 0;padding:16px;background:#fee2e2;border-radius:8px;">
      <strong>Don’t wait:</strong> In Florida heat, small issues escalate fast.
      <div style="margin-top:10px;">
        <button onclick="openLeadCard()" style="padding:12px 24px;background:#dc2626;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Connect to a technician now</button>
      </div>
    </div>
  `;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
