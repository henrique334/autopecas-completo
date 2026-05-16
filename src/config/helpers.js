function toObjs(result) {
  if (!result?.length) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}
module.exports = { toObjs };
