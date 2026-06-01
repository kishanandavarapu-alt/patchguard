const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

/**
 * POST /api/patch/deploy
 *
 * Body:
 *   endpoint_id      — (required) target endpoint UUID
 *   cve_id           — (required) CVE to remediate (e.g. "CVE-2023-44487")
 *   rollback_enabled — (optional, boolean, default true) whether rollback is available
 *   notes            — (optional) freeform notes about the patch action
 */
router.post("/deploy", async (req, res, next) => {
  const {
    endpoint_id,
    cve_id,
    rollback_enabled = true,
    notes = "",
  } = req.body;

  if (!endpoint_id || !cve_id) {
    return res
      .status(400)
      .json({ error: "endpoint_id and cve_id are required" });
  }

  console.log(
    `\n[patch] 🩹 Deploy request — endpoint=${endpoint_id} cve=${cve_id} rollback=${rollback_enabled}`
  );

  try {
    // 1. Verify the vulnerability exists and is open
    const { data: vuln, error: vulnErr } = await supabase
      .from("vulnerabilities")
      .select("id, severity, status, software_id")
      .eq("endpoint_id", endpoint_id)
      .eq("cve_id", cve_id)
      .single();

    if (vulnErr || !vuln) {
      console.warn(
        `[patch] ⚠️  Vulnerability ${cve_id} not found for endpoint ${endpoint_id}`
      );
      return res.status(404).json({
        error: "Vulnerability not found for this endpoint",
        endpoint_id,
        cve_id,
      });
    }

    if (vuln.status === "patched") {
      console.log(`[patch] ℹ️  ${cve_id} already patched`);
      return res.json({
        success: true,
        message: "Already patched",
        cve_id,
        status: "patched",
        rollback_available: rollback_enabled,
      });
    }

    console.log(
      `[patch] 📝 Vulnerability confirmed — severity=${vuln.severity}, status=${vuln.status}`
    );

    // 2. Simulate patch deployment
    // In production this would integrate with a patch management tool
    // (e.g. Ansible, WSUS, Jamf, Chef) and await real success/failure.
    console.log(`[patch] ⚙️  Simulating patch deployment for ${cve_id}...`);
    const patchSuccess = await simulatePatchDeployment(cve_id, endpoint_id);

    const deployedAt = new Date().toISOString();
    const patchStatus = patchSuccess ? "success" : "failed";

    // 3. Log action to patch_logs table
    const logRecord = {
      endpoint_id,
      vulnerability_id: vuln.id,
      cve_id,
      action: "deploy",
      status: patchStatus,
      rollback_enabled,
      notes: notes || `Automated patch deploy for ${cve_id}`,
      deployed_at: deployedAt,
    };

    const { data: log, error: logErr } = await supabase
      .from("patch_logs")
      .insert(logRecord)
      .select()
      .single();

    if (logErr) {
      console.error(`[patch] ❌ Failed to write patch_log:`, logErr.message);
      // Don't throw — still try to update vulnerability status
    } else {
      console.log(`[patch] 💾 Patch log written — log_id=${log.id}`);
    }

    // 4. Update vulnerability status if patch succeeded
    if (patchSuccess) {
      const { error: updateErr } = await supabase
        .from("vulnerabilities")
        .update({ status: "patched", patched_at: deployedAt })
        .eq("id", vuln.id);

      if (updateErr) {
        console.error(
          `[patch] ❌ Failed to update vulnerability status:`,
          updateErr.message
        );
      } else {
        console.log(
          `[patch] ✅ Vulnerability ${cve_id} marked as patched`
        );
      }
    } else {
      console.warn(`[patch] ⚠️  Patch deployment failed for ${cve_id}`);
    }

    // 5. Build rollback info
    const rollbackInfo = rollback_enabled
      ? {
          rollback_available: true,
          rollback_endpoint: `/api/patch/rollback`,
          rollback_payload: { endpoint_id, cve_id, log_id: log?.id },
        }
      : { rollback_available: false };

    console.log(
      `[patch] 🏁 Deploy complete — status=${patchStatus} rollback=${rollback_enabled}\n`
    );

    return res.json({
      success: patchSuccess,
      message: patchSuccess
        ? `Patch deployed successfully for ${cve_id}`
        : `Patch deployment failed for ${cve_id}`,
      cve_id,
      endpoint_id,
      status: patchStatus,
      deployed_at: deployedAt,
      log_id: log?.id || null,
      ...rollbackInfo,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/patch/rollback
 *
 * Body:
 *   endpoint_id — target endpoint UUID
 *   cve_id      — CVE to roll back
 *   log_id      — patch_logs row to reference for rollback
 */
router.post("/rollback", async (req, res, next) => {
  const { endpoint_id, cve_id, log_id } = req.body;

  if (!endpoint_id || !cve_id) {
    return res
      .status(400)
      .json({ error: "endpoint_id and cve_id are required for rollback" });
  }

  console.log(
    `\n[patch] 🔄 Rollback request — endpoint=${endpoint_id} cve=${cve_id} log_id=${log_id}`
  );

  try {
    // Verify the original log entry had rollback_enabled
    if (log_id) {
      const { data: origLog } = await supabase
        .from("patch_logs")
        .select("rollback_enabled")
        .eq("id", log_id)
        .single();

      if (origLog && !origLog.rollback_enabled) {
        return res.status(403).json({
          error: "Rollback was not enabled for this patch deployment",
          log_id,
        });
      }
    }

    // Log the rollback action
    const { data: rollbackLog, error: rollbackErr } = await supabase
      .from("patch_logs")
      .insert({
        endpoint_id,
        cve_id,
        action: "rollback",
        status: "success",
        rollback_enabled: false,
        notes: `Rollback of patch for ${cve_id} (ref log_id: ${log_id || "unknown"})`,
        deployed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (rollbackErr) throw rollbackErr;

    // Reopen the vulnerability
    await supabase
      .from("vulnerabilities")
      .update({ status: "open", patched_at: null })
      .eq("endpoint_id", endpoint_id)
      .eq("cve_id", cve_id);

    console.log(`[patch] ↩️  Rollback complete for ${cve_id}\n`);

    return res.json({
      success: true,
      message: `Rollback complete for ${cve_id}`,
      log_id: rollbackLog.id,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/patch/logs/:endpoint_id
 * Quick helper to get patch history for an endpoint
 */
router.get("/logs/:endpoint_id", async (req, res, next) => {
  const { endpoint_id } = req.params;
  console.log(`[patch] 📋 Fetching patch history for endpoint=${endpoint_id}`);

  try {
    const { data, error } = await supabase
      .from("patch_logs")
      .select("*")
      .eq("endpoint_id", endpoint_id)
      .order("deployed_at", { ascending: false });

    if (error) throw error;
    return res.json({ data, count: data.length });
  } catch (err) {
    next(err);
  }
});

// ─── Simulation helper ────────────────────────────────────────────────────────

/**
 * Simulates patch deployment with a 90% success rate.
 * Replace this with actual integration (Ansible, WSUS, etc.)
 */
async function simulatePatchDeployment(cve_id, endpoint_id) {
  console.log(
    `[patch/sim] ⏳ Deploying patch for ${cve_id} on endpoint ${endpoint_id}...`
  );
  await new Promise((r) => setTimeout(r, 300)); // simulate async work
  const success = Math.random() > 0.1; // 90% success rate in demo
  console.log(`[patch/sim] ${success ? "✅ Patch applied" : "❌ Patch failed"}`);
  return success;
}

module.exports = router;