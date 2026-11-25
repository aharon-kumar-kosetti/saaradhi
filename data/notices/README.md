# Test notices

Put your 10 real + 10 fake notices here.

    data/notices/
      real/   <- gitignored! redact names, addresses, consumer numbers before ANY sharing
        real_01.jpg  real_01.expected.json
      fake/
        fake_01.jpg  fake_01.expected.json

For each notice write an `*.expected.json` (copy `expected.example.json`). It is the ground truth the
agent tests against. Coverage tip: at least 2 per category, 3 in Telugu, 2 in Hindi, 2 blurry/rotated
photos, 2 PDFs, and fakes with different tricks (lookalike domain, QR to another site, shortened link,
urgency threats, wrong reference format).
