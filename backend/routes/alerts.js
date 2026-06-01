const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendCriticalAlertEmail(alert) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[alerts/email] ⚠️  RESEND_API_KEY not set — skipping email");
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const subject  = `🚨 CRITICAL Vulnerability Alert: ${alert.cve_id}`;
  const htmlBody = `
    <h2 style="color:#dc2626;">Critical Security Alert</h2>
    <p>A <strong>CRITICAL</strong> severity vulnerability has been detected.</p>
    <table style="border-collapse:collapse;width:100%;font-family:monospace;">
      <tr><td style="padding:4px 8px;font-weight:bold;">CVE ID</td><td style="padding:4px 8px;">${alert.cve_id}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:4px 8px;font-weight:bold;">Endpoint</td><td style="padding:4px 8px;">${alert.endpoint_name || alert.endpoint_id}</td></tr>
      <tr><td style="padding:4px 8px;font-weight:bold;">CVSS Score</td><td style="padding:4px 8px;">${alert.cvss_score ?? "N/A"}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:4px 8px;font-weight:bold;">Software</td><td style="padding:4px 8px;">${alert.software_name || "N/A"}</td></tr>
      <tr><td style="padding:4px 8px;font-weight:bold;">Description</td><td style="padding:4px 8px;">${alert.message || "N/A"}</td></tr>
    </table>
    <hr/>
    <p style="color:#6b7280;font-size:12px;">Sent by PatchGuard. Do not reply.</p>
  `;

  console.log(`[alerts/email] 📧 Sending email for ${alert.cve_id}...`);

  const resp = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM_EMAIL || "onboarding@resend.dev",
      to:   [process.env.ALERT_ADMIN_EMAIL || "admin@patchguard.io"],
      subject,
      html: htmlBody,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[alerts/email] ❌ Resend error ${resp.status}: ${errText.slice(0, 200)}`);
    return { sent: false, reason: `Resend API error ${resp.status}` };
  }

  const result = await resp.json();
  console.log(`[alerts/email] ✅ Email sent — id=${result.id}`);
  return { sent: true, resend_id: result.id };
}

// GET /api/alerts
router.get("/", async (req, res, next) => {
  const { severity, endpoint_id, acknowledged, limit = 50, offset = 0 } = req.query;

  const parsedLimit  = Math.min(parseInt(limit, 10)  || 50, 200);
  const parsedOffset = parseInt(offset, 10) || 0;

  console.log(`[alerts] 📋 GET /api/alerts`, { filters: { severity, endpoint_id, acknowledged } });

  try {
    let query = supabase
      .from("alerts")
      .select(
        `
        id,
        cve_id,
        endpoint_id,
        severity,
        message,
        is_read,
        acknowledged,
        email_sent,
        sent_at,
        created_at,
        endpoints (
          id,
          hostname,
          ip_address,
          status
        )
        `,
        { count: "exact" }
      )
      .order("sent_at", { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (severity)    query = query.in("severity", severity.toUpperCase().split(",").map(s => s.trim()));
    if (endpoint_id) query = query.eq("endpoint_id", endpoint_id);
    if (acknowledged !== undefined) query = query.eq("acknowledged", acknowledged === "true");

    const { data, error, count } = await query;
    if (error) throw error;

    console.log(`[alerts] ✅ Returning ${data.length} of ${count} alert(s)`);
    return res.json({
      data,
      pagination: {
        total: count,
        limit: parsedLimit,
        offset: parsedOffset,
        has_more: parsedOffset + parsedLimit < count,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts
router.post("/", async (req, res, next) => {
  const { cve_id, endpoint_id, severity, message, cvss_score, software_name, endpoint_name, nvd_url } = req.body;

  if (!cve_id || !endpoint_id || !severity) {
    return res.status(400).json({ error: "cve_id, endpoint_id, and severity are required" });
  }

  const normalizedSeverity = severity.toUpperCase();
  const isCritical = normalizedSeverity === "CRITICAL";

  console.log(`\n[alerts] 🔔 Creating alert — ${cve_id} | ${normalizedSeverity}`);

  try {
    const alertRecord = {
      admin_email:   process.env.ALERT_ADMIN_EMAIL || "admin@patchguard.io",
      cve_id,
      endpoint_id,
      severity:      normalizedSeverity,
      message:       message || `Vulnerability ${cve_id} detected`,
      is_read:       false,
      acknowledged:  false,
      email_sent:    false,
      sent_at:       new Date().toISOString(),
    };

    const { data: alert, error: insertErr } = await supabase
      .from("alerts")
      .insert(alertRecord)
      .select()
      .single();

    if (insertErr) throw insertErr;
    console.log(`[alerts] 💾 Alert saved — id=${alert.id}`);

    let emailResult = { sent: false, reason: "Not critical severity" };
    if (isCritical) {
      emailResult = await sendCriticalAlertEmail({ ...alert, endpoint_name, software_name, nvd_url, cvss_score });
      await supabase
        .from("alerts")
        .update({ email_sent: emailResult.sent })
        .eq("id", alert.id);
    }

    return res.status(201).json({ success: true, alert_id: alert.id, severity: normalizedSeverity, email: emailResult });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch("/:id/acknowledge", async (req, res, next) => {
  const { id } = req.params;
  console.log(`[alerts] ✔️  Acknowledging alert id=${id}`);

  try {
    const { data, error } = await supabase
      .from("alerts")
      .update({ is_read: true, acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Alert not found", id });
    }

    console.log(`[alerts] ✅ Alert ${id} acknowledged`);
    return res.json({ success: true, alert: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;