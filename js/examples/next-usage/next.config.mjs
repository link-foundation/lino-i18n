export default {
  devIndicators: false,
  // Limit worker fan-out in this reproducible example and CI fixture.
  experimental: { cpus: 1 },
};
