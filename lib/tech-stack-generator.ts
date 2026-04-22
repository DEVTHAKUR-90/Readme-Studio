/**
 * Tech Stack Generator
 * ====================
 *
 * Builds a comprehensive, categorized catalog of technology badges sourced
 * from the `simple-icons` npm package (~3,200 official brand logos). Every
 * entry has a canonical slug + hex color straight from the brand guidelines,
 * so we never ship broken or off-brand badges.
 *
 * Design goals
 * ------------
 *   1. ZERO hand-curated lists. simple-icons is the source of truth.
 *   2. Automatic categorization via ordered keyword classifiers.
 *   3. O(1) search: pre-compute a lowercased haystack per item.
 *   4. Stable deterministic sort order so the virtualizer doesn't flicker.
 *
 * Public API (kept backward-compatible with the previous static catalog):
 *   - TechItem, TechCategory, LogoColor
 *   - TECH_STACK               (array of categories, alphabetized)
 *   - FLAT_TECH_STACK          (flat array for virtualization)
 *   - TECH_STACK_COUNT         (total item count)
 *   - searchTechStack(q)
 *   - renderTechBadgeMarkdown(item)
 *   - renderTechBadgeBlock(items)
 */

import * as SimpleIcons from "simple-icons";
import { CURATED_LANGUAGES } from "./tech-stack-languages";

// ---------------------------------------------------------------------------
// Types (kept compatible with the previous catalog)
// ---------------------------------------------------------------------------

export type LogoColor = "white" | "black";

export interface TechItem {
  /** Display name — used in badge label and search. */
  name: string;
  /** simple-icons canonical slug (lowercase, URL-safe). */
  logo: string;
  /** 6-char hex without `#`. */
  hex: string;
  /** Chosen to maximize contrast against `hex`. */
  logoColor: LogoColor;
  /** Category id this item belongs to. */
  categoryId: string;
  /** Pre-computed lowercased haystack for cheap `.includes()` filtering. */
  haystack: string;
}

export interface TechCategory {
  id: string;
  label: string;
  icon: string;
  /** Order hint — lower renders first. Other/Misc sinks to the bottom. */
  order: number;
  items: TechItem[];
}

// ---------------------------------------------------------------------------
// Contrast utility — pick white or black logo color for best legibility
// ---------------------------------------------------------------------------

/**
 * Decide whether a white or black logo sits better on top of the given brand
 * hex. Uses WCAG-style relative luminance; the 0.55 threshold empirically
 * matches GitHub's own rendering choices on shields.io badges.
 */
function pickLogoColor(hex: string): LogoColor {
  const clean = hex.replace(/^#/, "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const L =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.55 ? "black" : "white";
}

// ---------------------------------------------------------------------------
// Category classifier
// ---------------------------------------------------------------------------

/**
 * Each classifier entry associates a category with a list of regex patterns.
 * Order matters — the FIRST match wins. More specific buckets come first
 * (e.g., "kafka" must match Data & ML, not some generic "apache" rule).
 *
 * Patterns are tested against a combined haystack of `${slug} ${title}`.
 * All patterns are lowercase and use word-aware matching where ambiguity
 * would be expensive (e.g., "c" the language).
 */
interface ClassifierRule {
  id: string;
  label: string;
  icon: string;
  order: number;
  match: RegExp[];
}

const CLASSIFIERS: ClassifierRule[] = [
  // ---------- LANGUAGES (must come before frameworks so e.g. "rust" lands here) --
  {
    id: "languages",
    label: "Programming Languages",
    icon: "🧑‍💻",
    order: 10,
    match: [
      /\b(python|javascript|typescript|java|kotlin|swift|rust|ruby|php|perl|scala|haskell|elixir|erlang|clojure|lua|dart|julia|zig|nim|crystal|fortran|ocaml|cobol|fsharp|csharp|solidity|groovy|matlab|latex|markdown)\b/,
      /\b(gnubash|gnuemacs|powershell|assemblyscript)\b/,
      /^(c|cplusplus|r|go|d)$/, // single-letter / short language slugs
      /\b(openjdk|webassembly)\b/,
    ],
  },

  // ---------- DATA & ML/DL (before "frameworks" catches TensorFlow) --------------
  {
    id: "data-ml",
    label: "Data & ML/DL",
    icon: "🧠",
    order: 20,
    match: [
      /\b(pandas|numpy|scipy|scikitlearn|tensorflow|pytorch|keras|jax|huggingface|langchain|llamaindex|openai|anthropic|mistralai|cohere|pinecone|weaviate|chroma|qdrant|milvus|ollama)\b/,
      /\b(opencv|spacy|nltk|xgboost|mlflow|dvc|weightsandbiases|jupyter|kaggle|anaconda|databricks|dbt)\b/,
      /\b(apachespark|apachekafka|apachehadoop|apacheairflow|apachehive|apachepulsar|apachestorm|apacheflink|apachebeam)\b/,
      /\b(powerbi|tableau|looker|metabase|superset|matplotlib|plotly|seaborn|observable|streamlit|grafana)\b/,
      /\b(snowflake|bigquery|clickhouse|influxdb|druid|presto|trino)\b/,
    ],
  },

  // ---------- CYBERSECURITY (before cloud/tools catches generic terms) -----------
  {
    id: "cybersecurity",
    label: "Cybersecurity Arsenal",
    icon: "🔐",
    order: 30,
    match: [
      /\b(kalilinux|parrotsecurity|tails|torproject|whonix)\b/,
      /\b(wireshark|burpsuite|metasploit|nmap|owasp|snyk|hackerone|bugcrowd|shodan|hackthebox|tryhackme)\b/,
      /\b(1password|bitwarden|lastpass|keeper|dashlane|nordpass|protonpass)\b/,
      /\b(letsencrypt|openssl|gnuprivacyguard|keybase|yubico|cyberark|okta|auth0|keycloak|onelogin|duo)\b/,
      /\b(cisco|fortinet|paloalto|crowdstrike|cloudflare|sophos|mcafee|kaspersky|bitdefender|malwarebytes)\b/,
      /\b(tenable|qualys|rapid7|nessus|nexpose|greenbone|openvas)\b/,
      /\b(splunk|elastic|sumologic|logrhythm|darktrace)\b/,
      /\b(pfsense|opnsense|wireguard|openvpn|tailscale|zerotier)\b/,
      /\b(jsonwebtokens|oauth|saml|webauthn|fido)\b/,
      /\b(hashicorp|vault)\b/,
    ],
  },

  // ---------- DATABASES ---------------------------------------------------------
  {
    id: "databases",
    label: "Databases",
    icon: "🗄️",
    order: 40,
    match: [
      /\b(mysql|postgresql|sqlite|mariadb|mongodb|redis|cassandra|couchdb|couchbase|dynamodb)\b/,
      /\b(firebase|firestore|supabase|planetscale|neon|turso|cockroachdb|neo4j|elasticsearch)\b/,
      /\b(realm|microsoftsqlserver|oracle|oracledatabase|sybase|db2|sqlserver)\b/,
      /\b(prisma|sequelize|typeorm|hibernate|knexdotjs|mongoose|drizzle)\b/,
      /\b(rethinkdb|arangodb|faunadb|surrealdb|scylladb|etcd)\b/,
    ],
  },

  // ---------- CLOUD / HOSTING / SAAS -------------------------------------------
  {
    id: "cloud",
    label: "Hosting & Cloud",
    icon: "☁️",
    order: 50,
    match: [
      /\b(amazonaws|microsoftazure|googlecloud|ibmcloud|alibabacloud|oraclecloud|digitalocean|linode|vultr|ovhcloud|scaleway)\b/,
      /\b(vercel|netlify|cloudflare|cloudflarepages|heroku|render|railway|flydotio|amazonec2|amazons3)\b/,
      /\b(amazonroute53|amazonrds|amazoncloudfront|amazondocumentdb|amazonelasticache|amazonwebservices)\b/,
      /\b(appwrite|backendless|parse|firebase|gcp|aws|azure)\b/,
      /\b(datadog|newrelic|sentry|bugsnag|rollbar|honeybadger|pagerduty|statuspage)\b/,
      /\b(grafana|prometheus|jaeger|opentelemetry|zipkin|kibana|logstash)\b/,
      /\b(mailchimp|sendgrid|postmark|mailgun|twilio|algolia)\b/,
    ],
  },

  // ---------- CI/CD / DEVOPS / INFRA -------------------------------------------
  {
    id: "devops",
    label: "CI/CD & DevOps",
    icon: "🚀",
    order: 60,
    match: [
      /\b(docker|kubernetes|helm|istio|linkerd|envoy|traefik|nginx|apache|haproxy)\b/,
      /\b(terraform|pulumi|ansible|chef|puppet|saltstack|vagrant|packer)\b/,
      /\b(githubactions|gitlabci|jenkins|circleci|travisci|bitbucketpipelines|teamcity|bamboo|drone)\b/,
      /\b(argo|octopusdeploy|spinnaker|harness|codepipeline|codedeploy|codebuild)\b/,
      /\b(consul|nomad|rancher|openshift|portainer|podman|buildah|skaffold)\b/,
      /\b(linux|ubuntu|debian|fedora|alpinelinux|archlinux|redhat|centos|rockylinux|almalinux|opensuse|gentoo|slackware|manjaro)\b/,
    ],
  },

  // ---------- FRAMEWORKS & LIBRARIES -------------------------------------------
  {
    id: "frameworks",
    label: "Frameworks & Libraries",
    icon: "🧩",
    order: 70,
    match: [
      /\b(react|nextdotjs|vuedotjs|nuxtdotjs|angular|svelte|sveltekit|solid|astro|remix|gatsby|emberdotjs|alpinedotjs|qwik|lit|stencil)\b/,
      /\b(nodedotjs|deno|bun|express|fastify|nestjs|koa|hono|meteor|adonisjs|sails|hapi)\b/,
      /\b(django|flask|fastapi|tornado|pyramid|bottle|starlette|litestar|sanic|quart|streamlit)\b/,
      /\b(rubyonrails|sinatra|hanami|roda)\b/,
      /\b(laravel|symfony|codeigniter|cakephp|yii|phalcon|slim|lumen|zend)\b/,
      /\b(spring|springboot|quarkus|micronaut|vertx|dropwizard|playframework)\b/,
      /\b(dotnet|aspdotnet|blazor|xamarin|maui)\b/,
      /\b(phoenixframework|gin|echo|fiber|beego|revel|buffalo|iris)\b/,
      /\b(jquery|bootstrap|tailwindcss|bulma|foundation|chakraui|mui|antdesign|radixui|shadcnui|mantine|semanticui)\b/,
      /\b(redux|mobx|reactquery|swr|apollographql|relay|urql|tanstack|jotai|recoil|valtio|zustand)\b/,
      /\b(framer|threedotjs|d3dotjs|chartdotjs|recharts|victorycharts|highcharts|echarts|visx)\b/,
      /\b(vite|webpack|rollupdotjs|parcel|esbuild|swc|turbopack|babel|snowpack)\b/,
      /\b(electron|tauri|neutralinojs|capacitor|cordova)\b/,
      /\b(flutter|reactnative|ionic|expo|nativescript)\b/,
      /\b(qt|gtk|wxwidgets)\b/,
      /\b(rxjs|lodash|underscore|ramda|immerjs|immutablejs|dayjs|moment)\b/,
    ],
  },

  // ---------- WEB TECHNOLOGIES --------------------------------------------------
  {
    id: "web",
    label: "Web Technologies",
    icon: "🌐",
    order: 80,
    match: [
      /\b(html5|css3|sass|less|stylus|postcss|webassembly|graphql|openapi|swagger|restapi|websocket|webrtc)\b/,
      /\b(json|xml|yaml|toml|webpack|webgl|webgpu|socketdotio|pwa|serviceworker|progressivewebapp)\b/,
    ],
  },

  // ---------- DEV TOOLS / IDE / UTILITIES --------------------------------------
  {
    id: "tools",
    label: "Development Tools",
    icon: "🧰",
    order: 90,
    match: [
      /\b(git|github|gitlab|bitbucket|gitea|codeberg|sourcehut|sourceforge|gerrit|mercurial|subversion)\b/,
      /\b(visualstudiocode|visualstudio|neovim|vim|gnuemacs|jetbrains|intellijidea|webstorm|pycharm|goland|rider|rubymine|phpstorm|clion|datagrip|rustrover)\b/,
      /\b(xcode|androidstudio|cursor|zedindustries|eclipseide|atom|sublimetext|notepadplusplus|brackets|coda|textmate)\b/,
      /\b(postman|insomnia|bruno|hoppscotch|paw|thunderclient)\b/,
      /\b(warp|iterm2|tmux|ohmyzsh|hyper|alacritty|kitty|windowsterminal)\b/,
      /\b(obsidian|notion|linear|jira|trello|asana|clickup|basecamp|confluence|youtrack)\b/,
      /\b(slack|discord|microsoftteams|zoom|googlemeet|skype|telegram|signal|mattermost|rocketdotchat)\b/,
      /\b(npm|pnpm|yarn|bun|homebrew|chocolatey|scoop|winget|macports|aptitude|dnf|pacman|rpm)\b/,
      /\b(codesandbox|stackblitz|glitch|replit|gitpod|codespaces)\b/,
    ],
  },

  // ---------- DESIGN -----------------------------------------------------------
  {
    id: "design",
    label: "Design Tools",
    icon: "🎨",
    order: 100,
    match: [
      /\b(figma|sketch|adobexd|adobephotoshop|adobeillustrator|adobeaftereffects|adobepremiere|adobeindesign|adobelightroom|adobecreativecloud|adobefresco|adobeanimate|adobeauditor|adobeaudition|adobebridge|adobedreamweaver|adobeincopy|adobestock)\b/,
      /\b(canva|framer|invision|miro|mural|whimsical|figjam|zeplin|abstract|principle|origami|protopie|marvelapp)\b/,
      /\b(blender|cinema4d|maya|zbrush|substancepainter|substance3d|houdini|modo|lightwave3d|rhinoceros)\b/,
      /\b(unity|unrealengine|godotengine|gamemaker|construct|phaser|cocos)\b/,
      /\b(affinitydesigner|affinityphoto|affinitypublisher|gimp|inkscape|krita|darktable|rawtherapee|paintdotnet)\b/,
    ],
  },

  // ---------- VIRTUALIZATION / OS / HARDWARE -----------------------------------
  {
    id: "virtualization",
    label: "Virtualization & OS",
    icon: "🖥️",
    order: 110,
    match: [
      /\b(virtualbox|vmware|qemu|proxmox|hyperv|vagrant|wsl|dockerdesktop|openstack|xenproject|kvm|lxc|lxd)\b/,
      /\b(macos|windows11|windows10|apple|windows|ios|android|chromeos|harmonyos)\b/,
      /\b(freebsd|openbsd|netbsd|dragonflybsd|solaris|haiku|reactos)\b/,
      /\b(raspberrypi|arduino|nvidia|intel|amd|arm)\b/,
    ],
  },

  // ---------- TESTING ----------------------------------------------------------
  {
    id: "testing",
    label: "Testing",
    icon: "🧪",
    order: 120,
    match: [
      /\b(jest|vitest|mocha|jasmine|karma|ava|tap|tape|qunit)\b/,
      /\b(cypress|playwright|puppeteer|selenium|testinglibrary|webdriverio|testcafe|nightwatchdotjs|codeceptjs)\b/,
      /\b(storybook|pytest|junit5|nunit|xunit|rspec|minitest|phpunit|gotest)\b/,
      /\b(k6|apachejmeter|gatling|locust|artillery|siege)\b/,
      /\b(sonarqube|sonarcloud|codecov|coveralls|codeclimate|deepsource)\b/,
    ],
  },
];

// ---------------------------------------------------------------------------
// Build pipeline
// ---------------------------------------------------------------------------

/** Shape of a simple-icons entry (the subset we care about). */
interface SimpleIconRecord {
  title: string;
  slug: string;
  hex: string;
}

/**
 * Classify a simple-icons record into one of our categories.
 * Returns `"other"` if no rule matches (we keep everything — nothing is lost).
 */
function classify(slug: string, title: string): string {
  const hay = `${slug} ${title}`.toLowerCase();
  for (const rule of CLASSIFIERS) {
    for (const rx of rule.match) {
      if (rx.test(hay)) return rule.id;
    }
  }
  return "other";
}

/** Build the full catalog. Runs once at module load. */
function buildCatalog(): {
  categories: TechCategory[];
  flat: TechItem[];
} {
  // simple-icons exports entries as `si<CamelCase>` plus a few non-icon keys.
  // We accept anything that looks like an icon record.
  const raw = SimpleIcons as unknown as Record<string, SimpleIconRecord | unknown>;

  const entries: SimpleIconRecord[] = [];
  for (const key of Object.keys(raw)) {
    const v = raw[key];
    if (!v || typeof v !== "object") continue;
    const rec = v as Partial<SimpleIconRecord>;
    if (
      typeof rec.title === "string" &&
      typeof rec.slug === "string" &&
      typeof rec.hex === "string" &&
      /^[0-9A-Fa-f]{6}$/.test(rec.hex)
    ) {
      entries.push({ title: rec.title, slug: rec.slug, hex: rec.hex });
    }
  }

  // De-dupe by slug. simple-icons occasionally publishes both `foo` and
  // `foo-alt` variants — we keep the shorter slug.
  const bySlug = new Map<string, SimpleIconRecord>();
  for (const e of entries) {
    const prev = bySlug.get(e.slug);
    if (!prev || e.slug.length < prev.slug.length) bySlug.set(e.slug, e);
  }

  // Materialize into our internal shape.
  const flat: TechItem[] = [];
  // Track names we've already added so curated language entries don't
  // produce duplicates (e.g. simple-icons' "OpenJDK" plus our curated "Java"
  // — both are legitimate, kept separate by name).
  const seenKey = new Set<string>();
  const keyOf = (name: string, logo: string) => `${name.toLowerCase()}|${logo}`;

  for (const rec of bySlug.values()) {
    const categoryId = classify(rec.slug, rec.title);
    const haystack = `${rec.title} ${rec.slug}`.toLowerCase();
    const key = keyOf(rec.title, rec.slug);
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    flat.push({
      name: rec.title,
      logo: rec.slug,
      hex: rec.hex.toUpperCase(),
      logoColor: pickLogoColor(rec.hex),
      categoryId,
      haystack,
    });
  }

  // Overlay curated languages. These are always classified as "languages"
  // regardless of what the keyword classifier would have done — they are by
  // definition programming languages.
  for (const lang of CURATED_LANGUAGES) {
    const key = keyOf(lang.name, lang.logo);
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    const aliasPart = lang.aliases ? ` ${lang.aliases.join(" ")}` : "";
    flat.push({
      name: lang.name,
      logo: lang.logo,
      hex: lang.hex.toUpperCase(),
      logoColor: lang.logoColor,
      categoryId: "languages",
      haystack: `${lang.name} ${lang.logo}${aliasPart}`.toLowerCase(),
    });
  }

  // Alphabetize so render order is deterministic.
  flat.sort((a, b) => a.name.localeCompare(b.name));

  // Bucket into categories.
  const byCategory = new Map<string, TechItem[]>();
  for (const item of flat) {
    const list = byCategory.get(item.categoryId) ?? [];
    list.push(item);
    byCategory.set(item.categoryId, list);
  }

  const categories: TechCategory[] = CLASSIFIERS.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    order: c.order,
    items: byCategory.get(c.id) ?? [],
  }));

  // "Other" bucket for unclassified items.
  const otherItems = byCategory.get("other") ?? [];
  if (otherItems.length > 0) {
    categories.push({
      id: "other",
      label: "Other / Miscellaneous",
      icon: "📦",
      order: 9999,
      items: otherItems,
    });
  }

  // Drop empty categories and sort by the declared order.
  const filled = categories
    .filter((c) => c.items.length > 0)
    .sort((a, b) => a.order - b.order);

  return { categories: filled, flat };
}

const built = buildCatalog();

export const TECH_STACK: TechCategory[] = built.categories;
export const FLAT_TECH_STACK: TechItem[] = built.flat;
export const TECH_STACK_COUNT: number = built.flat.length;

// ---------------------------------------------------------------------------
// Search — debouncing happens in the hook; here we just filter as fast as
// possible. Pre-computed haystack keeps this O(n) with a single `.includes()`.
//
// Results are ranked so that exact name matches come first, then prefix
// matches, then substring matches. This is what makes "java" surface Java
// before JavaScript instead of the reverse.
// ---------------------------------------------------------------------------

function rank(item: TechItem, q: string): number {
  const name = item.name.toLowerCase();
  if (name === q) return 0;               // exact name match — top priority
  if (name.startsWith(q)) return 1;        // "java" → Java, JavaScript (prefix)
  if (item.logo === q) return 2;           // exact slug match
  if (name.includes(q)) return 3;          // name substring
  return 4;                                // haystack-only match
}

export function searchTechStack(query: string): TechCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return TECH_STACK;

  const out: TechCategory[] = [];
  for (const cat of TECH_STACK) {
    const items = cat.items
      .filter((item) => item.haystack.includes(q))
      .sort((a, b) => {
        const ra = rank(a, q);
        const rb = rank(b, q);
        return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
      });
    if (items.length > 0) out.push({ ...cat, items });
  }
  return out;
}

/** Flat filtered view — used by the virtualized grid. Ranked the same way. */
export function searchFlat(query: string): TechItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FLAT_TECH_STACK;
  return FLAT_TECH_STACK.filter((item) => item.haystack.includes(q)).sort(
    (a, b) => {
      const ra = rank(a, q);
      const rb = rank(b, q);
      return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
    },
  );
}

// ---------------------------------------------------------------------------
// Markdown output — exact format required by the spec
// ---------------------------------------------------------------------------

/**
 * Shields.io treats `-` as the label/message separator, so any dash in the
 * displayed name must be doubled. `_` becomes space visually, so it must be
 * doubled too if we want to keep a literal underscore.
 */
function shieldsEncode(label: string): string {
  return encodeURIComponent(label.replace(/-/g, "--").replace(/_/g, "__"));
}

export function renderTechBadgeMarkdown(item: TechItem): string {
  const label = shieldsEncode(item.name);
  const url =
    `https://img.shields.io/badge/${label}-${item.hex}` +
    `?style=for-the-badge&logo=${encodeURIComponent(item.logo)}&logoColor=${item.logoColor}`;
  const alt = item.name.replace(/"/g, "&quot;");
  // Note: `pointer-events` lives in the style attribute (not as a standalone
  // HTML attribute, which HTML silently ignores). This is what actually
  // prevents accidental click/tap interactions on the badge in the preview.
  return `<picture><img src="${url}" alt="${alt}" style="margin:4px; pointer-events:none;" /></picture>&nbsp;`;
}

/**
 * Wrap a collection of badges in `<p align="center">` so GitHub centers them.
 * Produces indented, human-readable output (one badge per line in the source,
 * horizontally adjacent in the rendered view thanks to `inline-block`).
 */
export function renderTechBadgeBlock(items: TechItem[]): string {
  if (items.length === 0) return "";
  const badges = items.map(renderTechBadgeMarkdown).join("\n  ");
  return `<p align="center">\n  ${badges}\n</p>`;
}

/** Direct Shields.io URL (no wrapping markup) — useful for the preview grid. */
export function badgeImageUrl(item: TechItem): string {
  const label = shieldsEncode(item.name);
  return (
    `https://img.shields.io/badge/${label}-${item.hex}` +
    `?style=for-the-badge&logo=${encodeURIComponent(item.logo)}&logoColor=${item.logoColor}`
  );
}
