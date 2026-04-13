export const config = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  VISITS_PER_TREE: parseInt(process.env.VISITS_PER_TREE ?? '3', 10),
};
