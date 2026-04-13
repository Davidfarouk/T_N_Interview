const visitsPerTree = parseInt(process.env.VISITS_PER_TREE ?? '3', 10);

if (isNaN(visitsPerTree) || visitsPerTree < 1) {
  throw new Error(
    `Invalid VISITS_PER_TREE: "${process.env.VISITS_PER_TREE}". Must be a positive integer.`
  );
}

export const config = {
  PORT:            parseInt(process.env.PORT ?? '3000', 10),
  VISITS_PER_TREE: visitsPerTree,
};
