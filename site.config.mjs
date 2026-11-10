// What oss.sendline.now is built from. Each library's pages come from its repository at `ref`: the release tag, bumped
// when the library releases so the next deploy rebuilds its pages. Between releases `ref` can name a branch instead,
// for docs that should not wait for the next tag, and every page says which. Versions, Scala and JDK facts are read
// from the library's own build at that ref (tools/lib/sources.mjs), so nothing here restates a number the build knows.

export const site = {
  url: 'https://oss.sendline.now',
  org: 'Sendline-now',
  title: 'Sendline Open Source',
  description: 'Effect-agnostic Scala 3 libraries from Sendline: mongo4s, logging4s and metrics4s.',
};

export const runtimes = [
  { id: 'cats', label: 'cats-effect', object: 'CatsInstances' },
  { id: 'zio', label: 'ZIO', object: 'ZioInstances' },
  { id: 'kyo', label: 'Kyo', object: 'KyoInstances' },
  { id: 'rapid', label: 'rapid', object: 'RapidInstances' },
];

// A page is one of:
//   { slug, file }                       a whole document; its H1 is the title
//   { slug, file, section }              one H2 section of a document; its headings move up a level
//   { slug, file, sections, title }      several H2 sections in order, '' standing for the text before the first one
//   { title, href }                      a link out
// `aliases` sends links to README sections that have no page of their own somewhere that does. `legacy` maps the
// anchors of the library's old single-page site, which its old domain now redirects to /<id>/, onto the new pages.
export const libraries = [
  {
    id: 'mongo4s',
    no: '01',
    what: 'MongoDB for Scala 3',
    repo: 'Sendline-now/mongo4s',
    ref: 'main', // the docs are ahead of v6.0.0; back to a tag at the next release
    description: 'Effect-agnostic MongoDB client and repository layer for Scala 3: any runtime, any BSON codec, AST-free by default.',
    versions: { scala: 'scala3', cats: 'catsEffect3', zio: 'zio', kyo: 'kyo', rapid: 'rapid' },
    chips: (v) => [['driver', v.mongo]],
    jdk: { base: '17', notes: [['kyo', '25']] },
    install: { runtime: 'mongo4s-{rt}', modules: [], import: 'mongo4s.{rt}' },
    installNote: '<code>mongo4s-kyo</code> needs JDK 25 at runtime; every other module runs on JDK 17.',
    javadoc: 'mongo4s-core_3',
    lane: {
      text: 'Effect-agnostic MongoDB client and repository layer. Any runtime, any BSON codec, <strong>AST-free by default</strong>, and every repository testable against an in-memory fake.',
      chips: (v) => [`driver ${v.mongo}`, 'MongoDB 8.2 tested'],
      third: { title: 'Changelog', slug: 'changelog' },
    },
    next: ['core-concepts', 'bson-codecs', 'repositories', 'benchmarks'],
    groups: [
      { title: 'Start', pages: [{ slug: '', title: 'Overview', file: 'README.md', sections: ['', 'Quick start'] }] },
      {
        title: 'Guide',
        pages: [
          { slug: 'core-concepts', file: 'README.md', section: 'Core concepts', blurb: 'Fields, filters, updates, queries, sessions, aggregation, change streams' },
          { slug: 'bson-codecs', file: 'README.md', section: 'BSON codecs', blurb: 'bson-direct, the bridges, and the driver’s registry' },
          { slug: 'repositories', file: 'README.md', section: 'Repositories', blurb: 'BaseMongoRepository, pages and counters' },
          { slug: 'runtime-backends', file: 'README.md', section: 'Runtime backends', blurb: 'cats-effect, ZIO, Kyo and rapid, and the bridge between them and the driver' },
          { slug: 'modules', file: 'README.md', section: 'Modules', blurb: 'Every artifact, and what each one promises' },
        ],
      },
      {
        title: 'Reference',
        pages: [
          { slug: 'benchmarks', file: 'BENCHMARKS.md', blurb: 'Codec backends, the wire codec, and real MongoDB on every runtime' },
          { slug: 'design', file: 'DESIGN.md', blurb: 'Why the library is shaped the way it is' },
          { slug: 'compatibility', file: 'COMPATIBILITY.md', title: 'Compatibility & migration', blurb: 'What each release promises, and how to move between them' },
          { slug: 'changelog', file: 'CHANGELOG.md' },
          { slug: 'roadmap', file: 'ROADMAP.md' },
        ],
      },
      { title: 'Project', pages: [{ slug: 'contributing', file: 'CONTRIBUTING.md', title: 'Contributing' }] },
    ],
    aliases: { benchmarks: 'BENCHMARKS.md', 'design-notes': 'DESIGN.md', contributing: 'CONTRIBUTING.md', license: 'LICENSE' },
    legacy: {
      start: '#quick-start',
      core: 'core-concepts/',
      queries: 'core-concepts/#filters',
      'partial-reads': 'core-concepts/#partial-reads',
      results: 'core-concepts/#results',
      errors: 'core-concepts/#errors-the-server-raises',
      keys: 'core-concepts/#primary-keys',
      sessions: 'core-concepts/#sessions--transactions',
      aggregation: 'core-concepts/#aggregation-pipelines',
      expressions: 'core-concepts/#aggregation-expressions',
      indexes: 'core-concepts/#indexes',
      search: 'core-concepts/#atlas-search',
      'create-collection': 'core-concepts/#creating-a-collection',
      codecs: 'bson-codecs/',
      registry: 'bson-codecs/#codecs-and-the-drivers-registry',
      repositories: 'repositories/',
      counters: 'repositories/#counters',
      runtime: 'runtime-backends/',
      'bridge-config': 'runtime-backends/#bridge-configuration',
      modules: 'modules/',
      compatibility: 'modules/#compatibility',
      benchmarks: 'benchmarks/',
      'talking-to-a-server': 'benchmarks/#talking-to-a-server',
      'runtime-overhead': 'benchmarks/#runtime-overhead--real-mongodb-every-backend',
      design: 'design/',
      principles: 'design/#principles',
      'design-shape': 'design/#the-shape-mirror-the-driver',
      'design-effect': 'design/#effect-agnostic-by-construction',
      'design-codecs': 'design/#codecs-are-per-collection-never-global',
      'design-astfree': 'design/#the-ast-free-path',
      'design-ast': 'design/#the-query-ast',
      'design-reads': 'design/#reads-strict-by-default-lenient-on-request',
      'design-streaming': 'design/#streaming',
      'design-transactions': 'design/#transactions',
      'design-watch': 'design/#change-streams',
      'design-repositories': 'design/#repositories-and-one-ast-with-two-interpreters',
      'design-expressions': 'design/#aggregation-expressions-are-a-phantom-typed-tree',
      'design-next-scala': 'design/#the-integration-tests-compile-on-the-next-scala',
      'design-search': 'design/#search-a-typed-core-a-raw-edge',
      'design-conditional': 'design/#insert-if-absent-writes-only-on-insert',
      'design-evolution': 'design/#evolving-the-api',
      'design-rejected': 'design/#deliberately-not-done',
    },
  },
  {
    id: 'logging4s',
    no: '02',
    what: 'Logging for Scala 3',
    repo: 'Sendline-now/logging4s',
    ref: 'main', // the docs are ahead of v7.0.0; back to a tag at the next release
    description: 'Structured logging for Scala 3: describe how a type renders once with Loggable, and log values directly.',
    versions: { scala: 'scalaLTS', cats: 'catsEffect', zio: 'zio', kyo: 'kyo', rapid: 'rapid' },
    chips: () => [],
    jdk: { base: '17', notes: [['kyo', '25']] },
    install: { runtime: 'logging4s-{rt}', modules: ['logging4s-logback'], import: 'logging4s.{rt}' },
    installNote: 'A backend goes next to the runtime: logback here, or log4j2, slf4j or the console. <code>logging4s-kyo</code> needs JDK 25; every other module runs on JDK 17.',
    javadoc: 'logging4s-core_3',
    lane: {
      text: 'Structured logging. Describe how a type renders once with <strong><code>Loggable[A]</code></strong>, log values directly, and get JSON and a readable message from the same call.',
      chips: () => ['logback · log4j2 · slf4j · console'],
      third: { title: 'Migration', slug: 'migration' },
    },
    next: ['loggable', 'logging', 'backends', 'configuration'],
    groups: [
      { title: 'Start', pages: [{ slug: '', title: 'Overview', file: 'README.md', sections: ['', 'Quick start'] }] },
      {
        title: 'Guide',
        pages: [
          { slug: 'loggable', file: 'README.md', section: 'The Loggable type class', blurb: 'Derivation, named tuples, existing codecs and per-field policies' },
          { slug: 'logging', file: 'README.md', section: 'Logging', blurb: 'Loggers, context that follows a fiber, and testing' },
          { slug: 'backends', file: 'README.md', section: 'Backends', blurb: 'logback, log4j2, slf4j and the standalone console' },
          { slug: 'configuration', file: 'README.md', section: 'Configuration', blurb: 'How values render, from one config' },
          { slug: 'modules', file: 'README.md', section: 'Modules', blurb: 'Every artifact, and what each one promises' },
        ],
      },
      {
        title: 'Reference',
        pages: [
          { slug: 'benchmarks', file: 'README.md', section: 'Benchmarks' },
          { slug: 'migration', file: 'README.md', section: 'Migration' },
          { slug: 'design', file: 'README.md', section: 'Design notes' },
        ],
      },
      { title: 'Project', pages: [{ slug: 'contributing', file: 'CONTRIBUTING.md', title: 'Contributing' }] },
    ],
    aliases: { contributing: 'CONTRIBUTING.md', license: 'LICENSE' },
    legacy: {
      start: '#quick-start',
      loggable: 'loggable/',
      logging: 'logging/',
      backends: 'backends/',
      config: 'configuration/',
      modules: 'modules/',
      benchmarks: 'benchmarks/',
      migration: 'migration/',
    },
  },
  {
    id: 'metrics4s',
    no: '03',
    what: 'Metrics for Scala 3',
    repo: 'Sendline-now/metrics4s',
    ref: 'v0.2.0',
    description: 'Typed, effect-agnostic metrics for Scala 3 on the native Prometheus Java client: a badly named metric is a compile error.',
    versions: { scala: 'scala3', cats: 'catsEffect', zio: 'zio', kyo: 'kyo', rapid: 'rapid' },
    chips: (v) => [['Prometheus client', v.prometheus]],
    jdk: { base: '17', notes: [['rapid', '21'], ['kyo', '25']] },
    install: { runtime: 'metrics4s-{rt}', modules: ['metrics4s-prometheus'], import: 'metrics4s.runtime.{rt}' },
    installNote: '<code>metrics4s-rapid</code> needs JDK 21 and <code>metrics4s-kyo</code> JDK 25; every other module runs on JDK 17.',
    javadoc: 'metrics4s-core_3',
    lane: {
      text: 'Typed metrics on the native Prometheus Java client. <strong>A badly named metric is a compile error</strong>, a unit is a type, and every series exists from the first scrape.',
      chips: (v) => [`Prometheus client ${v.prometheus}`, 'Grafana dashboards'],
      third: { title: 'Recipes', slug: 'recipes' },
    },
    next: ['defining-metrics', 'recording', 'recipes', 'dashboards'],
    groups: [
      { title: 'Start', pages: [{ slug: '', title: 'Overview', file: 'README.md', sections: ['', 'Quick start', 'Running it in a service'] }] },
      {
        title: 'Guide',
        pages: [
          { slug: 'defining-metrics', file: 'README.md', section: 'Defining metrics', blurb: 'Counters, gauges and histograms as values, and their labels' },
          { slug: 'recording', file: 'README.md', section: 'Recording', blurb: 'Recording from an effect, and timing one' },
          { slug: 'scrape-time', file: 'README.md', section: 'Reading at scrape time' },
          { slug: 'runtimes', file: 'README.md', section: 'Runtimes' },
          { slug: 'prometheus', file: 'README.md', section: 'The Prometheus backend' },
          { slug: 'testing', file: 'README.md', section: 'Testing' },
          { slug: 'dashboards', file: 'README.md', section: 'Dashboards', blurb: 'Grafana dashboards and README tables from the same definitions' },
          { slug: 'integrations', file: 'README.md', section: 'Integrations' },
          { slug: 'modules', file: 'README.md', section: 'Modules' },
          { slug: 'known-gaps', file: 'README.md', section: 'Known gaps' },
        ],
      },
      {
        title: 'Reference',
        pages: [
          { slug: 'recipes', file: 'RECIPES.md', blurb: 'A ZIO service, labels known at startup, errors as a label, and more' },
          { slug: 'benchmarks', file: 'BENCHMARKS.md' },
          { slug: 'design', file: 'DESIGN.md' },
          { slug: 'compatibility', file: 'COMPATIBILITY.md' },
          { slug: 'changelog', file: 'CHANGELOG.md' },
          { slug: 'roadmap', file: 'ROADMAP.md' },
        ],
      },
      { title: 'Project', pages: [{ slug: 'contributing', file: 'CONTRIBUTING.md', title: 'Contributing' }] },
    ],
    aliases: { contributing: 'CONTRIBUTING.md', license: 'LICENSE' },
    legacy: {},
  },
];

// The hub's own copy. Every claim here has its source beside it.
export const hub = {
  lead: 'Three Scala 3 libraries — a MongoDB client, structured logging and typed metrics — built the same way: <strong>no core module depends on an effect system</strong>, and cats-effect, ZIO, Kyo or rapid plug in through a <code>given</code> import. Apache 2.0, on Maven Central.',
  principles: [
    // each library's README, first paragraph: "core depends on neither" / "no dependency on any of them" / "depends on nothing"
    ['Cores depend on nothing', 'No cats-effect, ZIO or Kyo in any <code>core</code> module. Runtimes, backends and codecs are separate modules you add.'],
    ['Swap a module, keep the code', 'Changing runtime means one dependency and one <code>given</code> import. The code between them stays the same.'],
    // .github/workflows/ci.yml in all three runs mimaReportBinaryIssues; mongo4s CONTRIBUTING.md "README.md is checked
    // two ways", metrics4s build.sbt compiles it/docs
    ['Compatibility is checked, not promised', 'All three run MiMa against their previous releases in CI. mongo4s and metrics4s also check the code in their docs against the code itself.'],
  ],
  together: {
    // metrics4s README, Integrations: MongoMetrics(...).register[IO], listeners.applyTo(MongoClientSettings.builder()),
    // "mongo4s through MongoClientResource.fromSettings"; the series are the metrics4s-mongo row of its table
    title: 'A mongo4s client that reports its own latency',
    text: '<code>metrics4s-mongo</code> listens to the MongoDB driver. Hand its listeners to the settings you build a mongo4s client from, and commands, failures and the connection pool show up as Prometheus series.',
    series: ['mongo_command_seconds{command, collection}', 'mongo_command_failures_total{command, collection}', 'mongo_pool_connections{state}', 'mongo_pool_checkout_seconds'],
    code: `for
  listeners <- MongoMetrics(List("users", "events")).register[IO].toResource
  settings   = listeners.applyTo(MongoClientSettings.builder()).build()
  client    <- MongoClientResource.fromSettings[IO](settings)
yield client`,
  },
};
