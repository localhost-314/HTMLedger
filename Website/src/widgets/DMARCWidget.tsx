import { useState, useMemo } from 'react';
import './DMARCWidget.css';

const EXAMPLE_XML = `<?xml version="1.0" encoding="utf-8"?><feedback><report_metadata><org_name>google.com</org_name><email>noreply-dmarc-support@google.com</email><report_id>17485728290123456</report_id><date_range><begin>1748736000</begin><end>1748822399</end></date_range></report_metadata><policy_published><domain>yourcompany.com</domain><adkim>r</adkim><aspf>r</aspf><p>quarantine</p><sp>none</sp><pct>100</pct></policy_published><record><row><source_ip>209.85.220.41</source_ip><count>142</count><policy_evaluated><disposition>none</disposition><dkim>pass</dkim><spf>pass</spf></policy_evaluated></row><identifiers><header_from>yourcompany.com</header_from></identifiers><auth_results><dkim><domain>yourcompany.com</domain><result>pass</result><selector>google</selector></dkim><spf><domain>yourcompany.com</domain><result>pass</result></spf></auth_results></record><record><row><source_ip>185.234.219.64</source_ip><count>7</count><policy_evaluated><disposition>quarantine</disposition><dkim>fail</dkim><spf>fail</spf></policy_evaluated></row><identifiers><header_from>yourcompany.com</header_from></identifiers><auth_results><dkim><domain>phishing.net</domain><result>fail</result><selector>default</selector></dkim><spf><domain>phishing.net</domain><result>fail</result></spf></auth_results></record></feedback>`;

interface DmarcRecord {
  sourceIp: string;
  count: number;
  disposition: string;
  dkim: string;
  spf: string;
  headerFrom: string;
  dkimDomain: string;
  spfDomain: string;
}

interface DmarcReport {
  orgName: string;
  reportId: string;
  begin: string;
  end: string;
  domain: string;
  policy: string;
  pct: string;
  records: DmarcRecord[];
}

function parseDmarc(xml: string): DmarcReport | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml.trim(), 'text/xml');
    if (doc.querySelector('parsererror')) return null;
    const get = (ctx: Element | Document, sel: string) =>
      ctx.querySelector(sel)?.textContent?.trim() ?? '';
    const toDate = (ts: string) => {
      const n = parseInt(ts);
      return isNaN(n) ? ts : new Date(n * 1000).toLocaleDateString();
    };
    const report: DmarcReport = {
      orgName: get(doc, 'org_name'),
      reportId: get(doc, 'report_id'),
      begin: toDate(get(doc, 'date_range > begin')),
      end: toDate(get(doc, 'date_range > end')),
      domain: get(doc, 'domain'),
      policy: get(doc, 'p'),
      pct: get(doc, 'pct'),
      records: [],
    };
    doc.querySelectorAll('record').forEach(rec => {
      report.records.push({
        sourceIp:   get(rec, 'source_ip'),
        count:      parseInt(get(rec, 'count')) || 0,
        disposition:get(rec, 'disposition'),
        dkim:       get(rec, 'policy_evaluated > dkim'),
        spf:        get(rec, 'policy_evaluated > spf'),
        headerFrom: get(rec, 'header_from'),
        dkimDomain: get(rec, 'auth_results > dkim > domain'),
        spfDomain:  get(rec, 'auth_results > spf > domain'),
      });
    });
    return report;
  } catch { return null; }
}

function chip(val: string) {
  const cls = val === 'pass' ? 'chip-pass' : val === 'fail' ? 'chip-fail' : 'chip-none';
  return <span className={cls}>{val.toUpperCase()}</span>;
}

export default function DMARCWidget() {
  const [showPaste, setShowPaste] = useState(false);
  const [xml, setXml] = useState(EXAMPLE_XML);
  const [draft, setDraft] = useState('');

  const report = useMemo(() => parseDmarc(xml), [xml]);

  const passCount = report?.records.filter(r => r.dkim === 'pass' && r.spf === 'pass').length ?? 0;
  const totalCount = report?.records.length ?? 0;
  const passRate = totalCount ? Math.round((passCount / totalCount) * 100) : 0;

  function applyXml() {
    if (draft.trim()) setXml(draft.trim());
    setShowPaste(false);
  }

  return (
    <div className="dw-wrap">
      <div className="dw-header">
        <div className="dw-header-left">
          <span className="dw-icon">📊</span>
          <div>
            <div className="dw-title">DMARC Report</div>
            {report && (
              <div className="dw-meta">
                {report.orgName} · {report.begin} – {report.end}
              </div>
            )}
          </div>
        </div>
        <div className="dw-header-right">
          {report && (
            <span className={`dw-rate ${passRate === 100 ? 'pass' : passRate >= 80 ? 'warn' : 'fail'}`}>
              {passRate}% pass
            </span>
          )}
          <button className="dw-paste-btn" onClick={() => setShowPaste(v => !v)}>
            {showPaste ? 'Cancel' : 'Try your own ↗'}
          </button>
        </div>
      </div>

      {showPaste && (
        <div className="dw-paste-area">
          <textarea
            className="dw-textarea"
            placeholder="Paste your DMARC aggregate XML here…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
          />
          <button className="btn btn-primary btn-sm" onClick={applyXml}>
            Parse Report
          </button>
        </div>
      )}

      {report ? (
        <>
          <div className="dw-policy">
            <div className="dw-policy-item">
              <span className="dw-policy-label">Domain</span>
              <span className="dw-policy-val">{report.domain}</span>
            </div>
            <div className="dw-policy-item">
              <span className="dw-policy-label">Policy</span>
              <span className="dw-policy-val">{report.policy}</span>
            </div>
            <div className="dw-policy-item">
              <span className="dw-policy-label">PCT</span>
              <span className="dw-policy-val">{report.pct}%</span>
            </div>
          </div>

          <div className="dw-records">
            {report.records.map((rec, i) => {
              const allPass = rec.dkim === 'pass' && rec.spf === 'pass';
              return (
                <div key={i} className={`dw-record ${allPass ? 'pass' : 'fail'}`}>
                  <div className="dw-record-top">
                    <div className="dw-record-ip">
                      <span className="dw-ip-label">Source IP</span>
                      <span className="dw-ip-val">{rec.sourceIp}</span>
                    </div>
                    <div className="dw-record-chips">
                      <span className="dw-chip-label">DKIM</span>{chip(rec.dkim)}
                      <span className="dw-chip-label">SPF</span>{chip(rec.spf)}
                      <span className="dw-count">{rec.count} msg{rec.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="dw-record-bottom">
                    <span className="dw-from">{rec.headerFrom}</span>
                    <span className="dw-disp">{rec.disposition}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="dw-error">Invalid DMARC XML — please check the format.</div>
      )}
    </div>
  );
}
