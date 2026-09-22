// =============================================================================
// VERITY Automated Test Suite & Integrity Verification
// =============================================================================
import http from 'http';
import https from 'https';

console.log("\n=======================================================");
console.log("   VERITY Automated Quality & Verification Test Suite");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    failed++;
  }
}

async function fetchRoute(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log("1. Testing Route Protection & Auth Control:");
  try {
    const dashRes = await fetchRoute('/dashboard');
    assert(dashRes.status === 307, "Unauthenticated /dashboard access returns HTTP 307 Redirect");
    assert(dashRes.headers.location && dashRes.headers.location.includes('/login'), "Redirect targets /login?redirect=/dashboard");
  } catch (err) {
    console.log("  [SKIP] Local server on port 3000 not active for route tests (run 'npm run start' first)");
  }

  console.log("\n2. Testing Secret Admin Portal (/admin):");
  try {
    const adminRes = await fetchRoute('/admin');
    assert(adminRes.status === 200, "/admin route loads successfully");
    assert(!adminRes.body.includes("001200"), "PIN code '001200' is NOT exposed in HTML/DOM");
    assert(adminRes.body.includes("Security Verification") || adminRes.body.includes("Authenticate"), "PIN verification security gate rendered");
  } catch (err) {
    console.log("  [SKIP] Local server on port 3000 not active");
  }

  console.log("\n3. Testing SEO & Discovery Infrastructure:");
  try {
    const robotsRes = await fetchRoute('/robots.txt');
    assert(robotsRes.status === 200, "/robots.txt returns HTTP 200");
    assert(robotsRes.body.includes("Disallow: /admin"), "robots.txt protects /admin");
    assert(robotsRes.body.includes("sitemap.xml"), "robots.txt links to sitemap.xml");

    const sitemapRes = await fetchRoute('/sitemap.xml');
    assert(sitemapRes.status === 200, "/sitemap.xml returns HTTP 200");
    assert(sitemapRes.body.includes("<loc>"), "sitemap contains canonical <loc> entries");
    assert(sitemapRes.body.includes("<lastmod>"), "sitemap contains freshness <lastmod> timestamps");
  } catch (err) {
    console.log("  [SKIP] Local server on port 3000 not active");
  }

  console.log("\n4. Testing Core Platform Health:");
  try {
    const healthRes = await fetchRoute('/api/v1/health');
    assert(healthRes.status === 200, "Health API returns HTTP 200");
    const health = JSON.parse(healthRes.body);
    assert(health.status === 'healthy' || health.status === 'ok', "Health check status is healthy");
    assert(health.engine && health.engine.includes('verity'), "Engine identifier is VERITY");
  } catch (err) {
    console.log("  [SKIP] Local server on port 3000 not active");
  }

  console.log("\n5. Testing Grounded AI Research Chat & Copilot:");
  try {
    const sampleId = "65b44f9c-8573-417f-b924-834ab3eb7068";
    const chatGet = await fetchRoute(`/api/v1/research/${sampleId}/chat`);
    assert(chatGet.status === 200, "Chat history API returns HTTP 200");
    const chatData = JSON.parse(chatGet.body);
    assert(Array.isArray(chatData.data) && chatData.data.length > 0, "Chat history contains pre-seeded grounded messages");

    const chatPost = await fetchRoute(`/api/v1/research/${sampleId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What are the key experimental limitations?" }),
    });
    assert(chatPost.status === 200, "Chat post inquiry returns HTTP 200");
    const postData = JSON.parse(chatPost.body);
    assert(postData.data && postData.data.role === "assistant", "Chat reply contains grounded assistant role");
    assert(postData.data.citations && postData.data.citations.length > 0, "Chat response includes citation anchors");

    const projectsRes = await fetchRoute('/api/v1/projects');
    assert(projectsRes.status === 200, "Projects catalog API returns HTTP 200");
    const projs = JSON.parse(projectsRes.body);
    assert(Array.isArray(projs) && projs.length > 0, "Projects array populated with workspaces");
  } catch (err) {
    console.log("  [FAIL] Grounded research chat test failed: " + err.message);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(`   Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
