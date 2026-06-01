export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface Endpoint {
  id:           string
  hostname:     string
  ip_address:   string
  os:           string
  status:       'healthy' | 'warning' | 'critical'
  last_scanned: string
  software_count?:       number
  vulnerability_count?:  number
}

export interface Software {
  id:                string
  endpoint_id:       string
  name:              string
  installed_version: string
  latest_version:    string
}

export interface Vulnerability {
  id:              string
  software_id:     string
  cve_id:          string
  severity:        Severity
  description:     string
  cvss_score:      number
  patch_available: boolean
  software?:       Software
  endpoint?:       Endpoint
}

export interface PatchLog {
  id:           string
  endpoint_id:  string
  cve_id:       string
  action:       string
  status:       'success' | 'failed' | 'rolled_back'
  rolled_back:  boolean
  triggered_by: string
  created_at:   string
  endpoint?:    Endpoint
}

export interface Alert {
  id:          string
  admin_email: string
  cve_id:      string
  severity:    Severity
  message:     string
  is_read:     boolean
  sent_at:     string
}
