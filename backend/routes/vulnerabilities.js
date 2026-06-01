const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

router.get("/", async (req, res, next) => {
  const {
    severity,
    endpoint_id,
    software_id,
    status,
    cve_id,
    limit = 50,
    offset = 0,
    sort = "cvss_score",
    order = "desc",
  } = req.query;

  const parsedLimit = Math.min(parseInt(limit, 10) || 50, 200);
  const parsedOffset = parseInt(offset, 10) || 0;

  console.log(`[vulnerabilities] 📋 GET request`, {
    filters: { severity, endpoint_id, software_id, status, cve_id },
    pagination: { limit: parsedLimit, offset: parsedOffset, sort, order },
  });

  try {
    let query = supabase
      .from("vulnerabilities")
      .select(
        `
        id,
        cve_id,
        description,
        severity,
        cvss_score,
        status,
        detected_at,
        patch_available,
        endpoint_id,
        software_id,
        endpoints (
          id,
          hostname,
          ip_address,
          os,
          status
        ),
        software (
          id,
          name,
          installed_version,
          latest_version
        )
      `,
        { count: "exact" }
      )
      .order(sort, { ascending: order === "asc" })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (severity) {
      const severityList = severity.toUpperCase().split(",").map((s) => s.trim());
      console.log(`[vulnerabilities] 🔎 Filter severity IN (${severityList.join(", ")})`);
      query = query.in("severity", severityList);
    }
    if (endpoint_id) query = query.eq("endpoint_id", endpoint_id);
    if (software_id) query = query.eq("software_id", software_id);
    if (status) query = query.eq("status", status.toLowerCase());
    if (cve_id) query = query.ilike("cve_id", `%${cve_id}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const { data: summaryData } = await supabase
      .from("vulnerabilities")
      .select("severity");

    const summary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    if (summaryData) {
      for (const row of summaryData) {
        const key = row.severity?.toUpperCase();
        if (key in summary) summary[key]++;
      }
    }

    console.log(`[vulnerabilities] ✅ Returning ${data.length} of ${count} total record(s)`);

    return res.json({
      data,
      pagination: {
        total: count,
        limit: parsedLimit,
        offset: parsedOffset,
        has_more: parsedOffset + parsedLimit < count,
      },
      summary,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("vulnerabilities")
      .select(`*, endpoints(id, hostname, ip_address, os), software(id, name, installed_version)`)
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Vulnerability not found", id });
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;