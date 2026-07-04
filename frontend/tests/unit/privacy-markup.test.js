import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const index = readFileSync(resolve(root, "index.html"), "utf8");
const privacy = readFileSync(resolve(root, "privacy.html"), "utf8");
const terms = readFileSync(resolve(root, "terms.html"), "utf8");
const normalizedPrivacy = privacy.replace(/\s+/g, " ");
const normalizedTerms = terms.replace(/\s+/g, " ");
const footer = readFileSync(resolve(root, "src/views/footer.html"), "utf8");
const footerStyles = readFileSync(resolve(root, "src/styles/footer.css"), "utf8");

describe("privacy surfaces", () => {
  it("keeps executable theme code out of inline scripts", () => {
    expect(index).toContain('<script src="/src/theme-boot.js" type="module"></script>');
    expect(index).not.toMatch(/<script>\s*[\s\S]+?<\/script>/);
  });

  it("keeps the waitlist disclosure concise and links the privacy policy in the legal footer", () => {
    expect(footer.match(/href="\/privacy"/g)).toHaveLength(1);
    expect(footer).toContain('id="waitlistConsent"');
    expect(footer).toContain("I agree to receive one launch notification");
    expect(footer).toContain(
      "No newsletters. No spam. Your email will only be used for this launch update."
    );
    expect(footer).not.toContain("before joining");
    expect(footer).toContain('type="email"');
    expect(footer).toContain("required disabled");
  });

  it("links the terms in the legal footer", () => {
    expect(footer.match(/href="\/terms"/g)).toHaveLength(1);
    expect(footer).toContain("Terms of Use");
  });

  it("presents legal links as bottom-right fine print", () => {
    expect(footerStyles).toMatch(/\.footer-legal\s*{[\s\S]*justify-content: flex-end;/);
    expect(footerStyles).toMatch(/\.footer-legal\s*{[\s\S]*justify-self: end;/);
    expect(footerStyles).toMatch(/\.footer-legal\s*{[\s\S]*font-size: 0\.75rem;/);
    expect(footerStyles).toMatch(/\.footer-legal a\s*{[\s\S]*text-decoration: none;/);
  });

  it("publishes the required privacy disclosures", () => {
    expect(privacy).toContain("Effective July 4, 2026");
    expect(privacy).not.toContain("MongoDB Atlas");
    expect(privacy).not.toContain("Upstash");
    expect(privacy).not.toContain("Cloudflare Turnstile");
    expect(privacy).toContain("service providers for hosting, data storage, caching, security checks");
    expect(privacy).toContain("rate-limit record typically expires about 65 seconds");
    expect(normalizedPrivacy).toContain(
      "does not intentionally store the raw IP in its rate-limit records"
    );
    expect(normalizedPrivacy).toContain(
      "Providing an email, giving consent, and completing the security check are optional"
    );
    expect(privacy).toContain("Do Not Track");
    expect(privacy).toContain("automatic deletion within 30 days");
    expect(privacy).toContain("dashboard and its launch waitlist are available globally");
    expect(privacy).toContain("legal basis for this email use is your consent");
    expect(privacy).toContain("lodge a complaint with the data-protection authority");
    expect(privacy).toContain("international transfers rely on");
    expect(privacy).toContain("data-privacy-controller");
    expect(privacy).toContain("market-sentiment dashboard operated by");
    expect(privacy).toContain("We may introduce advertising, analytics");
    expect(privacy).toContain("honor recognized");
    expect(privacy).toContain("Waitlist consent covers only the one launch notification");
    expect(privacy).toContain("does not authorize advertising, data sales, or cross-site profiling");
    expect(normalizedPrivacy).toContain("The Service is not intended for anyone under 18");
    expect(privacy).not.toContain("children under 16");
    expect(privacy).not.toContain("This policy describes current practices and is not legal advice");
    expect(privacy).not.toContain("The data controller is");
    expect(privacy).not.toContain("The controller is");
  });

  it("publishes the current service terms and core protections", () => {
    expect(normalizedTerms).toContain("Effective July 4, 2026");
    expect(normalizedTerms).toContain("The Service is intended only for people who are at least 18 years old");
    expect(normalizedTerms).toContain("If you are under 18, do not access or use");
    expect(normalizedTerms).not.toContain("involvement of a parent or legal guardian");
    expect(normalizedTerms).toContain("informational and educational purposes only");
    expect(normalizedTerms).toContain(
      "does not provide financial, investment, legal, tax, or trading advice"
    );
    expect(normalizedTerms).toContain(
      "do not guarantee that any information is accurate, complete, current, or available in real time"
    );
    expect(normalizedTerms).toContain("third-party individuals, companies, quotations, indices");
    expect(normalizedTerms).toContain(
      "does not imply sponsorship, endorsement, affiliation, or approval"
    );
    expect(normalizedTerms).toContain("Historical readings, thresholds, and patterns do not guarantee");
    expect(normalizedTerms).toContain(
      "Nothing in these Terms grants any license to third-party materials or marks"
    );
    expect(normalizedTerms).not.toContain("constitute fair uses");
    expect(normalizedTerms).not.toContain("nominative fair use");
    expect(normalizedTerms).toContain(
      "built-in sharing feature to share occasional dashboard snapshots"
    );
    expect(normalizedTerms).toContain(
      "systematically extract, bulk reproduce, or bulk redistribute third-party market data"
    );
    expect(normalizedTerms).not.toContain(
      "commercially exploit third-party market data"
    );
    expect(normalizedTerms).toContain('href="/privacy"');
    expect(normalizedTerms).toContain(
      "Circumvent rate limits, security controls, or access restrictions"
    );
    expect(normalizedTerms).toContain("total aggregate liability to you");
    expect(normalizedTerms).toContain("claim or US $10");
    expect(normalizedTerms).not.toContain("US $100");
    expect(normalizedTerms).toContain("data-privacy-email");
    expect(normalizedTerms).toContain("The Service is available globally");
    expect(normalizedTerms).toContain("data-privacy-controller");
    expect(normalizedTerms).toContain("US Stock Market Emotions is operated by");
    expect(normalizedTerms).not.toContain("reviewed by qualified US counsel");
  });
});
